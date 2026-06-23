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

// Soft, gray-aligned media-chrome theming via its CSS custom properties.
const controllerStyle = {
  width: "100%",
  aspectRatio: "16 / 9",
  "--media-primary-color": "oklch(0.985 0 0)",
  "--media-secondary-color": "oklch(1 0 0 / 0.15)",
  "--media-control-background": "oklch(0.205 0 0 / 0.55)",
  "--media-control-hover-background": "oklch(0.205 0 0 / 0.8)",
  "--media-range-track-height": "4px",
  "--media-range-thumb-height": "12px",
  "--media-range-thumb-width": "12px",
} as React.CSSProperties;

/**
 * Theme-able video player built on media-chrome. Accepts a YouTube/Vimeo URL or
 * a direct file URL; the provider is inferred from the src when not given.
 */
export function Video({ src, provider, poster, title }: VideoProps) {
  const kind = provider ?? inferProvider(src);
  return (
    <figure className="border-border shadow-soft not-prose my-6 overflow-hidden rounded-xl border bg-black">
      <MediaController style={controllerStyle}>
        {kind === "youtube" ? (
          <YouTubeVideo slot="media" src={src} poster={poster} />
        ) : kind === "vimeo" ? (
          <VimeoVideo slot="media" src={src} poster={poster} />
        ) : (
          <video slot="media" src={src} poster={poster} playsInline />
        )}
        <MediaControlBar>
          <MediaPlayButton />
          <MediaMuteButton />
          <MediaVolumeRange />
          <MediaTimeRange />
          <MediaTimeDisplay />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>
      {title ? (
        <figcaption className="text-muted-foreground bg-card border-border border-t px-4 py-2 text-sm">
          {title}
        </figcaption>
      ) : null}
    </figure>
  );
}
