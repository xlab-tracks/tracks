"use client";

import YouTubeVideo from "youtube-video-element/react";
import VimeoVideo from "vimeo-video-element/react";
import {
  MediaController,
  MediaControlBar,
  MediaPlayButton,
  MediaMuteButton,
  MediaVolumeRange,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaFullscreenButton,
} from "media-chrome/react";

export type VideoProvider = "youtube" | "vimeo" | "file";

export interface VideoProps {
  src: string;
  provider?: VideoProvider;
  poster?: string;
  title?: string;
}

function inferProvider(src: string): VideoProvider {
  if (/youtu\.?be/i.test(src)) return "youtube";
  if (/vimeo\.com/i.test(src)) return "vimeo";
  return "file";
}

// Minimal media-chrome theming: icon-only controls (no solid button blocks) over a
// soft gradient scrim, a slim rounded scrubber, and controls that fade when idle.
const controllerStyle = {
  width: "100%",
  aspectRatio: "16 / 9",
  "--media-primary-color": "oklch(0.985 0 0)",
  "--media-secondary-color": "oklch(1 0 0 / 0.55)",
  "--media-text-color": "oklch(0.985 0 0)",
  "--media-control-background": "transparent",
  "--media-control-hover-background": "oklch(1 0 0 / 0.16)",
  "--media-font-size": "0.78rem",
  "--media-button-icon-width": "1.05rem",
  "--media-range-track-height": "3px",
  "--media-range-track-background": "oklch(1 0 0 / 0.22)",
  "--media-range-thumb-height": "12px",
  "--media-range-thumb-width": "12px",
  "--media-time-range-buffered-color": "oklch(1 0 0 / 0.3)",
} as React.CSSProperties;

const controlBarStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.15rem",
  width: "100%",
  padding: "1.25rem 0.6rem 0.5rem",
  background: "linear-gradient(to top, oklch(0 0 0 / 0.72), oklch(0 0 0 / 0))",
} as React.CSSProperties;

export function Video({ src, provider, poster, title }: VideoProps) {
  const kind = provider ?? inferProvider(src);
  return (
    <figure className="not-prose border-border shadow-soft my-6 overflow-hidden rounded-2xl border bg-black">
      <MediaController autohide="2" style={controllerStyle}>
        {kind === "youtube" ? (
          <YouTubeVideo slot="media" src={src} poster={poster} />
        ) : kind === "vimeo" ? (
          <VimeoVideo slot="media" src={src} poster={poster} />
        ) : (
          <video slot="media" src={src} poster={poster} playsInline />
        )}
        <MediaControlBar style={controlBarStyle}>
          <MediaPlayButton />
          <MediaMuteButton />
          <MediaVolumeRange />
          <MediaTimeRange style={{ flex: 1 }} />
          <MediaTimeDisplay />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>
      {title ? (
        <figcaption className="text-muted-foreground bg-card border-border border-t px-4 py-2.5 text-sm">
          {title}
        </figcaption>
      ) : null}
    </figure>
  );
}
