"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Map as MapIcon, Minus, Pause, Play, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BUCKET_ORDER,
  BUCKETS,
  centroidOf,
  CMAP,
  COUNTRIES,
  type BucketKey,
  EU_IDS,
  EVENTS,
  FLOW,
  MAP_COPY as C,
  MAP_VIEWBOX,
  ROLE_ORDER,
  ROLES,
  shortName,
  TL_T0,
  TL_T1,
  TL_YEARS,
  WORLD,
} from "@/lib/verification/data/interactive-map";
import type { VerificationWidgetProps } from "../kit/types";

/* ============ view state (source S) ============ */

type Mode = "map" | "timeline";
type FilterSource = "key" | string | null;

type ViewBox = { x: number; y: number; w: number; h: number };

type State = {
  mode: Mode;
  filter: BucketKey | null;
  filterSource: FilterSource;
  selected: string | null;
  event: number; // -1 = none
  vb: ViewBox;
};

const BASE: ViewBox = { ...MAP_VIEWBOX };

type Action =
  | { type: "setMode"; mode: Mode }
  | { type: "toggleFilter"; bucket: BucketKey; source: FilterSource }
  | { type: "clearFilter" }
  | { type: "select"; id: string }
  | { type: "clearSelection" }
  | { type: "gotoCountry"; id: string }
  | { type: "setEvent"; i: number }
  | { type: "setVb"; vb: ViewBox }
  | { type: "resetVb" }
  | { type: "escape" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "setMode":
      return {
        ...s,
        mode: a.mode,
        filter: null,
        filterSource: null,
        selected: null,
        event:
          a.mode === "timeline" ? (s.event < 0 ? 0 : s.event) : s.event,
      };
    case "toggleFilter":
      if (s.filter === a.bucket && s.filterSource === (a.source ?? "key"))
        return { ...s, filter: null, filterSource: null };
      return {
        ...s,
        filter: a.bucket,
        filterSource: a.source ?? "key",
        selected: null,
      };
    case "clearFilter":
      return { ...s, filter: null, filterSource: null };
    case "select":
      return {
        ...s,
        selected: s.selected === a.id ? null : a.id,
        filter: null,
        filterSource: null,
      };
    case "clearSelection":
      return { ...s, selected: null, filter: null, filterSource: null };
    case "gotoCountry":
      return { ...s, selected: a.id, filter: null, filterSource: null };
    case "setEvent":
      return {
        ...s,
        event: Math.max(0, Math.min(EVENTS.length - 1, a.i)),
      };
    case "setVb":
      return { ...s, vb: a.vb };
    case "resetVb":
      return { ...s, vb: { ...BASE } };
    case "escape":
      return { ...s, selected: null, filter: null, filterSource: null };
    default:
      return s;
  }
}

const INITIAL: State = {
  mode: "map",
  filter: null,
  filterSource: null,
  selected: null,
  event: -1,
  vb: { ...BASE },
};

/* ============ zoom / pan helpers (source clampVB/zoomAt) ============ */

function clampVB(vb: ViewBox): ViewBox {
  const w = Math.min(BASE.w, Math.max(BASE.w / 9, vb.w));
  const h = w * (BASE.h / BASE.w);
  let x = Math.min(
    BASE.x + BASE.w - w * 0.4,
    Math.max(BASE.x - w * 0.6, vb.x),
  );
  x = Math.min(BASE.w - w * 0.35, Math.max(-w * 0.15, x));
  const y = Math.min(BASE.h - h * 0.35, Math.max(-h * 0.15, vb.y));
  return { x, y, w, h };
}

function zoomVB(
  vb: ViewBox,
  factor: number,
  px: number,
  py: number,
  rw: number,
  rh: number,
): ViewBox {
  const scale = Math.min(rw / vb.w, rh / vb.h);
  const offx = (rw - vb.w * scale) / 2;
  const offy = (rh - vb.h * scale) / 2;
  const sx = vb.x + (px - offx) / scale;
  const sy = vb.y + (py - offy) / scale;
  const nw = vb.w / factor;
  return clampVB({
    x: sx - (sx - vb.x) / factor,
    y: sy - (sy - vb.y) / factor,
    w: nw,
    h: vb.h,
  });
}

