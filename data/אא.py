import re
import json
from pathlib import Path
import pandas as pd

INPUT_FILES = [
    "קבוצה 5 ותק 0.xlsx",
    "קבוצה 5 ותק 3.xlsx",
]

# תופס מספרים מהשם: "קבוצה 5 ותק 3.xlsx"
NAME_RE = re.compile(r"קבוצה\s*(\d+)\s*ותק\s*(\d+)", re.IGNORECASE)

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    # מכיוון שהקבצים שלך נראים עם כותרת בשורה הראשונה, pandas לרוב קורא נכון.
    # אבל ליתר ביטחון ננרמל שמות:
    rename = {
        'פעילות': 'פעילות',
        'דירוג': 'דירוג',
        "גמול א'": 'גמול_א',
        'דרגת שכר': 'דרגת_שכר',
        'תמריץ חדש': 'תמריץ_חדש',
        'סה"כ משכורת ': 'סהכ_משכורת',
        'סה"כ משכורת': 'סהכ_משכורת',
    }
    df = df.rename(columns=lambda c: str(c).strip())
    df = df.rename(columns=rename)

    # נשמור רק עמודות שאנחנו רוצים
    wanted = ['פעילות', 'דירוג', 'גמול_א', 'דרגת_שכר', 'תמריץ_חדש', 'סהכ_משכורת']
    missing = [c for c in wanted if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}. Columns found: {list(df.columns)}")

    return df[wanted]

def main():
    rows = []
    for fname in INPUT_FILES:
        m = NAME_RE.search(fname)
        if not m:
            raise ValueError(f"Filename doesn't match pattern 'קבוצה X ותק Y': {fname}")
        group = int(m.group(1))
        seniority = int(m.group(2))

        df = pd.read_excel(fname, sheet_name=0)
        df = normalize_columns(df)

        # ניקוי טיפוסים
        df['תמריץ_חדש'] = pd.to_numeric(df['תמריץ_חדש'], errors='coerce')
        df['סהכ_משכורת'] = pd.to_numeric(df['סהכ_משכורת'], errors='coerce')

        for r in df.to_dict(orient="records"):
            r['קבוצה'] = group
            r['ותק'] = seniority
            rows.append(r)

    out_dir = Path("data")
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "salaries.json"
    out_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ Wrote {len(rows)} rows to {out_path}")

if __name__ == "__main__":
    main()
