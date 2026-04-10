type Coordinates = {
  lat: number;
  lng: number;
};

export async function fetchLatLngFromAddress(
  address: string
): Promise<Coordinates> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "my-app (eliashakonsen2910@gmail.com)", 
      },
    }
  );

  if (!res.ok) {
    throw new Error("Kunne ikke hente koordinater");
  }

  const data = await res.json();

  if (!data.length) {
    throw new Error("Fant ikke adresse");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}