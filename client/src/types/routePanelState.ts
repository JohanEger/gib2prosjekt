/** Tilstand som Map oppdaterer og utstyr-panelet viser under «Ruteinformasjon». */
export type RoutePanelState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      meters: number;
      seconds: number;
    }
  | { status: "no_route" }
  | { status: "error" };
