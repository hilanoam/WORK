import pandas as pd
import json

xlsx_path = r"טבלת_משכורות_מתוקנת_למחשבון.xlsx"  # שימי פה נתיב אמיתי
df = pd.read_excel(xlsx_path, sheet_name="DATA_LONG")

# לוודא שמספרים לא יוצאים NaN וששדות טקסט נקיים
df = df.fillna("")
df["תחנה_מבצעית"] = df["תחנה_מבצעית"].astype(int)

data = df.to_dict(orient="records")

with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ נוצר data.json")
