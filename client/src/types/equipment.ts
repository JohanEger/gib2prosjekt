export type FunctionalStatus = "functional" | "lost" | "broken";

export interface Equipment {
  id: string;
  name: string;
  description: string;
  type_of_equipment: string;
  owner_id: string;
  lat: number;
  lng: number;
  booked: boolean;
  functional_status: FunctionalStatus;
  functional_status_comment?: string | null;
}
