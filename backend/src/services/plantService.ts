import { supabaseAdmin } from '../config/supabase';
import {
  PlantGrade,
  PlantStage,
  PlantStatus,
  PLANT_DEFINITIONS,
  GRADE_PROBABILITIES,
  MAX_EXP
} from '../constants/plants';

export const getCollection = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('plants')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'collected')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const getCurrentPlant = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('plants')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'growing')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data || null;
};

const getUncollectedByGrade = async (userId: string): Promise<Record<PlantGrade, string[]>> => {
  const collection = await getCollection(userId);
  const collectedTypes = collection.map((p) => p.plant_type);

  const uncollected: Record<PlantGrade, string[]> = {
    common: [],
    rare: [],
    epic: []
  };

  PLANT_DEFINITIONS.forEach((plant) => {
    if (!collectedTypes.includes(plant.type)) {
      uncollected[plant.grade].push(plant.type);
    }
  });

  return uncollected;
};

const determineGrade = (uncollectedByGrade: Record<PlantGrade, string[]>): PlantGrade | null => {
  const availableGrades = Object.entries(GRADE_PROBABILITIES)
    .filter(([grade]) => uncollectedByGrade[grade as PlantGrade].length > 0);

  if (availableGrades.length === 0) return null;

  const totalProbability = availableGrades.reduce((sum, [, prob]) => sum + prob, 0);
  const random = Math.random() * totalProbability;

  let cumulative = 0;
  for (const [grade, probability] of availableGrades) {
    cumulative += probability;
    if (random < cumulative) {
      return grade as PlantGrade;
    }
  }
  return availableGrades[availableGrades.length - 1][0] as PlantGrade;
};

export const createNewSeed = async (userId: string) => {
  const uncollected = await getUncollectedByGrade(userId);
  const grade = determineGrade(uncollected);

  if (!grade) return null;

  const { data, error } = await supabaseAdmin
    .from('plants')
    .insert({
      user_id: userId,
      stage: 'seed',
      grade: grade,
      plant_type: 'unknown',
      status: 'growing',
      current_exp: 0
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const determinePlantType = async (grade: PlantGrade, userId: string): Promise<string> => {
  const uncollected = await getUncollectedByGrade(userId);
  const uncollectedInGrade = uncollected[grade];

  if (uncollectedInGrade.length === 0) {
    const allInGrade = PLANT_DEFINITIONS.filter((p) => p.grade === grade).map((p) => p.type);
    return allInGrade[Math.floor(Math.random() * allInGrade.length)];
  }

  const randomIndex = Math.floor(Math.random() * uncollectedInGrade.length);
  return uncollectedInGrade[randomIndex];
};

export const addExp = async (plantId: string, userId: string, amount: number) => {
  const { data: plant, error: fetchError } = await supabaseAdmin
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .single();

  if (fetchError) throw fetchError;
  if (plant.status === 'collected') return plant;

  let newExp = Number(plant.current_exp) + amount;
  let newStage = plant.stage;
  let newType = plant.plant_type;
  let newStatus = plant.status;

  if (newExp >= MAX_EXP) {
    if (plant.stage === 'seed') {
      newStage = 'sprout';
      newExp = 0;
    } 
    else if (plant.stage === 'sprout') {
      newStage = 'plant';
      newExp = 0;
      newType = await determinePlantType(plant.grade as PlantGrade, userId);
    } 
    else if (plant.stage === 'plant') {
      newStatus = 'collected';
      newExp = MAX_EXP;
    }
  }

  const { data: updatedPlant, error: updateError } = await supabaseAdmin
    .from('plants')
    .update({
      stage: newStage,
      plant_type: newType,
      status: newStatus,
      current_exp: newExp
    })
    .eq('id', plantId)
    .select()
    .single();

  if (updateError) throw updateError;

  if (newStatus === 'collected') {
    await createNewSeed(userId);
  }

  return updatedPlant;
};
