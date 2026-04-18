import type { ReactNode } from "react";

export interface Equipment {
  type: ReactNode;
  id: string;
  name: string;
  description: string;
  type_of_equipment: string;
  owner_id: string;
  current_pos?: { lat: number; lng: number }; 
  created_at: string;
}

export interface Booking {
  id: string;
  equipment_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  booking_destination: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
}