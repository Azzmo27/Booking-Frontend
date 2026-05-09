import React from "react";

export function Button({ children, variant = "primary", size = "default", className = "", ...props }) {
  const classes = ["button", `button-${variant}`, size === "small" ? "button-small" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
