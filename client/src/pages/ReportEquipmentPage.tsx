import React, { useEffect, useState } from "react";
import { Paper, Typography, Button, Box, Divider, TextField, MenuItem, Alert, CircularProgress } from "@mui/material";
import { NavBar } from "../components/NavBar";
import { useParams } from "react-router-dom";
import { API_BASE } from "@/apiBase";
import { useAuth } from "../hooks/useAuth";

type FunctionalStatus = "functional" | "lost" | "broken";

interface EquipmentResponse {
  id: string;
  name: string;
  description?: string | null;
  type_of_equipment: string;
  functional_status: FunctionalStatus;
  functional_status_comment?: string | null;
}


export const ReportEquipmentPage = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  const { token } = useAuth();

  const [equipment, setEquipment] = useState<EquipmentResponse | null>(null);
  const [status, setStatus] = useState<FunctionalStatus>("functional");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const statusLabel: Record<FunctionalStatus, string> = {
  functional: "Alt i orden",
  broken: "Ødelagt",
  lost: "Tapt",
  };

  const fetchEquipment = async () => {
    if (!id) return;

    setLoading(true);
    setErrorMessage("");
    
    try {
      const res = await fetch(`${API_BASE}/equipment/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch equipment");
      }

      const data: EquipmentResponse = await res.json();

      setEquipment(data);
      setStatus(data.functional_status);
      setComment(data.functional_status_comment ?? "");
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setErrorMessage("Kunne ikke hente utstyrsinformasjon.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [id, token]);

  const handleSubmit = async () => {
    if (!id) return;

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/equipment/${id}/functional_status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          functional_status: status,
          functional_status_comment: comment.trim() || null,
        }),
      });
    
      if (!res.ok) {
        const text = await res.text();
        console.error("Update failed:", text);
        throw new Error("Failed to update equipment status");
      }

      setSuccessMessage("Status ble oppdatert.");
      await fetchEquipment();
    } catch (error) {
      console.error("Error updating equipment status:", error);
      setErrorMessage("Kunne ikke oppdatere status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <NavBar />

      <Box sx={{ mt: "8em", display: "flex", justifyContent: "center" }}>
        <Paper sx={{ maxWidth: 700, width: "100%", p: 4 }}>
          <Typography
            variant="h5"
            sx={{
              px: 2,
              py: 1,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Rapporter utstyr: {name}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMessage}
                </Alert>
              )}

              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {successMessage}
                </Alert>
              )}

              {equipment && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nåværende status
                    </Typography>
                    <Typography variant="body1">
                      {statusLabel[equipment.functional_status]}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nåværende kommentar
                    </Typography>
                    <Typography variant="body1">
                      {equipment.functional_status_comment || "Ingen kommentar"}
                    </Typography>
                  </Box>

                  <TextField
                    select
                    label="Ny status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as FunctionalStatus)
                    }
                    fullWidth
                  >
                    <MenuItem value="functional">{statusLabel.functional}</MenuItem>
                    <MenuItem value="broken">{statusLabel.broken}</MenuItem>
                    <MenuItem value="lost">{statusLabel.lost}</MenuItem>
                  </TextField>

                  <TextField
                    label="Kommentar"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    multiline
                    minRows={4}
                    fullWidth
                    placeholder="Beskriv problemet eller legg til relevant informasjon"
                  />

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? "Lagrer..." : "Oppdater status"}
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    </>
  );
};
