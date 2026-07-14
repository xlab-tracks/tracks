import type { ComponentType } from "react";
import type { VerificationWidgetProps } from "../kit/types";
import { PolicyCost } from "./policy-cost";
import { VerificationLandscape } from "./verification-landscape";
import { DissectionTable } from "./dissection-table";
import { PolicyScoping } from "./policy-scoping";
import { AnatomyDrill } from "./anatomy-drill";
import { ProtocolActors } from "./protocol-actors";
import { TamperTrace } from "./tamper-trace";
import { ReportConstructor } from "./report-constructor";
import { IrPrimer } from "./ir-primer";
import { FacilitatorGuide } from "./facilitator-guide";
import { ChangeTheGame } from "./change-the-game";
import { InspectionGame } from "./inspection-game";
import { EvolutionOfVerification } from "./evolution-of-verification";
import { GameTheoryPrimer } from "./game-theory-primer";
import { WhatDoTheySay } from "./what-do-they-say";
import { VerificationTimelineGame } from "./verification-timeline-game";
import { InteractiveMap } from "./interactive-map";

/**
 * Native React widgets ported from the standalone HTML pages, keyed by the same
 * page id used in `src/lib/verification/exercises.ts`. Ids not present here fall
 * back to the legacy iframe host (see verification-widget-host.tsx).
 */
export const verificationWidgets: Record<
  string,
  ComponentType<VerificationWidgetProps>
> = {
  "policy-cost": PolicyCost,
  "verification-landscape": VerificationLandscape,
  "dissection-table": DissectionTable,
  "policy-scoping": PolicyScoping,
  "anatomy-drill": AnatomyDrill,
  "protocol-actors": ProtocolActors,
  "tamper-trace": TamperTrace,
  "report-constructor": ReportConstructor,
  "ir-primer": IrPrimer,
  "facilitator-guide": FacilitatorGuide,
  "change-the-game": ChangeTheGame,
  "inspection-game": InspectionGame,
  "evolution-of-verification": EvolutionOfVerification,
  "game-theory-primer": GameTheoryPrimer,
  "what-do-they-say": WhatDoTheySay,
  "verification-timeline-game": VerificationTimelineGame,
  "interactive-map": InteractiveMap,
};

export function getVerificationWidget(
  id: string,
): ComponentType<VerificationWidgetProps> | undefined {
  return verificationWidgets[id];
}
