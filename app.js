function estimateSalary({ age, prev, edu }) {
  let m = 1.0;
  if (edu === "ba") m += 0.05;
  if (edu === "ma") m += 0.10;
  if (edu === "phd") m += 0.15;

  if (age >= 30) m += 0.03;
  if (age >= 40) m += 0.03;

  return { salary: Math.round(prev * m), multiplier: m.toFixed(3) };
}

document.querySelector("#calc").addEventListener("click", () => {
  const age = Number(document.querySelector("#age").value || 0);
  const prev = Number(document.querySelector("#prev").value || 0);
  const edu = document.querySelector("#edu").value;

  if (!prev) {
    document.querySelector("#out").textContent = "תכניסי שכר קודם 🙂";
    return;
  }

  const r = estimateSalary({ age, prev, edu });
  document.querySelector("#out").textContent =
    `שכר משוער: ₪${r.salary.toLocaleString("he-IL")} (מכפיל: ${r.multiplier})`;
});
