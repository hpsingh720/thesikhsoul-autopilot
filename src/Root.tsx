import React from "react";
import { Composition } from "remotion";
import { QuoteReel, QuoteReelProps } from "./QuoteReel";
import { GurpurabReel, GurpurabReelProps } from "./GurpurabReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuoteReel"
        component={QuoteReel}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          {
            quote: "Peace isn't found. It's remembered — one Waheguru at a time.",
            broll: null,
            music: null,
            seed: 1,
          } satisfies QuoteReelProps
        }
      />
      <Composition
        id="GurpurabReel"
        component={GurpurabReel}
        durationInFrames={270}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          {
            titlePa: "ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ",
            titleEn: "Parkash Purab Sri Guru Nanak Dev Ji",
            greeting: "ਲੱਖ ਲੱਖ ਵਧਾਈਆਂ",
            dateLine: "",
            broll: null,
            music: null,
            seed: 1,
          } satisfies GurpurabReelProps
        }
      />
    </>
  );
};
