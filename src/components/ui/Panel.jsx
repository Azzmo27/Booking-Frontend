import React from "react";

export function Panel({ title, description, actions, children, className = "" }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || description || actions) && (
        <div className="panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
