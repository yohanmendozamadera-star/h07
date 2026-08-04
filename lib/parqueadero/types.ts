import type { ParkingRateType } from "@/lib/parqueadero/tariff";

export type ParkingRate = {
  id: string;
  name: string;
  rate_type: ParkingRateType;
  amount: number;
  is_active: boolean;
};

export type OpenMovement = {
  id: string;
  plate: string;
  client_id: string | null;
  entry_at: string;
  parking_rate: { id: string; name: string; rate_type: ParkingRateType; amount: number };
};