/* ============ okabe-ito bucket color, semantic-encoding only ============ */
// The source encodes supply-chain layers by Okabe-Ito hue. We keep those hues
// ONLY on the map fills / swatches, always paired with the layer name label.

/**
 * Full-page inline world map of the AI compute supply chain (unbridged view
 * widget). Renders 176 SVG country paths; 14 featured countries are clickable
 * for a detail card; a 6-layer key + 8-stage pipeline strip isolate a layer;
 * a timeline mode replays 13 policy events, repainting the map each step.
 */
export function InteractiveMap(_props: VerificationWidgetProps) {
  void _props;
  const [s, dispatch] = useReducer(reducer, INITIAL);
  const [hintOpen, setHintOpen] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [tip, setTip] = useState<{
    id: string;
    x: number;
    y: number;
    rw: number;
    rh: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    moved: boolean;
    pid: number;
  } | null>(null);

  const zoom = s.vb.w > 0 ? BASE.w / s.vb.w : 1;
  const ev = s.mode === "timeline" && s.event >= 0 ? EVENTS[s.event] : null;

  /* ---- derived paint sets ---- */
  const dimmed = useMemo(() => {
    const set = new Set<string>();
    if (s.mode === "timeline") {
      if (ev) {
        for (const c of COUNTRIES) if (!ev.c.includes(c.id)) set.add(c.id);
      }
    } else if (s.filter) {
      for (const c of COUNTRIES)
        if (!c.buckets.includes(s.filter)) set.add(c.id);
    }
    return set;
  }, [s.mode, s.filter, ev]);

  const euActive = !!(ev && ev.eu);
  const euSet = useMemo(() => new Set(EU_IDS), []);

  /* ---- preview (hover a layer in map mode dims non-members) ---- */
  const [preview, setPreview] = useState<BucketKey | null>(null);
  const previewSet = useMemo(() => {
    if (s.mode !== "map" || s.filter || !preview) return null;
    const set = new Set<string>();
    for (const c of COUNTRIES) if (!c.buckets.includes(preview)) set.add(c.id);
    return set;
  }, [preview, s.mode, s.filter]);

  /* ============ zoom / pan wiring ============ */
  const applyZoom = useCallback(
    (factor: number, px: number, py: number) => {
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      dispatch({
        type: "setVb",
        vb: zoomVB(s.vb, factor, px, py, r.width || 1, r.height || 1),
      });
    },
    [s.vb],
  );

  // Non-passive wheel listener (React onWheel is passive; can't preventDefault).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      applyZoom(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      vx: s.vb.x,
      vy: s.vb.y,
      moved: false,
      pid: e.pointerId,
    };
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const scale =
      Math.min((r.width || 1) / s.vb.w, (r.height || 1) / s.vb.h) || 1;
    const dx = (e.clientX - d.x) / scale;
    const dy = (e.clientY - d.y) / scale;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4)
      d.moved = true;
    dispatch({ type: "setVb", vb: clampVB({ ...s.vb, x: d.vx - dx, y: d.vy - dy }) });
  };
  const endPan = (e: React.PointerEvent<SVGSVGElement>) => {
    try {
      svgRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
  };

  const zoomButton = (factor: number) => {
    const el = svgRef.current;
    const r = el?.getBoundingClientRect();
    applyZoom(factor, (r?.width ?? 2) / 2, (r?.height ?? 2) / 2);
  };

  /* ============ selection / country click ============ */
  const onCountryClick = (id: string | null) => {
    // suppress click that was really a pan
    if (dragRef.current?.moved) {
      dragRef.current = null;
      return;
    }
    dragRef.current = null;
    if (s.mode !== "map") return;
    if (id && CMAP[id]) dispatch({ type: "select", id });
    else dispatch({ type: "clearSelection" });
  };

  /* ============ timeline play ============ */
  // Stop playback the moment we reach the final event. Handled during render
  // (adjust-state-during-render) so the effect never has to setState.
  if (playing && s.event >= EVENTS.length - 1) {
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return;
    if (s.event >= EVENTS.length - 1) return;
    const t = setTimeout(() => {
      dispatch({ type: "setEvent", i: s.event + 1 });
    }, 4600);
    return () => clearTimeout(t);
  }, [playing, s.event]);

  const stopPlay = () => setPlaying(false);
  const togglePlay = () => {
    if (playing) {
      stopPlay();
      return;
    }
    if (s.event >= EVENTS.length - 1) dispatch({ type: "setEvent", i: 0 });
    setPlaying(true);
  };
  const setEvent = (i: number) => {
    stopPlay();
    dispatch({ type: "setEvent", i });
  };

  /* keyboard: arrows in timeline, escape to clear */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (s.mode !== "timeline") {
      if (e.key === "Escape") dispatch({ type: "escape" });
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setEvent(s.event - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setEvent(s.event + 1);
    }
  };

  /* ============ tooltip ============ */
  const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const st = stageRef.current;
    if (!st) return;
    const r = st.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const id = target.getAttribute?.("data-id") ?? null;
    if (id && CMAP[id])
      setTip({ id, x, y, rw: st.clientWidth, rh: st.clientHeight });
    else setTip(null);
  };

  /* ============ scaled stroke/font values (source applyVB) ============ */
  const strokeW = Math.max(0.18, 0.55 / zoom);
  const fontSize = Math.max(3.4, 9.5 / zoom);
  const leaderW = Math.max(0.18, 0.5 / zoom);
  const hubR = Math.max(1.6, 3.4 / zoom);
  const hubStroke = Math.max(0.3, 0.8 / zoom);
  const pulseStroke = Math.max(0.4, 1.4 / zoom);

  const tipCountry = tip ? CMAP[tip.id] : null;

  return (
    <div
      className="not-prose my-6"
      role="application"
      aria-label="The compute supply chain"
      onKeyDown={onKeyDown}
    >
      <div>
        {/* stat strip */}
        <dl className="border-border mb-4 flex flex-wrap gap-x-6 gap-y-2 border-b pb-4">
          {C.stats.map((st) => (
            <div key={st.l} className="flex items-baseline gap-2">
              <dt className="font-mono text-sm font-semibold whitespace-nowrap">
                {st.n}
              </dt>
              <dd className="text-muted-foreground text-xs">{st.l}</dd>
            </div>
          ))}
        </dl>

        {/* mode toggle */}
        <div
          role="tablist"
          aria-label="Map or timeline"
          className="border-border mb-4 inline-flex overflow-hidden rounded-lg border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={s.mode === "map"}
            onClick={() => {
              stopPlay();
              dispatch({ type: "setMode", mode: "map" });
            }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-colors",
              s.mode === "map"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <MapIcon className="size-3.5" aria-hidden /> Map
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={s.mode === "timeline"}
            onClick={() => {
              stopPlay();
              dispatch({ type: "setMode", mode: "timeline" });
            }}
            className={cn(
              "border-border border-l px-4 py-1.5 text-sm font-semibold transition-colors",
              s.mode === "timeline"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            Timeline
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* ============ map column ============ */}
          <div className="min-w-0">
            <div
              ref={stageRef}
              className="border-border bg-muted/30 relative overflow-hidden rounded-lg border"
            >
              {/* hint bar */}
              {hintOpen && (
                <div className="text-muted-foreground border-border bg-card/90 absolute top-3 left-3 z-10 flex max-w-[calc(100%-5rem)] items-start gap-2 rounded-md border px-3 py-2 text-xs backdrop-blur-sm">
                  <span>{C.hint}</span>
                  <button
                    type="button"
                    aria-label="Dismiss hint"
                    onClick={() => setHintOpen(false)}
                    className="text-muted-foreground hover:text-foreground -mt-0.5"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              )}

              {/* zoom controls */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => zoomButton(1.5)}
                  className="border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/40 flex size-8 items-center justify-center rounded-md border transition-colors"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => zoomButton(1 / 1.5)}
                  className="border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/40 flex size-8 items-center justify-center rounded-md border transition-colors"
                >
                  <Minus className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Reset view"
                  onClick={() => dispatch({ type: "resetVb" })}
                  className="border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/40 flex size-8 items-center justify-center rounded-md border font-mono text-[11px] transition-colors"
                >
                  Fit
                </button>
              </div>

              <svg
                ref={svgRef}
                viewBox={`${s.vb.x} ${s.vb.y} ${s.vb.w} ${s.vb.h}`}
                preserveAspectRatio="xMidYMid meet"
                aria-label="World map of the AI compute supply chain"
                className="block h-[clamp(320px,52vh,520px)] w-full touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPan}
                onPointerCancel={endPan}
                onMouseMove={onSvgMouseMove}
                onMouseLeave={() => setTip(null)}
                onClick={(e) => {
                  const id = (e.target as Element).getAttribute?.("data-id");
                  onCountryClick(id ?? null);
                }}
              >
                <rect
                  x={-2000}
                  y={-2000}
                  width={5000}
                  height={5000}
                  fill="transparent"
                />
                {/* country paths */}
                <g>
                  {WORLD.map((f, fi) => {
                    const fid = f.id ?? "";
                    const c = CMAP[fid];
                    const featured = !!c && !c.hub;
                    // filter/timeline dim recolors to muted (source .dimmed);
                    // hover-preview only lowers opacity, keeping the hue.
                    const isDim = dimmed.has(fid);
                    const isPreview = !!previewSet?.has(fid);
                    const isEu = euActive && euSet.has(fid);
                    const selected = s.selected === fid && s.mode === "map";
                    let fill = "var(--muted)";
                    let fillOpacity: number | undefined;
                    if (featured && c) {
                      fill = BUCKETS[c.primary].color;
                      fillOpacity = 0.92;
                    }
                    if (isEu) {
                      fill = "var(--primary)";
                      fillOpacity = 0.5;
                    }
                    if (isDim) {
                      fill = "var(--muted)";
                      fillOpacity = 1;
                    }
                    return (
                      <path
                        key={f.id ?? `bg-${fi}`}
                        d={f.d}
                        data-id={f.id}
                        fill={fill}
                        fillOpacity={fillOpacity}
                        stroke={selected ? "var(--foreground)" : "var(--card)"}
                        strokeWidth={selected ? strokeW * 2.4 : strokeW}
                        strokeLinejoin="round"
                        className={cn(
                          "transition-[fill,opacity] duration-200",
                          featured && s.mode === "map" && "cursor-pointer",
                        )}
                        style={{ opacity: isPreview ? 0.35 : undefined }}
                      />
                    );
                  })}
                </g>

                {/* hub markers (Singapore) */}
                <g>
                  {COUNTRIES.filter((c) => c.hub).map((c) => {
                    const isDim = dimmed.has(c.id);
                    const isPreview = !!previewSet?.has(c.id);
                    return (
                      <circle
                        key={c.id}
                        cx={c.hub![0]}
                        cy={c.hub![1]}
                        r={hubR}
                        data-id={c.id}
                        fill={isDim ? "var(--muted)" : BUCKETS[c.primary].color}
                        stroke="var(--card)"
                        strokeWidth={hubStroke}
                        className="cursor-pointer transition-opacity duration-200"
                        style={{ opacity: isPreview ? 0.35 : undefined }}
                      />
                    );
                  })}
                </g>

                {/* pulse rings for event countries */}
                <g aria-hidden>
                  {ev &&
                    ev.c.map((id) => {
                      const c = CMAP[id];
                      if (!c) return null;
                      const [cx, cy] = centroidOf(c);
                      return (
                        <circle
                          key={id}
                          cx={cx}
                          cy={cy}
                          r={9}
                          fill="none"
                          stroke={BUCKETS[c.primary].color}
                          strokeWidth={pulseStroke}
                          className="vmap-pulse"
                          style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                      );
                    })}
                </g>

                {/* leaders + labels */}
                <g aria-hidden>
                  {COUNTRIES.map((c) => {
                    if (!c.label.leader) return null;
                    const tail =
                      c.label.anchor === "end"
                        ? c.label.x + 2
                        : c.label.anchor === "start"
                          ? c.label.x - 2
                          : c.label.x;
                    return (
                      <polyline
                        key={`l-${c.id}`}
                        points={`${c.label.leader[0]},${c.label.leader[1]} ${tail},${c.label.y - 3}`}
                        fill="none"
                        stroke="#9CA19B"
                        strokeWidth={leaderW}
                      />
                    );
                  })}
                  {COUNTRIES.map((c) => (
                    <text
                      key={`t-${c.id}`}
                      x={c.label.x}
                      y={c.label.y}
                      textAnchor={c.label.anchor}
                      fontSize={fontSize}
                      fill="#33383A"
                      style={{
                        paintOrder: "stroke",
                        stroke: "rgba(250,250,247,.85)",
                        strokeLinejoin: "round",
                        letterSpacing: "0.04em",
                        pointerEvents: "none",
                      }}
                    >
                      {shortName(c.name)}
                    </text>
                  ))}
                </g>
              </svg>

              {/* tooltip */}
              {tip && tipCountry && (
                <div
                  role="tooltip"
                  className="border-border bg-card shadow-soft pointer-events-none absolute z-20 w-64 rounded-lg border p-3"
                  style={tipPos(tip)}
                >
                  <p className="text-sm font-semibold">{tipCountry.name}</p>
                  <div className="mt-1.5 mb-1.5 flex flex-wrap gap-1">
                    {tipCountry.buckets.map((bk) => (
                      <BucketChip key={bk} bk={bk} />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs leading-snug">
                    {tipCountry.verif}
                  </p>
                  <p className="text-muted-foreground/80 mt-1.5 font-mono text-[10px] tracking-wide">
                    click to pin →
                  </p>
                </div>
              )}
            </div>

            {/* dock: pipeline strip OR timeline */}
            {s.mode === "map" ? (
              <div className="mt-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                    {C.flowTitle}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {C.flowNote}
                  </span>
                </div>
                <div className="flex overflow-x-auto">
                  {FLOW.map((st, i) => {
                    const active =
                      s.filter === st.bucket && s.filterSource === st.key;
                    return (
                      <button
                        key={st.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          dispatch({
                            type: "toggleFilter",
                            bucket: st.bucket,
                            source: st.key,
                          })
                        }
                        onMouseEnter={() => setPreview(st.bucket)}
                        onMouseLeave={() => setPreview(null)}
                        className={cn(
                          "relative min-w-[92px] flex-1 border border-r-0 px-2.5 py-2 text-left transition-colors first:rounded-l-md last:rounded-r-md last:border-r",
                          active
                            ? "bg-primary border-primary"
                            : "border-border bg-muted/40 hover:bg-muted",
                        )}
                      >
                        <span
                          className="mb-1.5 block h-[3px] w-4 rounded-sm"
                          style={{ background: BUCKETS[st.bucket].color }}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "block text-[11px] leading-tight font-semibold",
                            active
                              ? "text-primary-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {st.name}
                        </span>
                        {i < FLOW.length - 1 && (
                          <span
                            aria-hidden
                            className="text-muted-foreground/60 absolute top-1/2 -right-1.5 -translate-y-1/2 text-xs"
                          >
                            ›
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="text-muted-foreground mt-2 flex items-center justify-between px-1 font-mono text-[9.5px] tracking-wide">
                  <span>{C.flowGradLeft}</span>
                  <span
                    aria-hidden
                    className="mx-3 h-px flex-1 self-center"
                    style={{
                      background:
                        "linear-gradient(90deg,var(--muted-foreground),var(--border))",
                    }}
                  />
                  <span>{C.flowGradRight}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                    {C.tlTitle}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {C.tlNote}
                  </span>
                </div>
                {/* axis */}
                <div className="relative mx-2 mt-1 h-12">
                  <div className="bg-border absolute top-1/2 right-0 left-0 h-px" />
                  {TL_YEARS.map((y) => (
                    <div key={y} className="contents">
                      <span
                        className="bg-border absolute top-[calc(50%-7px)] h-[7px] w-px"
                        style={{ left: `${tx(y)}%` }}
                        aria-hidden
                      />
                      <span
                        className="text-muted-foreground absolute top-[calc(50%+8px)] -translate-x-1/2 font-mono text-[9.5px]"
                        style={{ left: `${tx(y)}%` }}
                        aria-hidden
                      >
                        {y}
                      </span>
                    </div>
                  ))}
                  {EVENTS.map((e, i) => {
                    const active = i === s.event;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={`${e.d} — ${e.title}`}
                        aria-current={active ? "true" : undefined}
                        onClick={() => setEvent(i)}
                        className={cn(
                          "absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] transition-transform",
                          active
                            ? "border-primary bg-primary scale-[1.35]"
                            : "border-muted-foreground bg-card hover:border-foreground hover:scale-125",
                        )}
                        style={{ left: `${tx(e.t)}%` }}
                      />
                    );
                  })}
                </div>
                {/* controls */}
                <div className="mt-1 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Previous event"
                    onClick={() => setEvent(s.event - 1)}
                    disabled={s.event <= 0}
                  >
                    ◀
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlay}
                    className="gap-1.5"
                  >
                    {playing ? (
                      <>
                        <Pause className="size-3.5" aria-hidden /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5" aria-hidden /> Play
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Next event"
                    onClick={() => setEvent(s.event + 1)}
                    disabled={s.event >= EVENTS.length - 1}
                  >
                    ▶
                  </Button>
                  <span
                    className="text-muted-foreground min-w-14 text-center font-mono text-[11px]"
                    aria-live="polite"
                  >
                    {s.event >= 0 ? `${s.event + 1} / ${EVENTS.length}` : ""}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1.5 text-center text-[11px] italic">
                  {C.tlLesson}
                </p>
              </div>
            )}
          </div>

          {/* ============ rail ============ */}
          <aside className="flex min-w-0 flex-col gap-4">
            {s.mode === "map" && (
              <div>
                <p className="text-muted-foreground mb-2 font-mono text-[9.5px] tracking-[0.15em] uppercase">
                  {C.keyLabel}
                </p>
                <div className="flex flex-col gap-1">
                  {BUCKET_ORDER.map((bk) => {
                    const b = BUCKETS[bk];
                    const n = COUNTRIES.filter((c) =>
                      c.buckets.includes(bk),
                    ).length;
                    const active = s.filter === bk && s.filterSource === "key";
                    return (
                      <button
                        key={bk}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          dispatch({
                            type: "toggleFilter",
                            bucket: bk,
                            source: "key",
                          })
                        }
                        onMouseEnter={() => setPreview(bk)}
                        onMouseLeave={() => setPreview(null)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                          active
                            ? "border-foreground bg-muted"
                            : "hover:bg-muted border-transparent",
                        )}
                      >
                        <span
                          className="size-3 flex-none rounded-sm"
                          style={{ background: b.color }}
                          aria-hidden
                        />
                        <span className="text-[12.5px] font-semibold">
                          {b.name}
                        </span>
                        <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                          {n} {n === 1 ? "country" : "countries"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-muted-foreground mt-1.5 text-[10.5px] leading-snug">
                  {C.keyNote}
                </p>
              </div>
            )}

            {/* anatomy-of-a-chip launcher — overlay OUT OF SCOPE this pass */}
            <div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border px-3 py-2.5 opacity-70">
              <div className="text-muted-foreground flex-none" aria-hidden>
                <svg viewBox="0 0 44 40" width="34" height="30">
                  <polygon points="22,26 40,17 22,8 4,17" fill="#56B4E9" />
                  <polygon
                    points="22,20 34,14 22,8 10,14"
                    fill="#CC79A7"
                    transform="translate(0,-5)"
                  />
                  <polygon
                    points="22,17 29,13.5 22,10 15,13.5"
                    fill="#D55E00"
                    transform="translate(0,-8)"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground font-mono text-[8.5px] tracking-[0.15em] uppercase">
                  {C.chipEyebrow}
                </p>
                <p className="text-sm font-semibold">{C.chipTitle}</p>
                <p className="text-muted-foreground text-[11px] leading-snug">
                  {C.chipSub}
                </p>
              </div>
              <span className="text-muted-foreground ml-auto flex-none font-mono text-[9px] uppercase">
                soon
              </span>
            </div>

            {/* detail card */}
            <div className="border-border bg-muted/30 min-h-32 rounded-lg border p-3.5">
              <DetailCard state={s} dispatch={dispatch} />
            </div>

            {/* roles key */}
            <div className="border-border border-t pt-3">
              <p className="text-muted-foreground mb-2 font-mono text-[9.5px] tracking-[0.15em] uppercase">
                {C.rolesLabel}
              </p>
              <div className="flex flex-wrap gap-1">
                {ROLE_ORDER.map((r) => (
                  <span
                    key={r}
                    className="border-muted-foreground/50 text-muted-foreground rounded border border-dashed px-2 py-0.5 font-mono text-[9.5px] tracking-wide"
                  >
                    {ROLES[r]}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground mt-1.5 text-[10.5px] leading-snug">
                {C.rolesNote}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* pulse-ring animation, respecting reduced motion */}
      <style>{`
        @keyframes vmapPing {
          0% { transform: scale(.45); opacity: .85; }
          75% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .vmap-pulse { animation: vmapPing 1.9s cubic-bezier(.25,.6,.35,1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .vmap-pulse { animation: none; opacity: .6; }
        }
      `}</style>
    </div>
  );
}

/* ============ tooltip positioning (source moveTip) ============ */
function tipPos(tip: {
  x: number;
  y: number;
  rw: number;
  rh: number;
}): React.CSSProperties {
  const rw = tip.rw;
  const rh = tip.rh;
  const tw = 256; // w-64
  const th = 120;
  let lx = tip.x + 16;
  let ly = tip.y + 14;
  if (rw && lx + tw > rw - 8) lx = tip.x - tw - 16;
  if (rh && ly + th > rh - 8) ly = tip.y - th - 12;
  return { left: Math.max(6, lx), top: Math.max(6, ly) };
}

/* timeline axis position (source tx) */
function tx(t: number): number {
  return ((t - TL_T0) / (TL_T1 - TL_T0)) * 100;
}

/* ============ bucket chip ============ */
function BucketChip({ bk }: { bk: BucketKey }) {
  const b = BUCKETS[bk];
  return (
    <span className="border-border bg-muted/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px]">
      <span
        className="size-[7px] flex-none rounded-full"
        style={{ background: b.color }}
        aria-hidden
      />
      {b.name}
    </span>
  );
}

/* ============ detail card (source renderDetail) ============ */
function DetailCard({
  state,
  dispatch,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  const s = state;

  // timeline mode
  if (s.mode === "timeline") {
    if (s.event < 0)
      return (
        <p className="text-muted-foreground text-[12.5px] leading-relaxed">
          {C.tlEmpty}
        </p>
      );
    const ev = EVENTS[s.event];
    const chips = ev.eu
      ? [C.euName]
      : ev.c.map((id) => (CMAP[id] ? CMAP[id].name : id));
    return (
      <div aria-live="polite">
        <p className="text-muted-foreground font-mono text-[9.5px] tracking-[0.13em] uppercase">
          Timeline · {s.event + 1} of {EVENTS.length}
        </p>
        <p className="text-muted-foreground mt-1 font-mono text-[11px]">
          {ev.d}
        </p>
        <h4 className="mt-0.5 text-base font-semibold">{ev.title}</h4>
        <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-relaxed">
          {ev.body}
        </p>
        <p className="text-muted-foreground mt-2.5 font-mono text-[11px] tracking-wide uppercase">
          {C.eventActors}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {chips.map((name) => (
            <span
              key={name}
              className="border-border bg-card rounded-full border px-2.5 py-0.5 text-[11px]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // filter (layer / pipeline stage) mode
  if (s.filter) {
    const b = BUCKETS[s.filter];
    const members = COUNTRIES.filter((c) => c.buckets.includes(s.filter!));
    const st =
      s.filterSource && s.filterSource !== "key"
        ? FLOW.find((f) => f.key === s.filterSource)
        : null;
    return (
      <div>
        <button
          type="button"
          aria-label="Clear layer filter"
          onClick={() => dispatch({ type: "clearFilter" })}
          className="text-muted-foreground hover:text-foreground float-right -mt-1 -mr-1"
        >
          <X className="size-4" aria-hidden />
        </button>
        <p className="text-muted-foreground font-mono text-[9.5px] tracking-[0.13em] uppercase">
          {st ? "Pipeline stage" : "Supply chain layer"}
        </p>
        <h4 className="mt-1 text-base font-semibold">{st ? st.name : b.name}</h4>
        <span
          className="mt-2 mb-2.5 inline-block rounded-[5px] border-[1.5px] px-2.5 py-1 font-mono text-sm font-semibold"
          style={{ borderColor: b.color, color: b.color }}
        >
          {b.stat}
        </span>
        <p className="text-muted-foreground text-[12.5px] leading-relaxed">
          {st ? `${st.stat} ` : ""}
          {b.why}
        </p>
        <p className="text-muted-foreground mt-2.5 font-mono text-[11px] tracking-wide uppercase">
          {C.layerNeed}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {members.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => dispatch({ type: "gotoCountry", id: c.id })}
              className="border-border bg-card hover:border-foreground rounded-full border px-2.5 py-0.5 text-[11px] transition-colors"
            >
              {shortName(c.name)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // country selected
  if (s.selected) {
    const c = CMAP[s.selected];
    if (!c) return null;
    return (
      <div>
        <button
          type="button"
          aria-label="Close country"
          onClick={() => dispatch({ type: "clearSelection" })}
          className="text-muted-foreground hover:text-foreground float-right -mt-1 -mr-1"
        >
          <X className="size-4" aria-hidden />
        </button>
        <p className="text-muted-foreground font-mono text-[9.5px] tracking-[0.13em] uppercase">
          Country
        </p>
        <h4 className="mt-1 text-base font-semibold">{c.name}</h4>
        <div className="mt-1.5 mb-2 flex flex-wrap gap-1">
          {c.buckets.map((bk) => (
            <BucketChip key={bk} bk={bk} />
          ))}
        </div>
        <ul className="flex flex-col gap-1.5">
          {c.anchors.map((a, i) => (
            <li
              key={i}
              className="text-muted-foreground relative pl-3 text-xs leading-relaxed before:absolute before:top-[7px] before:left-0 before:size-1 before:rounded-full before:bg-current before:opacity-50"
            >
              {a}
            </li>
          ))}
        </ul>
        <div className="border-border mt-2.5 border-t pt-2">
          <p className="text-muted-foreground font-mono text-[9.5px] tracking-[0.12em] uppercase">
            {C.countryVerifLabel}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed">{c.verif}</p>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {c.roles.map((r) => (
            <span
              key={r}
              className="border-muted-foreground/50 text-muted-foreground rounded border border-dashed px-2 py-0.5 font-mono text-[9.5px] tracking-wide"
            >
              {ROLES[r]}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // default (map, nothing selected)
  return (
    <div>
      <p className="text-muted-foreground font-mono text-[9.5px] tracking-[0.13em] uppercase">
        {C.startEyebrow}
      </p>
      <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-relaxed">
        {C.startBodyA}
      </p>
      <p className="text-muted-foreground mt-2 text-[12.5px] leading-relaxed">
        {C.startBodyB}
      </p>
    </div>
  );
}
