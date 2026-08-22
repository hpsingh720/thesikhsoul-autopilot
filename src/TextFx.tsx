import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

export type TextStyle = "glow" | "shine" | "simple" | "strip";

// Renders text in one of TheSikhSoul's text treatments.
export const StyledText: React.FC<{
  text: string;
  textStyle: TextStyle;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  lineHeight?: number;
  color?: string;
}> = ({ text, textStyle, fontFamily, fontSize, fontWeight = 600, lineHeight = 1.5, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const base: React.CSSProperties = {
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    textAlign: "center",
    whiteSpace: "pre-line",
  };

  if (textStyle === "shine") {
    const pos = interpolate(frame % 90, [0, 90], [120, -20]);
    return (
      <div
        style={{
          ...base,
          backgroundImage: `linear-gradient(100deg, #ffffff 25%, ${theme.gold} 42%, #fff7dd 50%, ${theme.gold} 58%, #ffffff 75%)`,
          backgroundSize: "250% 100%",
          backgroundPosition: `${pos}% 50%`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.85))",
        }}
      >
        {text}
      </div>
    );
  }

  if (textStyle === "strip") {
    const lines = text.split("\n").filter((l) => l.trim());
    return (
      <div style={{ textAlign: "center" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ marginTop: i === 0 ? 0 : 10 }}>
            <span
              style={{
                ...base,
                display: "inline",
                backgroundColor: "rgba(0,0,0,0.78)",
                color,
                padding: "6px 18px",
                borderRadius: 6,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {l}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const shadow =
    textStyle === "glow"
      ? "0 0 22px rgba(255,255,255,0.38), 0 2px 14px rgba(0,0,0,0.9)"
      : "0 2px 12px rgba(0,0,0,0.85)";
  return <div style={{ ...base, color, textShadow: shadow }}>{text}</div>;
};
