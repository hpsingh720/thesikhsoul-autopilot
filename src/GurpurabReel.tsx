import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
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
import { StyledText, TextStyle } from "./TextFx";

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
  logo?: string | null;
  textStyle?: TextStyle;
};

export const GurpurabReel: React.FC<GurpurabReelProps> = ({
  titlePa,
  titleEn,
  greeting,
  dateLine,
  broll,
  music,
  seed,
  logo = null,
  textStyle = "shine",
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
        {logo ? (
          <Img
            src={staticFile(logo)}
            style={{
              position: "absolute",
              top: 110,
              width: 116,
              height: 116,
              filter: "drop-shadow(0 3px 12px rgba(0,0,0,0.7))",
            }}
          />
        ) : (
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
        )}

        <div style={{ transform: `scale(${scale})`, maxWidth: 900 }}>
          <StyledText
            text={titlePa}
            textStyle={textStyle}
            fontFamily={gurmukhi.fontFamily}
            fontSize={paSize}
            fontWeight={700}
            lineHeight={1.45}
            color={theme.cream}
          />
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

        <div style={{ marginTop: 46, opacity: sub }}>
          <StyledText
            text={greeting}
            textStyle={textStyle === "shine" ? "shine" : "simple"}
            fontFamily={gurmukhi.fontFamily}
            fontSize={46}
            fontWeight={600}
            color={theme.gold}
          />
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
