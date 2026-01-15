import json

with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("data.js", "w", encoding="utf-8") as f:
    f.write("window.SALARY_DATA = ")
    json.dump(data, f, ensure_ascii=False)
    f.write(";\n")

print("✅ נוצר data.js")
