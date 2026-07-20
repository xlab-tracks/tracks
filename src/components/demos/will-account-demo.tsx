"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

// The safety budget as a game (module 2, "Determining the usefulness",
// §Resource state + §The loop): deploy as much control as possible before
// the end of 2029. Economic, political, and social will tend to fade monthly without
// reinforcement; deployed control measures MAY catch a schemer each month
// (the loop's own step 2), a catch spikes the balance and alarms the
// public (cheaper usefulness for a window), buy-in slows the social fade,
// and passed policy converts political will into a durable floor — the
// part of the final score that persists. All caption and feed copy
// restates c-regimes-l1.mdx lines 19, 62-95, 140-149; the calendar
// deadline is author-directed game chrome and the tuning is deliberately
// pessimistic — derivations in
// docs/superpowers/specs/2026-07-18-will-account-model.md §5.

const W = 480;
const H = 240;
const BAR_W = 60;
const BAR_GAP = 84;
const BARS_LEFT = 78;
const BAR_BOTTOM = H - 36;
const BAR_MAX_H = 168;

const TICK_MS = 1000; // one simulated month per real second
const DECAY = 1.5;
const LOW_WILL = 15;
const FEED_SHOWN = 5;
const FEED_CAP = 30;

const CATCH_P = 0.06; // per deployed measure, per month (mdx:142's "may")
const CATCH_SPIKE = { economic: 12, political: 16, social: 26 };
const ALARM_MONTHS = 6;
const ALARM_DISCOUNT = { economic: 4, social: 6 };
const BASKET = { economic: 20, social: 12 }; // close race priced into the backdrop
const BUYIN = { social: 10, politicalOnEnd: 4, months: 7, economicCost: 5 };
const POLICY_MIN = 30;
const POLICY_COST = 24;
// Passing policy when the spend would land at most this far above the
// existing floor is a marginal pass: the bar only nudges up by the small
// bump instead of jumping to where you landed. A spend that would land
// BELOW the existing floor is disallowed entirely.
const POLICY_MARGINAL_ZONE = 5;
const POLICY_MARGINAL_BUMP = 2;

type WillKey = "economic" | "political" | "social";

const WILLS: { key: WillKey; label: string; fill: string }[] = [
  { key: "economic", label: "economic", fill: "fill-sky-500/70" },
  { key: "political", label: "political", fill: "fill-violet-500/70" },
  { key: "social", label: "social", fill: "fill-amber-500/70" },
];

const CAPTIONS = {
  start:
    "Will has a tendency to fade over time without constant reinforcement (think the media cycle) and spikes after incidents.",
  buyin:
    "Public buy-in increases social will with weaker effects on political will in democratic nations.",
  policy:
    "Passed policy converts political will into a durable floor because repeal is expensive. What gets written into regulation tends to be easy to explain and verify politically, which is not necessarily optimal policy.",
  deploy:
    "Deploying control spends the basket: delay (primarily economic will), usefulness (costs economic and social will but less than expected due to the fact control can increase the usefulness of models), and compute (costs economic will as compute is finite and higher allocations to safety takes away from capabilities).",
  broke:
    "there isn't enough will available to spur the deployment of new control measures",
  catch:
    "Leadership, politicians, and the public become alarmed, increasing political, social, and economic will. A scared public also makes it cheaper for organizations and can potentially lower the economic will required by proxy.",
  deadline:
    "Passed policy converts political will into a durable floor as repeal is expensive.",
} as const;

// Feed one-liners: a month-stamped timeline of the same lesson claims the
// captions carry — never new events, labs, or model names (anchors in the
// model writeup's copy-pool table).
const FEED = {
  catch: "a scheming model is caught in the act",
  buyin: "public buy-in: social will rises and its fading slows",
  policy: "policy passed, creating a legislation floor",
  deploy:
    "a new control method is deployed for the lab's internal AI agents",
  broke: "the basket is unaffordable",
  campaignEnd:
    "the campaign runs its course, leading to a weak bump to political will",
  low: "without constant reinforcement, will keeps fading",
  deadline: "2029 ends & the deadline is reached",
} as const;

interface FeedEntry {
  month: number;
  text: string;
}

