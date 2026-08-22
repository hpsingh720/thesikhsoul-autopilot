import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Video,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadGurmukhi } from "@remotion/google-fonts/NotoSansGurmukhi";
import { loadFont as loadLatin } from "@remotion/google-fonts/Poppins";
import { theme } from "./theme";
import { StyledText, TextStyle } from "./TextFx";
import { Background } from "./Background";

const gurmukhi = loadGurmukhi();
const latin = loadLatin();
const hasGurmukhi = (s: string) => /[\u0A00-\u0A7F]/.test(s);

export type QuoteReelProps = {
  quote: string;
  broll: string | null;
  music: string | null;
  seed: number;
  logo?: string | null;
  textStyle?: TextStyle;
  layout?: "card" | "full";
};

export const QuoteReel: React.FC<QuoteReelProps> = ({
  quote,
  broll,
  music,
  seed,
  logo = null,
  textStyle = "glow",
  layout = "card",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  const lines = quote.split("\n").filter((l) => l.trim().length > 0);
  const headline = lines[0] ?? quote;
  const rest = lines.slice(1).join("\n");
  const punjabi = hasGurmukhi(quote);
  const fontFamily = punjabi ? gurmukhi.fontFamily : latin.fontFamily;
  const headSize = headline.length <= 40 ? 60 : headline.length <= 70 ? 52 : 44;

  const settle = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 25 });
  const scale = interpolate(settle, [0, 1], [1.03, 1]);
  const outro = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  const watermark = (
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
  );

  if (layout === "full") {
    // Full-bleed footage (or generated background) with text over it
    return (
      <AbsoluteFill style={{ opacity: outro }}>
        <Background broll={broll} seed={seed} />
        {music ? <Audio src={staticFile(music)} volume={0.9} loop /> : null}
        {logo ? (
          <Img
            src={staticFile(logo)}
            style={{
              position: "absolute",
              top: 64,
              left: 56,
              width: 110,
              height: 110,
              filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.6))",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: textStyle === "strip" ? 200 : "38%",
            width: "100%",
            padding: "0 70px",
            transform: `scale(${scale})`,
          }}
        >
          <StyledText
            text={rest ? `${headline}\n${rest}` : headline}
            textStyle={textStyle}
            fontFamily={fontFamily}
            fontSize={headSize}
            fontWeight={600}
          />
        </div>
        {watermark}
      </AbsoluteFill>
    );
  }

  // Card layout: black canvas + letterboxed cinematic strip
  const stripH = Math.round((width * 9) / 16);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", opacity: outro }}>
      {music ? <Audio src={staticFile(music)} volume={0.9} loop /> : null}
      {logo ? (
        <Img
          src={staticFile(logo)}
          style={{
            position: "absolute",
            top: 66,
            left: "50%",
            transform: "translateX(-50%)",
            width: 92,
            height: 92,
            filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.7))",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 190,
          width: "100%",
          padding: "0 70px",
          transform: `scale(${scale})`,
        }}
      >
        <StyledText
          text={headline}
          textStyle={textStyle === "strip" ? "simple" : textStyle}
          fontFamily={fontFamily}
          fontSize={headSize}
          fontWeight={700}
        />
        {rest ? (
          <div style={{ marginTop: 26 }}>
            <StyledText
              text={rest}
              textStyle={textStyle === "strip" ? "simple" : textStyle}
              fontFamily={fontFamily}
              fontSize={Math.max(36, headSize - 14)}
              fontWeight={500}
              color="#f2f2f2"
            />
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          top: "46%",
          width: "100%",
          height: stripH,
          overflow: "hidden",
          backgroundColor: "#0a0a0a",
        }}
      >
        {broll ? (
          <Video
            src={staticFile(broll)}
            muted
            loop
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <GoldDust seed={seed} />
        )}
      </div>
      {watermark}
    </AbsoluteFill>
  );
};

const GoldDust: React.FC<{ seed: number }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const dots = new Array(26).fill(0).map((_, i) => {
    const rx = random(`gx-${seed}-${i}`);
    const ry = random(`gy-${seed}-${i}`);
    const rs = random(`gs-${seed}-${i}`);
    const drift = Math.sin(frame / 55 + i * 1.7) * 20;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${rx * 100}%`,
          top: `calc(${ry * 100}% + ${drift}px)`,
          width: 3 + rs * 6,
          height: 3 + rs * 6,
          borderRadius: "50%",
          backgroundColor: theme.gold,
          opacity: 0.15 + rs * 0.3,
          filter: "blur(1px)",
        }}
      />
    );
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 90% at 50% 60%, #1a1a10, #0a0a0a)`,
      }}
    >
      {dots}
    </AbsoluteFill>
  );
};
