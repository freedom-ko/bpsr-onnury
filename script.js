document.addEventListener('DOMContentLoaded', () => {
    const itemTableUrl = 'ItemTable.json';
    const recipeTableUrl = 'RecipeTable.json';
    const consumableItemTableUrl = 'ConsumableItemTable.json';

    // 1. 모든 데이터 파일을 비동기로 불러옵니다.
    Promise.all([
        fetch(itemTableUrl).then(res => res.json()),
        fetch(recipeTableUrl).then(res => res.json()),
        fetch(consumableItemTableUrl).then(res => res.json())
    ])
    .then(([itemData, recipeData, consumeData]) => {
        // 2. 통합 레시피 목록을 생성합니다.
        const integratedRecipes = createIntegratedRecipes(itemData, recipeData, consumeData);
        
        // 3. 웹페이지에 레시피를 로드하고 이벤트 리스너를 설정합니다.
        loadRecipes(integratedRecipes);
        setupEventListeners(integratedRecipes);
    })
    .catch(error => {
        console.error('데이터 로드 중 오류 발생:', error);
        alert('데이터 파일을 불러오는 데 실패했습니다. 파일이 저장소에 있는지 확인해 주세요.');
    });

    // --- 핵심 로직: 3개의 JSON 데이터를 하나로 통합 ---
    function createIntegratedRecipes(itemData, recipeData, consumeData) {
        const recipes = [];
        
        // consumeData는 제작 아이템 ID를 키로 가지고 있습니다.
        for (const consumeId in consumeData) {
            const consumeEntry = consumeData[consumeId];
            
            // 제작 결과물 ID를 가져옵니다. (ConsumableItemTable의 GetItemList 배열의 첫 번째 요소의 두 번째 값)
            // ex) GetItemList: [[200504, 3000042]] -> [1]번째 값 (3000042)이 우리가 원하는 최종 아이템 ID입니다.
            const targetItemId = consumeEntry.GetItemList[0] ? consumeEntry.GetItemList[0][1] : null;

            if (!targetItemId) continue;

            // RecipeTable에서 제작 아이템의 이름을 가져옵니다.
            const recipeName = recipeData[targetItemId] ? recipeData[targetItemId].Name : null;
            
            // 이름이 없다면 건너뜁니다.
            if (!recipeName) continue;
            
            const materials = [];
            
            // ConsumeList의 재료들을 반복 처리합니다.
            consumeEntry.ConsumeList.forEach(([materialId, quantity]) => {
                const materialItem = itemData[materialId];
                
                // ItemTable에서 재료의 이름을 가져옵니다.
                const materialName = materialItem ? materialItem.Name : '알 수 없는 재료 ID: ' + materialId;
                
                materials.push({
                    name: materialName,
                    required: parseInt(quantity) // 수량을 정수로 변환
                });
            });

            // 최종 레시피 객체를 통합 목록에 추가
            recipes.push({
                name: recipeName,
                materials: materials
            });
        }
        
        // 레시피 이름을 기준으로 정렬 (선택 사항)
        recipes.sort((a, b) => a.name.localeCompare(b.name));
        
        return recipes;
    }

    // --- UI 로직: 레시피 로드 및 드롭다운 생성 ---
    function loadRecipes(recipes) {
        const select = document.getElementById('recipe-select');
        select.innerHTML = ''; // 기존 목록 초기화
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '제작할 아이템 선택';
        select.appendChild(defaultOption);

        // 레시피 목록 추가
        recipes.forEach(recipe => {
            const option = document.createElement('option');
            option.value = recipe.name;
            option.textContent = recipe.name;
            select.appendChild(option);
        });
    }

    // --- UI 로직: 이벤트 리스너 설정 및 계산 ---
    function setupEventListeners(recipes) {
        const select = document.getElementById('recipe-select');
        const quantityInput = document.getElementById('quantity');
        const calculateButton = document.getElementById('calculate');
        const materialList = document.getElementById('material-list');

        calculateButton.addEventListener('click', () => {
            const selectedRecipeName = select.value;
            const quantity = parseInt(quantityInput.value);

            if (!selectedRecipeName || isNaN(quantity) || quantity <= 0) {
                alert('제작할 아이템을 선택하고 유효한 수량을 입력해 주세요.');
                return;
            }

            const selectedRecipe = recipes.find(r => r.name === selectedRecipeName);

            if (!selectedRecipe) return;

            materialList.innerHTML = '';
            let totalMaterials = {};

            // 1. 재료 소요량 계산
            selectedRecipe.materials.forEach(material => {
                const totalRequired = material.required * quantity;
                totalMaterials[material.name] = (totalMaterials[material.name] || 0) + totalRequired;
            });

            // 2. 결과 출력
            for (const name in totalMaterials) {
                const li = document.createElement('li');
                li.textContent = `${name}: ${totalMaterials[name]} 개`;
                materialList.appendChild(li);
            }
        });
    }

    // --- 기존 data.json 파일을 불러오지 않으므로, 이 부분을 제거했습니다. ---
});