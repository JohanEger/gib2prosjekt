import { useState, useEffect } from "react";
import { TextField, Autocomplete, CircularProgress } from "@mui/material";

type Coordinates = {
  lat: number;
  lng: number;
};

type Option = {
  label: string;
  lat: number;
  lng: number;
};

type PhotonFeature = {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
};

export default function AddressSearch({
  setCoords,
}: {
  setCoords: React.Dispatch<React.SetStateAction<Coordinates | null>>;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!inputValue || inputValue.length < 3) {
      setOptions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            inputValue + " Trondheim",
          )}&limit=5`,
        );

        const data = await res.json();

        const results: Option[] = data.features.map((item: PhotonFeature) => {
          const { street, housenumber, city, name } = item.properties;

          const label =
            street && housenumber
              ? `${street} ${housenumber}, ${city ?? ""}`
              : street
                ? `${street}, ${city ?? ""}`
                : name
                  ? `${name}, ${city ?? ""}`
                  : inputValue;
          return {
            label: label.trim(),
            lat: item.geometry.coordinates[1],
            lng: item.geometry.coordinates[0],
          };
        });

        setOptions(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [inputValue]);

  return (
    <Autocomplete
      options={options}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.label
      }
      filterOptions={(x) => x}
      loading={loading}
      onChange={(_, value) => {
        if (value && typeof value !== "string") {
          setCoords({
            lat: value.lat,
            lng: value.lng,
          });
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Søk adresse"
          size="small"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
