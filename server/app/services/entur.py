import asyncio
import logging
import os
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

ENTUR_CLIENT_NAME = os.getenv("ENTUR_CLIENT_NAME", "gib2prosjekt-local")
ENTUR_CODESPACE = os.getenv("ENTUR_CODESPACE", "ATB")
ENTUR_JOURNEY_URL = "https://api.entur.io/journey-planner/v3/graphql"
ENTUR_VEHICLES_URL = "https://api.entur.io/realtime/v2/vehicles/graphql"
HTTP_TIMEOUT_SECONDS = 20.0

TRIP_QUERY = """
query Trip($fromLat: Float!, $fromLng: Float!, $toLat: Float!, $toLng: Float!) {
  trip(
    from: { coordinates: { latitude: $fromLat, longitude: $fromLng } }
    to: { coordinates: { latitude: $toLat, longitude: $toLng } }
    numTripPatterns: 3
    modes: {
      accessMode: foot
      egressMode: foot
      transportModes: [{ transportMode: bus }]
    }
  ) {
    tripPatterns {
      duration
      walkDistance
      legs {
        mode
        distance
        aimedStartTime
        aimedEndTime
        expectedStartTime
        expectedEndTime
        pointsOnLink {
          points
        }
        fromPlace {
          name
        }
        toPlace {
          name
        }
        line {
          id
          publicCode
          authority {
            name
          }
        }
        serviceJourney {
          id
        }
      }
    }
  }
}
"""

WALK_TRIP_QUERY = """
query WalkTrip($fromLat: Float!, $fromLng: Float!, $toLat: Float!, $toLng: Float!) {
  trip(
    from: { coordinates: { latitude: $fromLat, longitude: $fromLng } }
    to: { coordinates: { latitude: $toLat, longitude: $toLng } }
    numTripPatterns: 1
    modes: {
      directMode: foot
      transportModes: []
    }
  ) {
    tripPatterns {
      duration
      walkDistance
      legs {
        mode
        distance
        aimedStartTime
        aimedEndTime
        expectedStartTime
        expectedEndTime
        pointsOnLink {
          points
        }
        fromPlace {
          name
        }
        toPlace {
          name
        }
      }
    }
  }
}
"""

LIVE_VEHICLE_QUERY = """
query LiveVehicle($serviceJourneyId: String!, $date: String!, $codespaceId: String!) {
  vehicles(
    serviceJourneyId: $serviceJourneyId
    date: $date
    codespaceId: $codespaceId
  ) {
    serviceJourney {
      id
      date
    }
    line {
      publicCode
    }
    destinationName
    vehicleId
    vehicleStatus
    monitored
    delay
    bearing
    lastUpdated
    location {
      latitude
      longitude
    }
    monitoredCall {
      stopPointRef
      order
      vehicleAtStop
    }
  }
}
"""


def _entur_headers() -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "ET-Client-Name": ENTUR_CLIENT_NAME,
    }


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _duration_seconds(start_time: str | None, end_time: str | None) -> float:
    start = _parse_iso_datetime(start_time)
    end = _parse_iso_datetime(end_time)
    if start is None or end is None:
        return 0.0
    return max((end - start).total_seconds(), 0.0)


def _decode_polyline(encoded: str) -> list[list[float]]:
    index = 0
    lat = 0
    lng = 0
    coordinates: list[list[float]] = []

    while index < len(encoded):
        for current in ("lat", "lng"):
            shift = 0
            result = 0

            while True:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break

            delta = ~(result >> 1) if result & 1 else result >> 1
            if current == "lat":
                lat += delta
            else:
                lng += delta

        coordinates.append([lng / 1e5, lat / 1e5])

    return coordinates


def _merge_leg_coordinates(legs: list[dict]) -> list[list[float]]:
    merged: list[list[float]] = []

    for leg in legs:
        encoded = ((leg.get("pointsOnLink") or {}).get("points"))
        if not encoded:
            continue

        leg_coordinates = _decode_polyline(encoded)
        if not leg_coordinates:
            continue

        if merged and merged[-1] == leg_coordinates[0]:
            leg_coordinates = leg_coordinates[1:]

        merged.extend(leg_coordinates)

    return merged


async def _post_graphql(
    client: httpx.AsyncClient,
    url: str,
    query: str,
    variables: dict,
) -> dict:
    response = await client.post(
        url,
        json={"query": query, "variables": variables},
        headers=_entur_headers(),
    )
    response.raise_for_status()

    payload = response.json()
    errors = payload.get("errors") or []
    if errors:
        message = "; ".join(
            error.get("message", "Ukjent Entur-feil") for error in errors
        )
        raise ValueError(message)

    data = payload.get("data")
    if not isinstance(data, dict):
        raise ValueError("Entur returnerte ugyldig datastruktur")

    return data


