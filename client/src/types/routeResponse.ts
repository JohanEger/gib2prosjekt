import type { LineString } from "geojson";

export type TransitLegMode = "foot" | "bus";

export interface RouteLiveVehicle {
  serviceJourneyId: string;
  date: string;
  linePublicCode?: string | null;
  destinationName?: string | null;
  vehicleId?: string | null;
  vehicleStatus?: string | null;
  monitored?: boolean | null;
  delaySeconds?: number | null;
  bearing?: number | null;
  lastUpdated?: string | null;
  latitude: number;
  longitude: number;
  stopPointRef?: string | null;
  stopOrder?: number | null;
  vehicleAtStop?: boolean | null;
}

export interface TransitLeg {
  mode: TransitLegMode;
  distanceMeters: number;
  seconds: number;
  coordinates: number[][];
  fromName?: string | null;
  toName?: string | null;
  aimedStartTime?: string | null;
  aimedEndTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  linePublicCode?: string | null;
  authorityName?: string | null;
  serviceJourneyId?: string | null;
  serviceDate?: string | null;
  liveVehicle?: RouteLiveVehicle | null;
}

export interface TransitRouteDetails {
  provider: "entur";
  walkMeters: number;
  legs: TransitLeg[];
}

export type RouteResponse = LineString & {
  meters?: number;
  seconds?: number;
  transit?: TransitRouteDetails;
};
