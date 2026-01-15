// app.js
const els = {
  activity: document.getElementById("activity"),
  rankBefore: document.getElementById("rankBefore"),
  seniority: document.getElementById("seniority"),
  ratingBefore: document.getElementById("ratingBefore"),
  operational: document.getElementById("operational"),
  appointment: document.getElementById("appointment"),
  officerRating: document.getElementById("officerRating"),
  calcBtn: document.getElementById("calcBtn"),
  results: document.getElementById("results"),
};

els.activityCards = document.getElementById("activityCards");
els.population = document.getElementById("population");
els.operationalSeg = document.getElementById("operationalSeg");
els.resetBtn = document.getElementById("resetBtn");


let DATA = [];

const normalize = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
const moneyILS = (n) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(Number(n));

function uniq(arr) {
  return [...new Set(arr)];
}

function wireSegment(containerEl, hiddenSelectEl) {
  const buttons = [...containerEl.querySelectorAll(".seg-btn")];
  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      buttons.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      hiddenSelectEl.value = b.dataset.value;
      hiddenSelectEl.dispatchEvent(new Event("change"));
    });
  });
}

function setOptions(selectEl, values, placeholder = "בחרי...") {
  selectEl.innerHTML = "";
  const p = document.createElement("option");
  p.value = "";
  p.textContent = placeholder;
  selectEl.appendChild(p);

  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function filterBase() {
  const a = normalize(els.activity.value);
  const rb = normalize(els.rankBefore.value);
  const s = normalize(els.seniority.value);
  const db = normalize(els.ratingBefore.value);

  return DATA.filter((r) => {
    return (
      normalize(r["רמת פעילות"]) === a &&
      normalize(r["דרגה לפני"]) === rb &&
      normalize(r["וותק (שנים)"]) === s &&
      normalize(r["דירוג_לפני"]) === db
    );
  });
}

function findOne(rows, stage, operational, extra = {}) {
  const op = Number(operational);
  const candidates = rows.filter((r) => {
    if (normalize(r["שלב"]) !== normalize(stage)) return false;
    if (Number(r["תחנה_מבצעית"]) !== op) return false;

    for (const [k, v] of Object.entries(extra)) {
      if (normalize(r[k]) !== normalize(v)) return false;
    }
    return true;
  });

  // אם יש כפילויות, ניקח את הראשונה; אפשר גם להחמיר ולזרוק שגיאה
  return candidates[0] || null;
}

function clearResults() {
  els.results.innerHTML = "";
}

function showWarning(msg) {
  els.results.innerHTML = `<div class="warn">⚠️ ${msg}</div>`;
}

function renderResults(beforeRow, afterRow, appointRow) {
  const beforeRank = normalize(beforeRow?.["דרגה"]);
  const afterRank = normalize(afterRow?.["דרגה"]);
  const officerRank = appointRow ? normalize(appointRow["דרגה"]) : "";

  const beforeSalary = Number(beforeRow["שכר"]);
  const afterSalary = Number(afterRow["שכר"]);
  const diff = afterSalary - beforeSalary;

  const diffClass = diff < 0 ? "negative" : "positive";
  const diffSign = diff < 0 ? "" : "+";

  const pills = [
    `<span class="badge"><i class="fa-solid fa-arrow-right"></i> לפני: ${beforeRank || "-"}</span>`,
    `<span class="badge"><i class="fa-solid fa-graduation-cap"></i> אחרי קק״ק: ${afterRank || "-"}</span>`,
    appointRow ? `<span class="badge"><i class="fa-solid fa-id-badge"></i> ${normalize(appointRow["שלב"])}: ${officerRank || "-"}</span>` : "",
  ].filter(Boolean).join(" ");

  const kpis = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">${pills}</div>

    <div class="kpi">
      <div class="box">
        <div class="muted">שכר לפני קק״ק</div>
        <div class="big">${moneyILS(beforeSalary)}</div>
      </div>
      <div class="box">
        <div class="muted">שכר אחרי קק״ק</div>
        <div class="big">${moneyILS(afterSalary)}</div>
      </div>
      <div class="box">
        <div class="muted">${appointRow ? `שכר ${normalize(appointRow["שלב"])}` : "מינוי"}</div>
        <div class="big">${appointRow ? moneyILS(appointRow["שכר"]) : "-"}</div>
      </div>
    </div>

    <div class="delta ${diffClass}">
      <div>
        <div class="muted">הפרש (אחרי - לפני)</div>
        <div class="value">${diffSign}${moneyILS(diff)}</div>
      </div>
      <div class="chip"><i class="fa-solid fa-chart-line"></i> חישוב אוטומטי</div>
    </div>
  `;

  els.results.innerHTML = kpis;
}


function refreshOfficerRatings() {
  // דירוג קצין רלוונטי רק אם בחרו מינוי
  const ap = els.appointment.value;
  els.officerRating.disabled = !ap;

  if (!ap) {
    setOptions(els.officerRating, [], "בחרי דירוג קצין...");
    return;
  }

  const baseRows = filterBase();
  // לוקחים דירוגים אפשריים מתוך השורות של השלב הנבחר (מפקח/פקד)
  const ratings = uniq(
    baseRows
      .filter((r) => normalize(r["שלב"]) === normalize(ap))
      .map((r) => normalize(r["דירוג"]))
      .filter(Boolean)
  ).sort((a, b) => a.localeCompare(b, "he"));

  setOptions(els.officerRating, ratings, "בחרי דירוג קצין...");
}

function refreshCalcEnabled() {
  const ok =
    els.activity.value &&
    els.rankBefore.value &&
    els.seniority.value &&
    els.ratingBefore.value &&
    els.operational.value !== "";

  const ap = els.appointment.value;
  const officerOk = !ap || !!els.officerRating.value;

  els.calcBtn.disabled = !(ok && officerOk);
}

function attachListeners() {
  ["activity", "rankBefore", "seniority", "ratingBefore", "operational"].forEach((id) => {
    els[id].addEventListener("change", () => {
      clearResults();
      refreshOfficerRatings();
      refreshCalcEnabled();
    });
  });

  els.appointment.addEventListener("change", () => {
    clearResults();
    refreshOfficerRatings();
    refreshCalcEnabled();
  });

  els.officerRating.addEventListener("change", () => {
    clearResults();
    refreshCalcEnabled();
  });

  els.calcBtn.addEventListener("click", () => {
    clearResults();

    const baseRows = filterBase();
    if (!baseRows.length) {
      showWarning("לא נמצאו נתונים עבור הבחירות האלה. בדקי רמת פעילות/דרגה/וותק/דירוג.");
      return;
    }

    const op = els.operational.value;

    const beforeRow = findOne(baseRows, "לפני", op);
    const afterRow = findOne(baseRows, 'אחרי קק"ק', op);

    if (!beforeRow) {
      showWarning("חסר נתון לשלב 'לפני' עבור הבחירות שלך.");
      return;
    }
    if (!afterRow) {
      showWarning('חסר נתון לשלב "אחרי קק״ק" עבור הבחירות שלך.');
      return;
    }

    const ap = els.appointment.value;
    let appointRow = null;

    if (ap) {
      const officerRating = els.officerRating.value;
      appointRow = findOne(baseRows, ap, op, { "דירוג": officerRating });

      if (!appointRow) {
        showWarning(`לא נמצא נתון עבור ${ap} עם דירוג קצין "${officerRating}".`);
        return;
      }
    }

    renderResults(beforeRow, afterRow, appointRow);
  });

    els.resetBtn?.addEventListener("click", () => {
    els.results.innerHTML = "";
    // איפוס selects
    els.rankBefore.value = "";
    els.seniority.value = "";
    els.ratingBefore.value = "";
    els.appointment.value = "";
    els.officerRating.value = "";
    els.officerRating.disabled = true;

    // איפוס מבצעית ל"לא"
    els.operational.value = "0";
    [...els.operationalSeg.querySelectorAll(".seg-btn")].forEach(x => x.classList.remove("active"));
    els.operationalSeg.querySelector('.seg-btn[data-value="0"]')?.classList.add("active");

    // איפוס רמת פעילות
    els.activity.value = "";
    [...els.activityCards.querySelectorAll(".activity-card")].forEach(x => x.classList.remove("active"));

    refreshCalcEnabled();
  });

}

wireSegment(els.operationalSeg, els.operational);
wireSegment(els.population, { 
  value: "קצין",
  dispatchEvent: () => {} // כרגע רק UI, לא משפיע על חישוב
});

function init() {
  if (!window.SALARY_DATA) {
    els.results.innerHTML =
      `<div class="warn">⚠️ לא נמצא window.SALARY_DATA. ודאי ש-data.js נטען לפני app.js.</div>`;
    return;
  }

  DATA = window.SALARY_DATA.map((r) => {
    return {
      ...r,
      "רמת פעילות": normalize(r["רמת פעילות"]),
      "דרגה לפני": normalize(r["דרגה לפני"]),
      "דירוג_לפני": normalize(r["דירוג_לפני"]),
      "שלב": normalize(r["שלב"]),
      "דירוג": normalize(r["דירוג"]),
      "וותק (שנים)": String(r["וותק (שנים)"]).trim(),
      "תחנה_מבצעית": Number(r["תחנה_מבצעית"]),
      "שכר": Number(r["שכר"]),
      "דרגה": normalize(r["דרגה"]),
    };
  });

  const activities = uniq(DATA.map((r) => r["רמת פעילות"]).filter(Boolean)).sort((a, b) => a.localeCompare(b, "he"));
  const ranksBefore = uniq(DATA.map((r) => r["דרגה לפני"]).filter(Boolean)).sort((a, b) => a.localeCompare(b, "he"));

  setOptions(els.activity, activities, "בחרי רמת פעילות...");
  setOptions(els.rankBefore, ranksBefore, "בחרי דרגה...");

  els.activity.addEventListener("change", refreshDependent);
  els.rankBefore.addEventListener("change", refreshDependent);

  function refreshDependent() {
    clearResults();

    const a = normalize(els.activity.value);
    const rb = normalize(els.rankBefore.value);

    const subset = DATA.filter((r) =>
      (!a || r["רמת פעילות"] === a) &&
      (!rb || r["דרגה לפני"] === rb)
    );

    const seniorities = uniq(subset.map((r) => r["וותק (שנים)"]).filter(Boolean)).sort((x, y) => Number(x) - Number(y));
    const ratingsBefore = uniq(subset.map((r) => r["דירוג_לפני"]).filter(Boolean)).sort((a, b) => a.localeCompare(b, "he"));

    setOptions(els.seniority, seniorities, "בחרי ותק...");
    setOptions(els.ratingBefore, ratingsBefore, "בחרי דירוג...");
    refreshOfficerRatings();
    refreshCalcEnabled();
  }

  refreshDependent();
  attachListeners();
  refreshCalcEnabled();
}
// כרטיסים לרמות פעילות
function iconForActivity(name) {
  const t = normalize(name);
  if (t.includes("א'")) return "fa-flag";
  if (t.includes("ב'")) return "fa-bolt";
  if (t.includes("ג'")) return "fa-tower-observation";
  if (t.includes("ד'")) return "fa-shield";
  return "fa-layer-group";
}

function descForActivity(name) {
  const t = normalize(name);
  if (t.includes("א'")) return "רמה בסיסית";
  if (t.includes("ב'")) return "תחנה מבצעית/פעילות גבוהה";
  if (t.includes("ג'")) return "רמה מתקדמת";
  if (t.includes("ד'")) return "רמה מיוחדת";
  return "בחירה לפי טבלה";
}

function renderActivityCards(values) {
  els.activityCards.innerHTML = "";
  values.forEach((v) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "activity-card";
    btn.dataset.value = v;
    btn.innerHTML = `
      <div class="icon"><i class="fa-solid ${iconForActivity(v)}"></i></div>
      <div class="name">${v}</div>
      <div class="desc">${descForActivity(v)}</div>
    `;
    btn.addEventListener("click", () => {
      // מסמנים Active בכרטיסים
      [...els.activityCards.querySelectorAll(".activity-card")].forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      // מעדכנים את הסלקט החבוי כדי שהקוד הקיים ימשיך לעבוד
      els.activity.value = v;
      els.activity.dispatchEvent(new Event("change"));
    });
    els.activityCards.appendChild(btn);
  });
}

renderActivityCards(activities);

try {
  init();
} catch (e) {
  console.error(e);
  els.results.innerHTML = `<div class="warn">⚠️ שגיאה בהפעלה: ${e?.message || e}</div>`;
}
