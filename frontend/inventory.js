const PLANT_NAME_MAP = {
  daisy: '데이지', tulip: '튤립', sunflower: '해바라기', rose: '장미',
  lavender: '라벤더', monkey_tail_cactus: '원숭이 꼬리선인장', hibiscus: '히비스커스',
  lily: '백합', aloe: '알로에', lily_of_the_valley: '은방울 꽃'
};

const GRADE_INFO = {
  common: { label: '일반', className: 'common', count: 4, plants: ['daisy', 'tulip', 'sunflower', 'rose'] },
  rare: { label: '희귀', className: 'rare', count: 3, plants: ['lavender', 'monkey_tail_cactus', 'hibiscus'] },
  epic: { label: '에픽', className: 'epic', count: 3, plants: ['lily', 'aloe', 'lily_of_the_valley'] }
};

document.addEventListener('DOMContentLoaded', () => {
  fetchInventoryData();
});

async function fetchInventoryData() {
  try {
    const [currentRes, collectionRes] = await Promise.all([
      fetch('/api/plants/current'),
      fetch('/api/plants/collection')
    ]);

    if (currentRes.status === 401 || collectionRes.status === 401) {
      window.location.href = '/login';
      return;
    }

    const currentData = await currentRes.json();
    const collectionData = await collectionRes.json();

    renderCurrentPlant(currentData.plant);
    renderCollection(collectionData.collection);
  } catch (error) {
    console.error('Failed to load inventory:', error);
  }
}

function renderCurrentPlant(plant) {
  const container = document.getElementById('current-plant-container');

  if (!plant) {
    container.innerHTML = `
      <div class="card current-plant-card" style="justify-content: center; align-items: center; padding: 40px;">
        <p style="color: var(--color-primary-dark); font-weight: 700;">모든 식물을 다 수집했어요! 🎉</p>
      </div>
    `;
    return;
  }

  const gradeInfo = GRADE_INFO[plant.grade];

  let imgName = plant.stage === 'seed' ? 'seed' : (plant.stage === 'sprout' ? 'sprout' : plant.plant_type);
  let plantName = plant.stage === 'seed' ? '씨앗' : (plant.stage === 'sprout' ? '새싹' : PLANT_NAME_MAP[plant.plant_type]);
  let plantDesc = plant.stage === 'seed' ? '어떤 식물이 될까요?' : (plant.stage === 'sprout' ? '건강하게 자라고 있어요!' : '곧 수집할 수 있어요!');

  let stageLabel = plant.stage === 'seed' ? '1단계' : (plant.stage === 'sprout' ? '2단계' : '3단계');

  container.innerHTML = `
    <div class="card current-plant-card">
        <div class="current-plant-img-box">
            <img src="/assets/${imgName}.png" alt="${plantName}" onerror="this.src='/assets/sprout.png'">
        </div>
        <div class="current-plant-info">
            <span class="badge-current">현재 키우는 식물</span>
            <div class="current-plant-title-row">
                <span class="current-plant-name">${plantName}</span>
                <span class="current-plant-level">${stageLabel}</span>
                <span class="badge-grade ${gradeInfo.className}">${gradeInfo.label} 등급</span>
            </div>
            <p class="current-plant-desc">${plantDesc}</p>
            <div class="exp-header">
                <span class="exp-label">EXP</span>
                <span>${plant.current_exp} / 100</span>
            </div>
            <div class="exp-bar-container">
                <div class="exp-bar-fill ${gradeInfo.className}" style="width: ${plant.current_exp}%;"></div>
            </div>
            <p class="exp-footer">다음 단계까지 ${100 - plant.current_exp} EXP</p>
        </div>
    </div>
  `;
}

function renderCollection(collection) {
  const container = document.getElementById('collection-groups-container');
  const countSpan = document.getElementById('total-collection-count');

  const collectedTypes = new Set(collection.map(p => p.plant_type));

  countSpan.textContent = `${collectedTypes.size} / 10`;

  let html = '';

  ['common', 'rare', 'epic'].forEach(grade => {
    const info = GRADE_INFO[grade];
    const collectedInGrade = info.plants.filter(p => collectedTypes.has(p));

    let itemsHtml = info.plants.map(plantType => {
      const isCollected = collectedTypes.has(plantType);

      if (isCollected) {
        const name = PLANT_NAME_MAP[plantType];
        return `
          <div class="collection-item">
              <div class="collection-img-box">
                  <img src="/assets/${plantType}.png" alt="${name}" onerror="this.src='/assets/sprout.png'">
              </div>
              <span class="collection-item-name">${name}</span>
          </div>
        `;
      } else {
        return `
          <div class="collection-item locked">
              <div class="collection-img-box">
                  <img src="/assets/lock.svg" alt="잠금 아이콘" onerror="this.src=''">
              </div>
              <span class="collection-item-name">???</span>
          </div>
        `;
      }
    }).join('');

    html += `
      <div class="grade-group-card">
          <div class="grade-group-header">
              <div class="grade-group-title-wrapper">
                  <div class="grade-dot ${info.className}"></div>
                  <span class="grade-group-title">${info.label}</span>
              </div>
              <span class="grade-group-count">${collectedInGrade.length} / ${info.count}</span>
          </div>
          <div class="collection-grid-4col">
              ${itemsHtml}
          </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
