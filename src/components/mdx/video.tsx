export type VideoProvider = "youtube" | "vimeo" | "stream" | "file";

export interface VideoProps {
  src: string;
  provider?: VideoProvider;
  poster?: string;
  title?: string;
}

function inferProvider(src: string): VideoProvider {
  if (/youtu\.?be/i.test(src)) return "youtube";
  if (/vimeo\.com/i.test(src)) return "vimeo";
  // Cloudflare Stream: the dashboard "Embed" tab gives a customer-subdomain
  // iframe URL (customer-<code>.cloudflarestream.com/<uid>/iframe); the older
  // videodelivery.net host still resolves for existing videos.
  if (/cloudflarestream\.com|videodelivery\.net/i.test(src)) return "stream";
  return "file";
}

// Accepts the full embed URL from the Stream dashboard (preferred) or a bare
// 32-char video UID, which falls back to the account-agnostic embed host.
function streamEmbedSrc(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  if (/^[0-9a-f]{32}$/i.test(src)) return `https://iframe.videodelivery.net/${src}`;
  return src;
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
  } else if (kind === "stream") {
    player = (
      <iframe
        src={streamEmbedSrc(src)}
        title={title ?? "Cloudflare Stream video player"}
        className="absolute inset-0 size-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
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
