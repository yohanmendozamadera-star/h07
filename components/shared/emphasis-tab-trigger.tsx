import type { LucideIcon } from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";

export function EmphasisTabTrigger({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <TabsTrigger
      value={value}
      className="group/emphasis-tab h-12 flex-none gap-2 rounded-xl border border-border/80 bg-card px-4 text-sm shadow-sm transition-all hover:border-cyan-500/40 hover:bg-cyan-500/5 data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:shadow-[0_8px_22px_rgba(7,31,77,0.22)] sm:px-5"
    >
      <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground group-data-[active]/emphasis-tab:bg-cyan-400/20 group-data-[active]/emphasis-tab:text-cyan-200">
        <Icon className="size-4" />
      </span>
      {label}
    </TabsTrigger>
  );
}
