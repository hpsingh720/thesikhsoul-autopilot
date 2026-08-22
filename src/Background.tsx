import React from "react";
import {
  AbsoluteFill,
  Video,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";

const Particles: React.FC<{ seed: number }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dots = new Array(22).fill(0).map((_, i) => {
    const rx = random(`x-${seed}-${i}`);
    const ry = random(`y-${seed}-${i}`);
    const rs = random(`s-${seed}-${i}`);
    const drift = Math.sin(frame / 60 + i) * 24;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: rx * width,
          top: ry * height + drift,
          width: 4 + rs * 7,
          height: 4 + rs * 7,
          borderRadius: "50%",
          backgroundColor: theme.gold,
          opacity: 0.12 + rs * 0.25,
          filter: "blur(1px)",
        }}
      />
    );
  });
  return <AbsoluteFill>{dots}</AbsoluteFill>;
};

export const Background: React.FC<{ broll: string | null; seed: number }> = ({
  broll,
  seed,
}) => {
  const frame = useCurrentFrame();
  const glow = interpolate(Math.sin(frame / 45), [-1, 1], [0.5, 0.85]);

  if (broll) {
    return (
      <AbsoluteFill>
        <Video
          src={staticFile(broll)}
          muted
          loop
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <AbsoluteFill style={{ backgroundColor: "rgba(10, 13, 26, 0.62)" }} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bgDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 60% at 50% 30%, ${theme.bgDeep2}, transparent)`,
          opacity: glow,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 92%, rgba(201,162,39,0.20), transparent)`,
        }}
      />
      <Particles seed={seed} />
    </AbsoluteFill>
  );
};
