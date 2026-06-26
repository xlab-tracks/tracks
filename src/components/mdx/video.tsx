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

function youTubeId(src: string): string | null {
  const patterns = [
    /[?&]v=([\w-]{6,})/,
    /youtu\.be\/([\w-]{6,})/,
    /\/embed\/([\w-]{6,})/,
    /\/shorts\/([\w-]{6,})/,
  ];
  for (const re of patterns) {
    const m = src.match(re);
    if (m) return m[1];
  }
  return null;
}

function vimeoId(src: string): string | null {
  const m = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// Uses each platform's own embedded player (YouTube/Vimeo iframe, native <video>
// for direct files) rather than custom controls, wrapped in a soft, rounded frame.
export function Video({ src, provider, poster, title }: VideoProps) {
  const kind = provider ?? inferProvider(src);

  let player: React.ReactNode;
  if (kind === "youtube") {
    const id = youTubeId(src);
    player = (
      <iframe
        src={id ? `https://www.youtube.com/embed/${id}` : src}
        title={title ?? "YouTube video player"}
        className="absolute inset-0 size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  } else if (kind === "vimeo") {
    const id = vimeoId(src);
    player = (
      <iframe
        src={id ? `https://player.vimeo.com/video/${id}` : src}
        title={title ?? "Vimeo video player"}
        className="absolute inset-0 size-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  } else {
    player = (
      <video
        src={src}
        poster={poster}
        controls
        playsInline
        className="absolute inset-0 size-full bg-black"
      />
    );
  }

  return (
    <figure className="not-prose border-border shadow-soft my-6 overflow-hidden rounded-2xl border bg-black">
      <div className="relative aspect-video w-full">{player}</div>
      {title ? (
        <figcaption className="text-muted-foreground bg-card border-border border-t px-4 py-2.5 text-sm">
          {title}
        </figcaption>
      ) : null}
    </figure>
  );
}
