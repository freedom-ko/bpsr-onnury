document.addEventListener('DOMContentLoaded', () => {
    const itemTableUrl = 'ItemTable.json';         
    const recipeTableUrl = 'RecipeTable.json';     
    const consumableItemTableUrl = 'ConsumableItemTable.json'; 

    Promise.all([
        fetch(itemTableUrl).then(res => res.json()),
        fetch(recipeTableUrl).then(res => res.json()),
        fetch(consumableItemTableUrl).then(res => res.json())
    ])
    .then(([itemData, recipeData, consumeData]) => {
        
        // 🚨 진단 코드 1: 원본 데이터가 비었는지 확인
        console.log("ItemData 키 개수:", Object.keys(itemData).length);
        console.log("RecipeData 키 개수:", Object.keys(recipeData).length);
        console.log("ConsumeData 키 개수:", Object.keys(consumeData).length);
        
        const integratedRecipes = createIntegratedRecipes(itemData, recipeData, consumeData);
        
        // 🚨 진단 코드 2: 통합 레시피 목록이 비었는지 확인
        console.log("통합 레시피 개수:", integratedRecipes.length);

        loadRecipes(integratedRecipes);
        setupEventListeners(integratedRecipes);
    })
    .catch(error => {
        console.error('데이터 로드 중 오류 발생:', error);
        alert('데이터 파일을 불러오는 데 실패했습니다. 파일 이름과 JSON 형식을 확인해 주세요.');
    });

    // --- 핵심 로직: 3개의 JSON 데이터를 하나로 통합 ---
    function createIntegratedRecipes(itemData, recipeData, consumeData) {
        const recipes = [];
        
        for (const consumeId in consumeData) {
            const consumeEntry = consumeData[consumeId];
            
            const targetItemId = consumeEntry.GetItemList[0] ? consumeEntry.GetItemList[0][1] : null;

            if (!targetItemId) continue;

            // 1. RecipeTable에서 제작 아이템의 이름 ('Name')을 가져옵니다.
            let recipeName = recipeData[targetItemId] ? recipeData[targetItemId].Name : null;

            // 2. RecipeTable에 이름이 없으면, ItemTable에서 이름을 가져와 대체합니다. (NEW LOGIC)
            if (!recipeName) {
                const itemEntry = itemData[targetItemId];
                if (itemEntry && itemEntry.Name) {
                    recipeName = itemEntry.Name;
                } else {
                    recipeName = `미확인 레시피 ID: ${targetItemId}`;
                }
            }
            
            // 이름이 할당되지 않은 레시피는 건너뛰지 않습니다.
            
            const materials = [];
            
            consumeEntry.ConsumeList.forEach(([materialId, quantity]) => {
                const materialItem = itemData[materialId];
                
                const materialName = materialItem ? materialItem.Name : '알 수 없는 재료 ID: ' + materialId;
                
                materials.push({
                    name: materialName,
                    required: parseInt(quantity)
                });
            });

            recipes.push({
                name: recipeName,
                materials: materials
            });
        }
        
        recipes.sort((a, b) => a.name.localeCompare(b.name));
        
        return recipes;
    }

    // --- UI 로직: 레시피 로드 및 드롭다운 생성 (이하 동일) ---
    function loadRecipes(recipes) {
        const select = document.getElementById('recipe-select');
        select.innerHTML = '';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '제작할 아이템 선택';
        select.appendChild(defaultOption);

        recipes.forEach(recipe => {
            const option = document.createElement('option');
            option.value = recipe.name;
            option.textContent = recipe.name;
            select.appendChild(option);
        });
    }

    // --- UI 로직: 이벤트 리스너 설정 및 계산 (이하 동일) ---
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
});