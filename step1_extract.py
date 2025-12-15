import json
import os

input_file = 'ItemTable.json'
output_file = 'names_to_translate.txt'

# 파일이 존재하는지 확인
if not os.path.exists(input_file):
    print(f"오류: '{input_file}' 파일을 찾을 수 없습니다. 파일이 스크립트와 같은 폴더에 있는지 확인해주세요.")
else:
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Name 필드만 추출하여 텍스트 파일로 저장
        names_list = []
        for key, item in data.items():
            if 'Name' in item:
                names_list.append(item['Name'])

        with open(output_file, 'w', encoding='utf-8') as out_f:
            for name in names_list:
                out_f.write(name + '\n')
        
        print(f"성공: 총 {len(names_list)}개의 이름이 '{output_file}' 파일에 추출되었습니다.")
        print("이제 2단계로 이동하여 추출된 텍스트 파일의 내용을 번역해주세요.")

    except json.JSONDecodeError:
        print(f"오류: '{input_file}' 파일의 JSON 형식이 올바르지 않습니다.")
    except Exception as e:
        print(f"알 수 없는 오류 발생: {e}")

# 실행 방법 (터미널/명령 프롬프트에서):
# python step1_extract.py