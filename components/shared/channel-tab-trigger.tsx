import { CarFront, CircleParking, Package, Wrench } from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";
import { CHANNEL_LABELS, type CatalogChannel } from "@/lib/servicios/types";

const CHANNEL_ICONS = {
  lavanderia: CarFront,
  productos: Package,
  taller: Wrench,
  parqueadero: CircleParking,
} as const;

export function ChannelTabTrigger({ channel }: { channel: CatalogChannel | "parqueadero" }) {
  const Icon = CHANNEL_ICONS[channel];
  const label = channel === "parqueadero" ? "Parqueadero" : CHANNEL_LABELS[channel];

  return (
    <TabsTrigger
      value={channel}
      className="group/channel-tab h-12 flex-none gap-2 rounded-xl border border-border/80 bg-card px-4 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-cyan-500/5 data-active:-translate-y-0.5 data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:shadow-[0_8px_22px_rgba(7,31,77,0.22)] sm:px-5"
    >
      <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground group-data-[active]/channel-tab:bg-cyan-400/20 group-data-[active]/channel-tab:text-cyan-200">
        <Icon className="size-4" />
      </span>
      {label}
    </TabsTrigger>
  );
}
