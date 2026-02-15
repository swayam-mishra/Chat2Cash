import type { ExtractedChatOrder } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Package, Clock, CheckCircle2, IndianRupee } from "lucide-react";

interface StatsBarProps {
  orders: ExtractedChatOrder[];
}

export function StatsBar({ orders }: StatsBarProps) {
  if (orders.length === 0) return null;

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: Package,
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: CheckCircle2,
    },
    {
      label: "Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="stats-bar">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
            <stat.icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
            <p className="text-lg font-semibold leading-tight" data-testid={`text-stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
