import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { fetchUserId } from "./fetchUserId";

type Booking = {
  start: Date;
  end: Date;
  equipmentId: string;
  lat: number;
  lng: number;
};

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

export function useBookings() {
  const { token } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);


  useEffect(() => {
    const getUserId = async () => {
      if (!token) {
        setUserId(null);
        setLoadingUser(false);
        return;
      }

      try {
        const id = await fetchUserId(token);
        setUserId(id);
      } catch (err) {
        console.error("Failed to fetch userId:", err);
        setUserId(null);
      } finally {
        setLoadingUser(false);
      }
    };

    getUserId();
  }, [token]);

  const createBooking = async (booking: Booking) => {
    if (loadingUser) {
      throw new Error("Bruker lastes fortsatt...");
    }

    if (!token) {
      throw new Error("Ikke logget inn");
    }

    if (!userId) {
      throw new Error("Fant ikke bruker-ID");
    }

    if (booking.start >= booking.end) {
      throw new Error("Sluttid må være etter starttid");
    }

    const bookingToBackend = {
      equipment_id: booking.equipmentId,
      user_id: userId,
      start_time: booking.start.toISOString(),
      end_time: booking.end.toISOString(),
      latitude: booking.lat,
      longitude: booking.lng,
    };

    try {
      const res = await fetch(`${API_BASE}/booking/create_booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify(bookingToBackend),
      });

      const text = await res.text();
      console.log("Backend response:", text);

      if (!res.ok) {
        throw new Error(text || "Kunne ikke opprette booking");
      }

      return JSON.parse(text);
    } catch (err) {
      console.error("Booking error:", err);
      throw err;
    }
  };

  return { createBooking, userId, loadingUser };
}