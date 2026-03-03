import React, { useState } from "react";
import { MetricCards } from "../components/MetricCards";
import { RecentOrders } from "../components/RecentOrders";
import { ActionQueue } from "../components/ActionQueue";
import { ExtractionChart } from "../components/ExtractionChart";
import { QuickExtract } from "../components/QuickExtract";
import { AIWorkerHealthModal } from "../components/AIWorkerHealthModal";

export function DashboardPage() {
  const [showAIHealth, setShowAIHealth] = useState(false);

  return (
    <div className="p-6" style={{ maxWidth: 1220 }}>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <MetricCards onOpenAIHealth={() => setShowAIHealth(true)} />
        <RecentOrders />
        <ActionQueue />
        <ExtractionChart />
        <QuickExtract />
      </div>

      {showAIHealth && (
        <AIWorkerHealthModal onClose={() => setShowAIHealth(false)} />
      )}
    </div>
  );
}