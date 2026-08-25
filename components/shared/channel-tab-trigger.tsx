import { CarFront, CircleParking, Package, Wrench } from "lucide-react";
import { CHANNEL_LABELS, type CatalogChannel } from "@/lib/servicios/types";
import { EmphasisTabTrigger } from "@/components/shared/emphasis-tab-trigger";

const CHANNEL_ICONS = {
  lavanderia: CarFront,
  productos: Package,
  taller: Wrench,
  parqueadero: CircleParking,
} as const;

export function ChannelTabTrigger({ channel }: { channel: CatalogChannel | "parqueadero" }) {
  const Icon = CHANNEL_ICONS[channel];
  const label = channel === "parqueadero" ? "Parqueadero" : CHANNEL_LABELS[channel];

  return <EmphasisTabTrigger value={channel} label={label} icon={Icon} />;
}
