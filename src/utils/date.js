export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
