document.addEventListener('DOMContentLoaded', () => {
    // 1. 사용할 파일 이름 (ItemTable, RecipeTable, ConsumableItemTable)
    const itemTableUrl = 'ItemTable.json';         
    const recipeTableUrl = 'RecipeTable.json';     
    const consumableItemTableUrl = 'ConsumableItemTable.json'; 

    // 모든 데이터 파일을 비동기로 불러옵니다.
    Promise.all([
        fetch(itemTableUrl).then(res => res.json()),
        fetch(recipeTableUrl).then(res => res.json()),
        fetch(consumableItemTableUrl).then(res => res.json())
    ])
    .then(([itemData, recipeData, consumeData]) => {
        
        // --- 데이터 로드 진단 (콘솔 출력) ---
        console.log("--- 데이터 로드 결과 ---");
        console.log("ItemData 키 개수:", Object.keys(itemData).length);
        console.log("RecipeData 키 개수:", Object.keys(recipeData).length);
        console.log("ConsumeData 키 개수:", Object.keys(consumeData).length);
        
        const integratedRecipes = createIntegratedRecipes(itemData, recipeData, consumeData);
        
        // --- 통합 레시피 진단 (콘솔 출력) ---
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

            // 2. RecipeTable에 이름이 없으면, ItemTable에서 이름을 가져와 대체합니다.
            if (!recipeName) {
                const itemEntry = itemData[targetItemId];
                if (itemEntry && itemEntry.Name) {
                    recipeName = itemEntry.Name;
                } else {
                    recipeName = `미확인 레시피 ID: ${targetItemId}`;
                }
            }
            
            // 재료 목록 추출
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

    // --- UI 로직: 레시피 로드 및 드롭다운 생성 ---
    function loadRecipes(recipes) {
        const select = document.getElementById('recipe-select');
        // --- 디버그: material-list 요소가 제대로 잡혔는지 확인
        console.log("Material List Element:", document.getElementById('material-list')); 
        
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

    // --- UI 로직: 이벤트 리스너 설정 및 계산 ---
    function setupEventListeners(recipes) {
        const select = document.getElementById('recipe-select');
        const quantityInput = document.getElementById('quantity');
        const calculateButton = document.getElementById('calculate');
        const materialList = document.getElementById('material-list'); // <ul id="material-list">를 찾음
        
        // 이 시점에서 materialList가 null이 아닌지 확인했습니다.

        calculateButton.addEventListener('click', () => {
            
            // --- 디버그: 버튼 클릭 시 실행 확인
            console.log("--- 계산 시작 ---"); 
            
            const selectedRecipeName = select.value;
            const quantity = parseInt(quantityInput.value);

            if (!selectedRecipeName || isNaN(quantity) || quantity <= 0) {
                alert('제작할 아이템을 선택하고 유효한 수량을 입력해 주세요.');
                return;
            }

            const selectedRecipe = recipes.find(r => r.name === selectedRecipeName);

            // --- 디버그: 선택된 레시피 데이터 확인
            console.log("선택된 레시피:", selectedRecipe); 
            console.log("필요 재료 목록:", selectedRecipe.materials);

            if (!selectedRecipe) return;

            // 결과 목록 초기화
            materialList.innerHTML = '';
            let totalMaterials = {};
            let hasMaterials = false; // 재료가 있는지 확인하는 플래그

            // 1. 재료 소요량 계산
            selectedRecipe.materials.forEach(material => {
                
                // --- 디버그: 재료별 반복 처리 확인
                console.log(`재료 처리 중: ${material.name}, 필요 수량: ${material.required}`); 
                
                if (material.required > 0) { // required가 0보다 클 때만 처리
                    hasMaterials = true;
                    const totalRequired = material.required * quantity;
                    totalMaterials[material.name] = (totalMaterials[material.name] || 0) + totalRequired;
                }
            });
            
            // 2. 결과 출력
            if (!hasMaterials) {
                const li = document.createElement('li');
                li.textContent = '이 아이템은 제작에 재료가 필요하지 않거나 (0개), 재료 정보가 없습니다.';
                materialList.appendChild(li);
            } else {
                for (const name in totalMaterials) {
                    const li = document.createElement('li');
                    li.textContent = `${name}: ${totalMaterials[name]} 개`;
                    materialList.appendChild(li);
                }
            }
            console.log("--- 계산 종료 ---"); 
        });
    }
});