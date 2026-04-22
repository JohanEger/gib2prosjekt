import { createContext, useState } from "react";
import type { ReactNode } from "react";

type Coordinates = {
  lat: number;
  lng: number;
};

type RouteContextType = {
  findEquipment: Coordinates | null;
  setFindEquipment: React.Dispatch<React.SetStateAction<Coordinates | null>>;
};

export const RouteContext = createContext<RouteContextType>({
  findEquipment: null,
  setFindEquipment: () => {},
});

type ProviderProps = {
  children: ReactNode;
};

export const RouteProvider = ({ children }: ProviderProps) => {
  const [findEquipment, setFindEquipment] = useState<Coordinates | null>(null);

  return (
    <RouteContext.Provider value={{ findEquipment, setFindEquipment }}>
      {children}
    </RouteContext.Provider>
  );
};
