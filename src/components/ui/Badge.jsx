import React from "react";
import { statusClass, statusText } from "../../utils/format";

export function Badge({ status, children }) {
  const text = children ?? statusText(status);
  return <span className={`status ${statusClass(status)}`}>{text}</span>;
}
