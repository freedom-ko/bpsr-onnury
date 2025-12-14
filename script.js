let allRecipes = []; // JSON 데이터를 저장할 전역 변수

/**
 * 1. data.json 파일을 불러와서 레시피 데이터를 가져옵니다.
 * 2. 아이템 선택 드롭다운에 옵션을 채웁니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json') // data.json 파일을 불러옵니다.
        .then(response => response.json()) // 응답을 JSON 형식으로 변환합니다.
        .then(data => {
            allRecipes = data; // 데이터를 전역 변수에 저장
            populateItemDropdown(data); // 드롭다운 메뉴를 채웁니다.
        })
        .catch(error => console.error('Error loading the recipes:', error));
});

/**
 * 드롭다운 메뉴에 아이템 목록을 채우는 함수
 */
function populateItemDropdown(recipes) {
    const dropdown = document.getElementById('crafting-item');
    recipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.id; // HTML에서는 id를 사용하고
        option.textContent = recipe.name; // 사용자에게는 이름을 보여줍니다.
        dropdown.appendChild(option);
    });
}

/**
 * 3. 아이템 선택 시, 해당 레시피의 상세 정보를 화면에 표시하고 부족분을 계산합니다.
 */
function loadRecipeDetails() {
    const selectedId = document.getElementById('crafting-item').value;
    const detailsContainer = document.getElementById('recipe-details');
    const resultElement = document.getElementById('result');
    
    // 아이템이 선택되지 않았을 경우 초기화
    if (!selectedId) {
        detailsContainer.innerHTML = '<p>아이템을 선택하면 여기에 필요한 재료 목록이 표시됩니다.</p>';
        resultElement.innerText = '';
        return;
    }

    // 선택된 레시피 찾기
    const selectedRecipe = allRecipes.find(r => r.id === selectedId);
    
    if (!selectedRecipe) return;

    // 레시피 상세 정보를 HTML 문자열로 생성
    let htmlContent = `<h3>필요 재료 (${selectedRecipe.name})</h3><table><thead><tr><th>재료명</th><th>필요 수량</th><th>보유 수량 (입력)</th><th>부족 수량</th></tr></thead><tbody>`;
    let totalDeficit = 0; // 총 부족분을 계산할 변수

    selectedRecipe.materials.forEach(material => {
        // 길드원이 입력할 보유 수량 입력창
        const inputId = `current-count-${material.name}`;
        
        // **재료 부족분 계산 로직**
        // 여기서는 간단하게 30이라는 값을 임의의 보유량으로 가정합니다. (4단계에서 실제 길드 데이터를 연결해야 함)
        const assumedCurrentCount = 30; 
        const deficit = Math.max(0, material.required - assumedCurrentCount);
        totalDeficit += deficit;

        htmlContent += `
            <tr>
                <td>${material.name}</td>
                <td>${material.required}</td>
                <td><input type="number" id="${inputId}" value="${assumedCurrentCount}" min="0" oninput="recalculateDeficit('${material.name}', ${material.required})"></td>
                <td id="deficit-${material.name}" style="color: ${deficit > 0 ? 'red' : 'green'}; font-weight: bold;">${deficit}</td>
            </tr>
        `;
    });

    htmlContent += '</tbody></table>';
    
    detailsContainer.innerHTML = htmlContent;
    
    // 최종 결과 표시
    updateTotalResult(totalDeficit);
}

/**
 * 4. 보유 수량 입력이 바뀔 때마다 개별 부족분을 재계산하는 함수
 */
function recalculateDeficit(materialName, required) {
    const inputId = `current-count-${materialName}`;
    const deficitId = `deficit-${materialName}`;
    
    const currentCount = parseInt(document.getElementById(inputId).value) || 0;
    const deficit = Math.max(0, required - currentCount);

    const deficitElement = document.getElementById(deficitId);
    deficitElement.innerText = deficit;
    deficitElement.style.color = deficit > 0 ? 'red' : 'green';

    // 총 부족분 업데이트 (모든 재료의 부족분 합산)
    updateTotalResult();
}

/**
 * 5. 총 부족분 결과를 업데이트하는 함수
 */
function updateTotalResult() {
    const selectedId = document.getElementById('crafting-item').value;
    const selectedRecipe = allRecipes.find(r => r.id === selectedId);
    if (!selectedRecipe) return;

    let grandTotalDeficit = 0;
    
    // 모든 재료의 현재 부족분을 다시 합산
    selectedRecipe.materials.forEach(material => {
        const deficitElement = document.getElementById(`deficit-${material.name}`);
        // parseInt로 화면에 표시된 부족 수량을 가져와서 합산
        grandTotalDeficit += parseInt(deficitElement.innerText); 
    });

    const resultElement = document.getElementById('result');
    if (grandTotalDeficit > 0) {
        resultElement.innerText = `총 제작에 필요한 부족 재료 수량: ${grandTotalDeficit}개`;
        resultElement.style.color = 'red';
    } else {
        resultElement.innerText = `총 재료 충분! 지금 바로 제작 가능합니다.`;
        resultElement.style.color = 'green';
    }
}