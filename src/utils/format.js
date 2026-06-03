const typeLabels = {
  DAG: "Dagvagt",
  AFTEN: "Aftenvagt",
  NAT: "Nattevagt",
};

function parts(type = "") {
  return type.split("_");
}

export function formatType(type) {
  const [kind] = parts(type);
  return typeLabels[kind] ?? type?.replaceAll("_", " ") ?? "";
}

export function formatPeriod(type) {
  const [, start, end] = parts(type);
  if (!start || !end) return "Tidspunkt ikke angivet";
  return `${start.padStart(2, "0")}:00-${end.padStart(2, "0")}:00`;
}

export function cleanError(message) {
  return (message || "Der skete en fejl.")
    .replaceAll('"', "")
    .replace("java.lang.RuntimeException:", "")
    .trim();
}

export function statusClass(status) {
  if (status === "APPROVED") return "approved";
  if (status === "REQUESTED") return "pending";
  return "open";
}

export function statusText(status) {
  if (status === "APPROVED") return "Godkendt";
  if (status === "REQUESTED") return "Venteliste";
  return "Åben";
}

export function shiftTypeClass(type) {
  if (type?.startsWith("DAG")) return "type-day";
  if (type?.startsWith("AFTEN")) return "type-evening";
  if (type?.startsWith("NAT")) return "type-night";
  return "type-default";
}
