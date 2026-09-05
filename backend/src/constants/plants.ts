export type PlantGrade = 'common' | 'rare' | 'epic';
export type PlantStage = 'seed' | 'sprout' | 'plant';
export type PlantStatus = 'growing' | 'collected';

export interface PlantDefinition {
  type: string;
  grade: PlantGrade;
}

export const PLANT_DEFINITIONS: PlantDefinition[] = [
  // 일반 (50%)
  { type: 'daisy', grade: 'common' },
  { type: 'tulip', grade: 'common' },
  { type: 'sunflower', grade: 'common' },
  { type: 'rose', grade: 'common' },
  
  // 희귀 (30%)
  { type: 'lavender', grade: 'rare' },
  { type: 'monkey_tail_cactus', grade: 'rare' },
  { type: 'hibiscus', grade: 'rare' },
  
  // 에픽 (20%)
  { type: 'lily', grade: 'epic' },
  { type: 'aloe', grade: 'epic' },
  { type: 'lily_of_the_valley', grade: 'epic' },
];

// 영문 식별자 -> 한글 이름 매핑
export const PLANT_NAME_MAP: Record<string, string> = {
  daisy: '데이지',
  tulip: '튤립',
  sunflower: '해바라기',
  rose: '장미',
  lavender: '라벤더',
  monkey_tail_cactus: '원숭이 꼬리선인장',
  hibiscus: '히비스커스',
  lily: '백합',
  aloe: '알로에',
  lily_of_the_valley: '은방울 꽃',
};

// 등급별 확률
export const GRADE_PROBABILITIES: Record<PlantGrade, number> = {
  common: 0.5,
  rare: 0.3,
  epic: 0.2,
};

// 다음 단계로 넘어가기 위한 최대 경험치
export const MAX_EXP = 100;

// 전체 수집 가능한 식물 종의 수
export const TOTAL_PLANT_COUNT = PLANT_DEFINITIONS.length;
