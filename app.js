let rows = [];
let filtered = [];

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function uniq(arr) {
  return [...new Set(arr)].filter(v => v !== null && v !== undefined && String(v).trim() !== "");
}

function setOptions(selectEl, values, placeholder = "בחרי...") {
  selectEl.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  selectEl.appendChild(ph);

  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function byKeys({ group, seniority, activity, rating, gemulA }) {
  return rows.filter(r =>
    Number(r["קבוצה"]) === Number(group) &&
    Number(r["ותק"]) === Number(seniority) &&
    r["פעילות"] === activity &&
    r["דירוג"] === rating &&
    r["גמול_א"] === gemulA
  );
}

function formatILS(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  return Number(n).toLocaleString("he-IL");
}

// ---- UI wiring ----
const elGroup = document.querySelector("#group");
const elSeniority = document.querySelector("#seniority");
const elActivity = document.querySelector("#activity");
const elRating = document.querySelector("#rating");
const elGemulA = document.querySelector("#gemulA");
const elBtn = document.querySelector("#calc");
const elOut = document.querySelector("#out");

function refreshCascading() {
  const group = elGroup.value;
  const seniority = elSeniority.value;

  // שלב 1: מסננים לפי קבוצה+ותק
  const base = rows.filter(r =>
    Number(r["קבוצה"]) === Number(group) &&
    Number(r["ותק"]) === Number(seniority)
  );

  // שלב 2: פעילויות אפשריות
  const activities = uniq(base.map(r => r["פעילות"]));
  setOptions(elActivity, activities, "בחרי פעילות");

  // מאפסים המשך
  setOptions(elRating, [], "בחרי דירוג");
  setOptions(elGemulA, [], "בחרי גמול א'");
  elBtn.disabled = true;
  elOut.textContent = "";
}

function refreshAfterActivity() {
  const group = elGroup.value;
  const seniority = elSeniority.value;
  const activity = elActivity.value;

  const base = rows.filter(r =>
    Number(r["קבוצה"]) === Number(group) &&
    Number(r["ותק"]) === Number(seniority) &&
    r["פעילות"] === activity
  );

  const ratings = uniq(base.map(r => r["דירוג"]));
  setOptions(elRating, ratings, "בחרי דירוג");

  setOptions(elGemulA, [], "בחרי גמול א'");
  elBtn.disabled = true;
  elOut.textContent = "";
}

function refreshAfterRating() {
  const group = elGroup.value;
  const seniority = elSeniority.value;
  const activity = elActivity.value;
  const rating = elRating.value;

  const base = rows.filter(r =>
    Number(r["קבוצה"]) === Number(group) &&
    Number(r["ותק"]) === Number(seniority) &&
    r["פעילות"] === activity &&
    r["דירוג"] === rating
  );

  const gemuls = uniq(base.map(r => r["גמול_א"]));
  setOptions(elGemulA, gemuls, "בחרי גמול א'");

  elBtn.disabled = true;
  elOut.textContent = "";
}

function readyToCalc() {
  return elActivity.value && elRating.value && elGemulA.value;
}

elGroup.addEventListener("change", refreshCascading);
elSeniority.addEventListener("change", refreshCascading);
elActivity.addEventListener("change", refreshAfterActivity);
elRating.addEventListener("change", refreshAfterRating);
elGemulA.addEventListener("change", () => {
  elBtn.disabled = !readyToCalc();
  elOut.textContent = "";
});

elBtn.addEventListener("click", () => {
  const group = elGroup.value;
  const seniority = elSeniority.value;
  const activity = elActivity.value;
  const rating = elRating.value;
  const gemulA = elGemulA.value;

  const matches = byKeys({ group, seniority, activity, rating, gemulA });

  if (matches.length === 0) {
    elOut.textContent = "לא נמצאה התאמה בטבלאות 😕";
    return;
  }

  // אם יש כמה תוצאות (למשל לפי דרגת שכר), נציג את הראשונה כרגע
  const r = matches[0];

  elOut.textContent =
    `סה"כ משכורת: ₪${formatILS(r["סהכ_משכורת"])} | תמריץ חדש: ${r["תמריץ_חדש"]}`;
});

(async function init() {
  rows = await loadJSON("/data/salaries.json");

  // אם תרצי, אפשר למלא קבוצה/ותק אוטומטית מכל הדאטה.
  // כרגע זה קבוע לפי 2 הקבצים שלך.

  refreshCascading();
})();
