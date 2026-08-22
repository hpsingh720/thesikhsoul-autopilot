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

const hasGurmukhi = (s: string) => /[\u0A00-\u0A7F]/.test(s);

export type QuoteReelProps = {
  quote: string;
  broll: string | null;
  music: string | null;
  seed: number;
};

export const QuoteReel: React.FC<QuoteReelProps> = ({
  quote,
  broll,
  music,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const punjabi = hasGurmukhi(quote);
  const fontFamily = punjabi ? gurmukhi.fontFamily : latin.fontFamily;
  const len = quote.length;
  const fontSize = len <= 70 ? 78 : len <= 130 ? 66 : 56;

  // Hook-first: full opacity at frame 0, only a gentle settle
  const settle = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 25 });
  const scale = interpolate(settle, [0, 1], [1.045, 1]);

  const ruleWidth = interpolate(frame, [8, 40], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const outro = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill>
      <Background broll={broll} seed={seed} />
      {music ? <Audio src={staticFile(music)} volume={0.9} loop /> : null}

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 90px",
          opacity: outro,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 150,
            fontFamily: gurmukhi.fontFamily,
            fontSize: 64,
            color: theme.gold,
            textShadow: `0 0 26px rgba(232,196,107,0.55)`,
          }}
        >
          {"\u0A74"}
        </div>

        <div
          style={{
            transform: `scale(${scale})`,
            fontFamily,
            fontWeight: 600,
            fontSize,
            lineHeight: 1.4,
            color: theme.cream,
            textAlign: "center",
            maxWidth: 880,
            textShadow: "0 4px 26px rgba(0,0,0,0.55)",
          }}
        >
          {quote}
        </div>

        <div
          style={{
            marginTop: 54,
            height: 3,
            width: ruleWidth,
            backgroundColor: theme.gold,
            borderRadius: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 130,
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
