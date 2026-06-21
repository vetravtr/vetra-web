// VETRA Blog Components
// Callout: bloco com fundo colorido para destaques, avisos e notas
// Uso: <Callout type="info|warning|success">texto</Callout>

const VETRA_CALLOUT_ID = "vetra-callout-root";

const COLORS = {
  info: { bg: "rgba(100,51,144,0.1)", border: "#643390", text: "#c8c8c8" },
  warning: { bg: "rgba(245,158,11,0.1)", border: "#f59e0b", text: "#c8c8c8" },
  success: { bg: "rgba(16,185,129,0.1)", border: "#10b981", text: "#c8c8c8" },
  note: { bg: "rgba(59,130,246,0.1)", border: "#3b82f6", text: "#c8c8c8" },
};

export function createCalloutHTML(type = "info", text) {
  const c = COLORS[type] || COLORS.info;
  return `<div style="
    background: ${c.bg};
    border-left: 3px solid ${c.border};
    padding: 16px 20px;
    margin: 24px 0;
    border-radius: 0 8px 8px 0;
    color: ${c.text};
    font-family: 'Libre Franklin', sans-serif;
    font-size: 0.95rem;
    line-height: 1.7;
  ">${text}</div>`;
}
