import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadGurmukhi } from "@remotion/google-fonts/NotoSansGurmukhi";
import { loadFont as loadLatin } from "@remotion/google-fonts/Poppins";
import { Background } from "./Background";
import { theme } from "./theme";

const gurmukhi = loadGurmukhi();
const latin = loadLatin();

export type GurpurabReelProps = {
  titlePa: string;
  titleEn: string;
  greeting: string;
  dateLine: string;
  broll: string | null;
  music: string | null;
  seed: number;
};

export const GurpurabReel: React.FC<GurpurabReelProps> = ({
  titlePa,
  titleEn,
  greeting,
  dateLine,
  broll,
  music,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const settle = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 25 });
  const scale = interpolate(settle, [0, 1], [1.04, 1]);
  const sub = interpolate(frame, [10, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outro = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  const paSize = titlePa.length <= 34 ? 84 : titlePa.length <= 55 ? 68 : 56;

  return (
    <AbsoluteFill>
      <Background broll={broll} seed={seed} />
      {music ? <Audio src={staticFile(music)} volume={0.9} loop /> : null}

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 80px",
          opacity: outro,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 140,
            fontFamily: gurmukhi.fontFamily,
            fontSize: 70,
            color: theme.gold,
            textShadow: `0 0 28px rgba(232,196,107,0.6)`,
          }}
        >
          {"\u0A74"}
        </div>

        <div
          style={{
            transform: `scale(${scale})`,
            fontFamily: gurmukhi.fontFamily,
            fontWeight: 700,
            fontSize: paSize,
            lineHeight: 1.45,
            color: theme.cream,
            textAlign: "center",
            maxWidth: 900,
            textShadow: "0 4px 26px rgba(0,0,0,0.6)",
          }}
        >
          {titlePa}
        </div>

        <div
          style={{
            marginTop: 30,
            opacity: sub,
            fontFamily: latin.fontFamily,
            fontWeight: 500,
            fontSize: 40,
            color: theme.cream,
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          {titleEn}
        </div>

        <div
          style={{
            marginTop: 46,
            opacity: sub,
            fontFamily: gurmukhi.fontFamily,
            fontWeight: 600,
            fontSize: 46,
            color: theme.gold,
            textAlign: "center",
          }}
        >
          {greeting}
        </div>

        <div
          style={{
            marginTop: 26,
            opacity: sub * 0.85,
            fontFamily: gurmukhi.fontFamily,
            fontSize: 30,
            color: theme.cream,
            textAlign: "center",
          }}
        >
          {dateLine}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 120,
            fontFamily: latin.fontFamily,
            fontWeight: 500,
            fontSize: 34,
            letterSpacing: 3,
            color: theme.gold,
          }}
        >
          {theme.handle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
