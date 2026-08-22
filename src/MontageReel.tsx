import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadGurmukhi } from "@remotion/google-fonts/NotoSansGurmukhi";
import { loadFont as loadLatin } from "@remotion/google-fonts/Poppins";
import { theme } from "./theme";
import { StyledText, TextStyle } from "./TextFx";

const gurmukhi = loadGurmukhi();
const latin = loadLatin();
const hasGurmukhi = (s: string) => /[\u0A00-\u0A7F]/.test(s);

export type MontageSegment = { from: number; dur: number; clip: number; startFrom: number };

export type MontageReelProps = {
  quote: string;
  clips: string[];
  music: string;
  segments: MontageSegment[];
  audioStartFrom: number;
  durationInFrames?: number;
  textStyle?: TextStyle;
  logo?: string | null;
  seed: number;
};

// Beat-synced montage: hard cuts on the beat grid, buildup -> drop -> outro,
// modeled on TheSikhSoul's measured editing structure.
export const MontageReel: React.FC<MontageReelProps> = ({
  quote,
  clips,
  music,
  segments,
  audioStartFrom,
  textStyle = "glow",
  logo = null,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const punjabi = hasGurmukhi(quote);
  const fontFamily = punjabi ? gurmukhi.fontFamily : latin.fontFamily;
  const size = quote.length <= 45 ? 52 : quote.length <= 80 ? 44 : 38;

  const outro = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: outro }}>
      <Audio src={staticFile(music)} startFrom={audioStartFrom} volume={0.95} />
      {segments.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur}>
          <AbsoluteFill style={{ transform: `scale(${1 + (i % 2) * 0.035})` }}>
            <Video
              src={staticFile(clips[s.clip])}
              startFrom={s.startFrom}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
      <AbsoluteFill style={{ backgroundColor: "rgba(6,8,16,0.30)" }} />

      {logo ? (
        <Img
          src={staticFile(logo)}
          style={{
            position: "absolute",
            top: 64,
            left: 56,
            width: 104,
            height: 104,
            filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.6))",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          top: "42%",
          width: "100%",
          padding: "0 80px",
        }}
      >
        <StyledText
          text={quote}
          textStyle={textStyle === "strip" ? "glow" : textStyle}
          fontFamily={fontFamily}
          fontSize={size}
          fontWeight={600}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 84,
          width: "100%",
          textAlign: "center",
          fontFamily: latin.fontFamily,
          fontWeight: 400,
          fontSize: 26,
          letterSpacing: 2,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {theme.handle}
      </div>
    </AbsoluteFill>
  );
};
