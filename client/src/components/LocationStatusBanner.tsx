import { useEffect, useState } from "react";
import { Alert, AlertTitle, Collapse, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useUserLocation } from "../hooks/useUserLocation";

/**
 * Viser en advarsel når brukerens posisjon ikke er tilgjengelig.
 * Funksjoner som "korteste vei" og sortering etter avstand krever
 * geolocation-tilgang.
 *
 * Banneret kan lukkes med X. Når status endrer seg (f.eks. brukeren
 * endrer permission i nettleseren) vises det igjen.
 */
export const LocationStatusBanner = () => {
  const { latitude, longitude, error, loading } = useUserLocation();
  const [dismissed, setDismissed] = useState(false);

  const hasNoPosition =
    !loading && (error !== null || latitude === null || longitude === null);

  // Reset dismiss-state hvis feilstatus endrer seg (f.eks. ny error etter prev success)
  useEffect(() => {
    setDismissed(false);
  }, [error]);

  const visible = hasNoPosition && !dismissed;

  const isPermissionDenied =
    error !== null && /denied|permission/i.test(error);

  const title = isPermissionDenied
    ? "Posisjonsdeling er avslått"
    : "Posisjonen din er ikke tilgjengelig";

  const message = isPermissionDenied ? (
    <>
      Du har avslått posisjonsdeling for denne siden. Funksjoner som{" "}
      <strong>korteste vei</strong> og <strong>sortering etter avstand</strong>{" "}
      vil ikke fungere før du tillater det. Aktiver i nettleserens
      adressefelt-ikon (🔒) → "Posisjon" → "Tillat".
    </>
  ) : (
    <>
      Vi får ikke tak i posisjonen din akkurat nå. Funksjoner som{" "}
      <strong>korteste vei</strong> og <strong>sortering etter avstand</strong>{" "}
      vil ikke fungere. Sjekk at posisjonsdeling er aktivert i nettleseren og at
      enheten har GPS/Wi-Fi tilgjengelig.
    </>
  );

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: 64, sm: 72 },
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 40,
        width: "calc(100% - 24px)",
        maxWidth: 640,
        pointerEvents: "none",
      }}
    >
      <Collapse in={visible}>
        <Alert
          severity="warning"
          variant="filled"
          sx={{
            pointerEvents: "auto",
            boxShadow: 3,
            alignItems: "flex-start",
          }}
          action={
            <IconButton
              aria-label="lukk"
              color="inherit"
              size="small"
              onClick={() => setDismissed(true)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>
          {message}
        </Alert>
      </Collapse>
    </Box>
  );
};