async def _fetch_live_vehicle(
    client: httpx.AsyncClient,
    service_journey_id: str,
    service_date: str,
) -> dict | None:
    if not service_journey_id.startswith(f"{ENTUR_CODESPACE}:"):
        return None

    try:
        data = await _post_graphql(
            client,
            ENTUR_VEHICLES_URL,
            LIVE_VEHICLE_QUERY,
            {
                "serviceJourneyId": service_journey_id,
                "date": service_date,
                "codespaceId": ENTUR_CODESPACE,
            },
        )
    except Exception:
        logger.exception(
            "Klarte ikke hente live-kjoretoy for %s %s",
            service_journey_id,
            service_date,
        )
        return None

    vehicles = data.get("vehicles") or []
    if not vehicles:
        return None

    best_vehicle = max(vehicles, key=lambda vehicle: vehicle.get("lastUpdated") or "")
    location = best_vehicle.get("location") or {}
    monitored_call = best_vehicle.get("monitoredCall") or {}
    line = best_vehicle.get("line") or {}

    latitude = location.get("latitude")
    longitude = location.get("longitude")
    if latitude is None or longitude is None:
        return None

    return {
        "serviceJourneyId": service_journey_id,
        "date": service_date,
        "linePublicCode": line.get("publicCode"),
        "destinationName": best_vehicle.get("destinationName"),
        "vehicleId": best_vehicle.get("vehicleId"),
        "vehicleStatus": best_vehicle.get("vehicleStatus"),
        "monitored": best_vehicle.get("monitored"),
        "delaySeconds": best_vehicle.get("delay"),
        "bearing": best_vehicle.get("bearing"),
        "lastUpdated": best_vehicle.get("lastUpdated"),
        "latitude": latitude,
        "longitude": longitude,
        "stopPointRef": monitored_call.get("stopPointRef"),
        "stopOrder": monitored_call.get("order"),
        "vehicleAtStop": monitored_call.get("vehicleAtStop"),
    }


async def compute_bus_route(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
) -> dict:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
        data = await _post_graphql(
            client,
            ENTUR_JOURNEY_URL,
            TRIP_QUERY,
            {
                "fromLat": start_lat,
                "fromLng": start_lng,
                "toLat": end_lat,
                "toLng": end_lng,
            },
        )

        trip_patterns = ((data.get("trip") or {}).get("tripPatterns")) or []
        best_pattern = next(
            (
                pattern
                for pattern in trip_patterns
                if any((leg.get("mode") or "").lower() == "bus" for leg in pattern.get("legs", []))
            ),
            None,
        )

        if best_pattern is None:
            raise ValueError("Ingen bussrute funnet mellom punktene")

        raw_legs = best_pattern.get("legs") or []
        live_vehicle_tasks = []
        live_vehicle_meta: list[tuple[str, str]] = []

        for leg in raw_legs:
            mode = (leg.get("mode") or "").lower()
            service_journey = leg.get("serviceJourney") or {}
            service_journey_id = service_journey.get("id")
            service_date = (leg.get("expectedStartTime") or leg.get("aimedStartTime") or "")[:10]

            if mode == "bus" and service_journey_id and service_date:
                live_vehicle_meta.append((service_journey_id, service_date))
                live_vehicle_tasks.append(
                    _fetch_live_vehicle(client, service_journey_id, service_date)
                )

        live_vehicle_results = await asyncio.gather(*live_vehicle_tasks) if live_vehicle_tasks else []
        live_vehicle_by_ref = {
            ref: vehicle
            for ref, vehicle in zip(live_vehicle_meta, live_vehicle_results, strict=False)
        }

        normalized_legs = []
        for leg in raw_legs:
            mode = (leg.get("mode") or "").lower()
            expected_start = leg.get("expectedStartTime") or leg.get("aimedStartTime")
            expected_end = leg.get("expectedEndTime") or leg.get("aimedEndTime")
            line = leg.get("line") or {}
            authority = line.get("authority") or {}
            service_journey = leg.get("serviceJourney") or {}
            service_journey_id = service_journey.get("id")
            service_date = (expected_start or "")[:10]

            normalized_legs.append(
                {
                    "mode": mode,
                    "distanceMeters": leg.get("distance") or 0.0,
                    "seconds": _duration_seconds(expected_start, expected_end),
                    "coordinates": _decode_polyline(
                        ((leg.get("pointsOnLink") or {}).get("points")) or ""
                    ),
                    "fromName": (leg.get("fromPlace") or {}).get("name"),
                    "toName": (leg.get("toPlace") or {}).get("name"),
                    "aimedStartTime": leg.get("aimedStartTime"),
                    "aimedEndTime": leg.get("aimedEndTime"),
                    "expectedStartTime": expected_start,
                    "expectedEndTime": expected_end,
                    "linePublicCode": line.get("publicCode"),
                    "authorityName": authority.get("name"),
                    "serviceJourneyId": service_journey_id,
                    "serviceDate": service_date or None,
                    "liveVehicle": live_vehicle_by_ref.get((service_journey_id, service_date)),
                }
            )

        coordinates = _merge_leg_coordinates(raw_legs)
        total_meters = sum((leg.get("distance") or 0.0) for leg in raw_legs)

        return {
            "type": "LineString",
            "coordinates": coordinates,
            "meters": total_meters,
            "seconds": best_pattern.get("duration") or 0.0,
            "transit": {
                "provider": "entur",
                "walkMeters": best_pattern.get("walkDistance") or 0.0,
                "legs": normalized_legs,
            },
        }


async def compute_walk_route(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
) -> dict:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
        data = await _post_graphql(
            client,
            ENTUR_JOURNEY_URL,
            WALK_TRIP_QUERY,
            {
                "fromLat": start_lat,
                "fromLng": start_lng,
                "toLat": end_lat,
                "toLng": end_lng,
            },
        )

        trip_patterns = ((data.get("trip") or {}).get("tripPatterns")) or []
        best_pattern = trip_patterns[0] if trip_patterns else None
        if best_pattern is None:
            raise ValueError("Ingen gangrute funnet mellom punktene")

        raw_legs = best_pattern.get("legs") or []
        coordinates = _merge_leg_coordinates(raw_legs)
        meters = best_pattern.get("walkDistance")
        if meters is None:
            meters = sum((leg.get("distance") or 0.0) for leg in raw_legs)

        return {
            "type": "LineString",
            "coordinates": coordinates,
            "meters": meters,
            "seconds": best_pattern.get("duration") or 0.0,
        }
