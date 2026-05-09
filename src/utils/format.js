export function formatType(type) {
  return type?.replaceAll("_", " ") ?? "";
}

export function cleanError(message) {
  return (message || "Der skete en fejl.")
    .replaceAll('"', "")
    .replace("java.lang.RuntimeException:", "")
    .trim();
}

export function statusClass(status) {
  if (status === "APPROVED") return "filled";
  if (status === "REQUESTED") return "pending";
  return "open";
}

export function statusText(status) {
  if (status === "APPROVED") return "Godkendt";
  if (status === "REQUESTED") return "Pending";
  return "Åben";
}

export function shiftTypeClass(type) {
  if (type?.startsWith("DAG")) return "type-day";
  if (type?.startsWith("AFTEN")) return "type-evening";
  if (type?.startsWith("NAT")) return "type-night";
  return "type-default";
}
