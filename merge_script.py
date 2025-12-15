import json
import os

# 파일명 설정 (필요시 수정하세요)
input_json_file = 'ItemTable.json'        # 원본 JSON 파일
input_names_file = 'translated_names.txt' # 번역된 이름 목록 파일
output_json_file = 'ItemTable_KR_NameOnly_KeepFormat.json' # 결과물 파일명

def merge_names():
    # 1. 파일 존재 여부 확인
    if not os.path.exists(input_json_file):
        print(f"오류: '{input_json_file}' 원본 파일을 찾을 수 없습니다.")
        return
    if not os.path.exists(input_names_file):
        print(f"오류: '{input_names_file}' 번역 파일을 찾을 수 없습니다.")
        return

    try:
        # 2. 원본 JSON 로드
        print("1. 원본 JSON 파일을 읽는 중...")
        with open(input_json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 3. 번역된 이름 파일 로드
        print("2. 번역된 이름 목록을 읽는 중...")
        with open(input_names_file, 'r', encoding='utf-8') as f:
            # 빈 줄을 제외하고 줄 단위로 읽어옵니다
            translated_names = [line.strip() for line in f]

        # 4. 병합 작업 (Name 필드만 교체)
        print("3. Name 필드 교체 작업 시작...")
        
        name_count = 0
        replaced_count = 0
        
        # JSON의 키 순서대로 순회
        for key in data:
            item = data[key]
            # 해당 항목에 'Name' 필드가 있는 경우에만 교체
            if 'Name' in item:
                if name_count < len(translated_names):
                    # 여기서 원본의 Name 값을 번역된 값으로 덮어씁니다.
                    item['Name'] = translated_names[name_count]
                    name_count += 1
                    replaced_count += 1
                else:
                    print(f"경고: 번역된 이름의 개수가 부족합니다. (현재 진행도: {name_count}번째)")
                    break
        
        # 5. 결과 저장
        print(f"4. 결과 파일 '{output_json_file}' 생성 중...")
        with open(output_json_file, 'w', encoding='utf-8') as f:
            # ensure_ascii=False: 한글 깨짐 방지
            # indent=2: 원본과 유사한 들여쓰기 유지
            json.dump(data, f, ensure_ascii=False, indent=2)

        print("-" * 30)
        print(f"✅ 완료! 총 {replaced_count}개의 이름이 변경되었습니다.")
        print(f"결과 파일: {output_json_file}")

    except Exception as e:
        print(f"⛔ 작업 중 오류가 발생했습니다: {e}")

if __name__ == '__main__':
    merge_names()