interface SimState {
  economic: number;
  political: number;
  social: number;
  policyFloor: number;
  buyinTicks: number;
  alarmTicks: number;
  measures: number;
  catches: number;
  monthIndex: number;
  feed: FeedEntry[];
  lowWarned: boolean;
  ended: boolean;
  caption: keyof typeof CAPTIONS;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function pushFeed(feed: FeedEntry[], month: number, text: string): FeedEntry[] {
  return [...feed, { month, text }].slice(-FEED_CAP);
}

/** Combined chance that at least one deployed measure catches this month. */
function catchChance(measures: number): number {
  return 1 - Math.pow(1 - CATCH_P, measures);
}

function basketCost(alarmActive: boolean) {
  return {
    economic: BASKET.economic - (alarmActive ? ALARM_DISCOUNT.economic : 0),
    social: BASKET.social - (alarmActive ? ALARM_DISCOUNT.social : 0),
  };
}

// One month passes. `roll` is uniform [0,1), drawn OUTSIDE this pure
// updater (randomness in an updater would break StrictMode purity); at
// most one catch resolves per month against the combined chance.
function tick(prev: SimState, roll: number, monthsTotal: number): SimState {
  if (prev.ended) return prev;
  const next: SimState = {
    ...prev,
    economic: Math.max(0, prev.economic - DECAY),
    political: Math.max(prev.policyFloor, prev.political - DECAY),
    social: Math.max(
      0,
      prev.social - (prev.buyinTicks > 0 ? DECAY * 0.3 : DECAY),
    ),
    buyinTicks: Math.max(0, prev.buyinTicks - 1),
    alarmTicks: Math.max(0, prev.alarmTicks - 1),
    monthIndex: prev.monthIndex + 1,
    feed: prev.feed,
  };

  // A campaign that just ran its course delivers its political effect now —
  // the lesson's "weaker effects on political will" (mdx:93), with the
  // at-completion timing being author-directed game mechanics.
  if (prev.buyinTicks === 1) {
    next.political = clamp(next.political + BUYIN.politicalOnEnd);
    next.feed = pushFeed(next.feed, next.monthIndex, FEED.campaignEnd);
  }

  if (roll < catchChance(prev.measures)) {
    next.economic = clamp(next.economic + CATCH_SPIKE.economic);
    next.political = clamp(next.political + CATCH_SPIKE.political);
    next.social = clamp(next.social + CATCH_SPIKE.social);
    next.alarmTicks = ALARM_MONTHS;
    next.catches = prev.catches + 1;
    next.feed = pushFeed(next.feed, next.monthIndex, FEED.catch);
    next.caption = "catch";
  }

  if (
    !next.lowWarned &&
    WILLS.some((will) => prev[will.key] >= LOW_WILL && next[will.key] < LOW_WILL)
  ) {
    next.feed = pushFeed(next.feed, next.monthIndex, FEED.low);
    next.lowWarned = true;
  }

  if (next.monthIndex >= monthsTotal) {
    next.ended = true;
    next.feed = pushFeed(next.feed, next.monthIndex, FEED.deadline);
    next.caption = "deadline";
  }
  return next;
}

function WillAccountGame() {
  // The clock starts at the learner's current month and runs out when 2030
  // begins (the deadline is the end of 2029). Rendered with
  // suppressHydrationWarning: server and client may sit on different sides
  // of a month boundary for one frame.
  const [start] = useState(() => new Date());
  const monthsTotal = Math.max(
    1,
    (2030 - start.getFullYear()) * 12 - start.getMonth(),
  );

  const [sim, setSim] = useState<SimState>({
    economic: 45,
    political: 36,
    social: 28,
    policyFloor: 0,
    buyinTicks: 0,
    alarmTicks: 0,
    measures: 0,
    catches: 0,
    monthIndex: 0,
    feed: [],
    lowWarned: false,
    ended: false,
    caption: "start",
  });
  // Starts paused: the learner presses Play to run the clock (no autoplay).
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || sim.ended) return;
    const handle = setInterval(() => {
      const roll = Math.random();
      setSim((prev) => tick(prev, roll, monthsTotal));
    }, TICK_MS);
    return () => clearInterval(handle);
  }, [playing, sim.ended, monthsTotal]);

  const monthLabel = (index: number) =>
    new Date(start.getFullYear(), start.getMonth() + index, 1).toLocaleDateString(
      "en-US",
      { month: "short", year: "numeric" },
    );

  const cost = basketCost(sim.alarmTicks > 0);
  const canPassPolicy =
    !sim.ended &&
    sim.political >= POLICY_MIN &&
    sim.political - POLICY_COST >= sim.policyFloor;

  const deploy = () => {
    setSim((prev) => {
      if (prev.ended) return prev;
      const price = basketCost(prev.alarmTicks > 0);
      const affordable =
        prev.economic >= price.economic && prev.social >= price.social;
      if (!affordable) {
        return {
          ...prev,
          feed: pushFeed(prev.feed, prev.monthIndex, FEED.broke),
          caption: "broke",
        };
      }
      return {
        ...prev,
        economic: clamp(prev.economic - price.economic),
        social: clamp(prev.social - price.social),
        measures: prev.measures + 1,
        feed: pushFeed(prev.feed, prev.monthIndex, FEED.deploy),
        caption: "deploy",
      };
    });
  };

  const buyin = () => {
    setSim((prev) => {
      if (
        prev.ended ||
        prev.buyinTicks > 0 ||
        prev.economic < BUYIN.economicCost
      ) {
        return prev;
      }
      return {
        ...prev,
        economic: clamp(prev.economic - BUYIN.economicCost),
        social: clamp(prev.social + BUYIN.social),
        buyinTicks: BUYIN.months,
        feed: pushFeed(prev.feed, prev.monthIndex, FEED.buyin),
        caption: "buyin",
      };
    });
  };

  const passPolicy = () => {
    setSim((prev) => {
      const after = prev.political - POLICY_COST;
      // Below the bar → not allowed at all (also keeps the balance from
      // ever dipping under its own floor line).
      if (prev.ended || prev.political < POLICY_MIN || after < prev.policyFloor) {
        return prev;
      }
      // Landing well clear of the bar raises it to where you landed;
      // barely clearing it only nudges the bar by the small bump.
      const policyFloor =
        after > prev.policyFloor + POLICY_MARGINAL_ZONE
          ? after
          : Math.min(after, prev.policyFloor + POLICY_MARGINAL_BUMP);
      return {
        ...prev,
        political: after,
        policyFloor,
        feed: pushFeed(prev.feed, prev.monthIndex, FEED.policy),
        caption: "policy",
      };
    });
  };

  const barX = (i: number) => BARS_LEFT + i * (BAR_W + BAR_GAP);
  const level = (value: number) => (value / 100) * BAR_MAX_H;
  const monthsLeft = Math.max(0, monthsTotal - sim.monthIndex);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <div className="text-muted-foreground flex items-baseline justify-between text-xs">
            <span
              suppressHydrationWarning
              className="text-foreground text-sm font-semibold tabular-nums"
            >
              {monthLabel(sim.monthIndex)}
            </span>
            <span>1 second ≈ 1 month</span>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="The will account: bars for economic, political, and social will that fade monthly; passed policy draws a durable floor under political will"
          >
            {WILLS.map((will, i) => {
              const value = sim[will.key];
              return (
                <g key={will.key}>
                  <rect
                    x={barX(i)}
                    y={BAR_BOTTOM - BAR_MAX_H}
                    width={BAR_W}
                    height={BAR_MAX_H}
                    rx={6}
                    className="fill-muted/40 stroke-border"
                    strokeWidth={1}
                  />
                  <rect
                    x={barX(i)}
                    y={BAR_BOTTOM - level(value)}
                    width={BAR_W}
                    height={level(value)}
                    rx={4}
                    className={`${will.fill} transition-all duration-500 motion-reduce:transition-none`}
                  />
                  <text
                    x={barX(i) + BAR_W / 2}
                    y={BAR_BOTTOM + 16}
                    textAnchor="middle"
                    className="fill-foreground text-[12px] font-medium"
                  >
                    {will.label}
                  </text>
                  <text
                    x={barX(i) + BAR_W / 2}
                    y={BAR_BOTTOM - level(value) - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px] tabular-nums"
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}
            {sim.policyFloor > 0 && (
              <g>
                <line
                  x1={barX(1) - 10}
                  x2={barX(1) + BAR_W + 10}
                  y1={BAR_BOTTOM - level(sim.policyFloor)}
                  y2={BAR_BOTTOM - level(sim.policyFloor)}
                  className="stroke-emerald-600 dark:stroke-emerald-400"
                  strokeWidth={2}
                />
                <text
                  x={barX(1) + BAR_W + 14}
                  y={BAR_BOTTOM - level(sim.policyFloor) + 4}
                  className="fill-emerald-700 dark:fill-emerald-400 text-[10px]"
                >
                  floor
                </text>
              </g>
            )}
            {sim.buyinTicks > 0 && (
              <text
                x={barX(2) + BAR_W / 2}
                y={BAR_BOTTOM - BAR_MAX_H - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                fading slowed
              </text>
            )}
          </svg>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" onClick={deploy} disabled={sim.ended}>
              Deploy control · {cost.economic} econ + {cost.social} soc
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={buyin}
              disabled={
                sim.ended ||
                sim.buyinTicks > 0 ||
                sim.economic < BUYIN.economicCost
              }
            >
              {sim.buyinTicks > 0
                ? `Campaign running · ${sim.buyinTicks} mo`
                : `Public buy-in · ${BUYIN.economicCost} econ (${BUYIN.months} mo)`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={passPolicy}
              disabled={!canPassPolicy}
            >
              Pass policy · {POLICY_COST} political
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPlaying((p) => !p)}
              disabled={sim.ended}
              aria-label={playing ? "Pause animation" : "Play animation"}
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
          </div>
        </div>

        {/* Info panel: objective, clock, score, prices, active effects. */}
        <aside className="border-border space-y-2 rounded-lg border p-3 text-xs">
          <p className="text-foreground font-medium">
            Deploy as much control as possible by the end of 2029 — the policy floor
            you lock in persists.
          </p>
          <dl className="space-y-1">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">months left</dt>
              <dd className="tabular-nums">{monthsLeft}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">measures deployed</dt>
              <dd className="font-semibold tabular-nums">{sim.measures}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">schemers caught</dt>
              <dd className="tabular-nums">{sim.catches}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">catch chance / mo</dt>
              <dd className="tabular-nums">
                {Math.round(catchChance(sim.measures) * 100)}%
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">basket price</dt>
              <dd className="tabular-nums">
                {cost.economic} econ + {cost.social} soc
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">public alarm</dt>
              <dd className="tabular-nums">
                {sim.alarmTicks > 0 ? `${sim.alarmTicks} mo — cheaper` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">buy-in campaign</dt>
              <dd className="tabular-nums">
                {sim.buyinTicks > 0 ? `${sim.buyinTicks} mo` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">policy floor</dt>
              <dd className="tabular-nums">
                {sim.policyFloor > 0 ? Math.round(sim.policyFloor) : "—"}
              </dd>
            </div>
          </dl>
          {sim.ended && (
            <p className="border-border text-foreground border-t pt-2 font-medium">
              Final: {sim.measures}{" "}
              {sim.measures === 1 ? "measure" : "measures"} deployed ·{" "}
              {sim.catches} caught · floor{" "}
              {sim.policyFloor > 0 ? Math.round(sim.policyFloor) : 0} locked
              in. Reset to play again.
            </p>
          )}
        </aside>
      </div>

      {sim.feed.length > 0 && (
        <ul className="border-border rounded-md border p-2 text-xs">
          {sim.feed
            .slice(-FEED_SHOWN)
            .reverse()
            .map((entry, i) => (
              <li
                key={`${sim.feed.length - i}`}
                className={i === 0 ? "flex gap-2" : "flex gap-2 opacity-70"}
              >
                <span
                  suppressHydrationWarning
                  className="text-muted-foreground w-20 shrink-0 tabular-nums"
                >
                  {monthLabel(entry.month)}
                </span>
                <span>{entry.text}</span>
              </li>
            ))}
        </ul>
      )}

      <p aria-live="polite" className="text-muted-foreground min-h-16 text-sm">
        {CAPTIONS[sim.caption]}
      </p>
    </div>
  );
}

export function WillAccountDemo() {
  return <WillAccountGame />;
}
