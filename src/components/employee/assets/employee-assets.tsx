"use client";

import * as React from "react";
import { toast } from "sonner";
import { LaptopIcon } from "lucide-react";
import { AssetForm } from "./asset-form";
import { AssetHistory } from "./asset-history";

export function EmployeeAssets() {
  const [requests, setRequests] = React.useState([]);
  const [inventory, setInventory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [reqRes, invRes] = await Promise.all([
        fetch("/api/assets/requests"),
        fetch("/api/assets/inventory")
      ]);
      const [reqJson, invJson] = await Promise.all([reqRes.json(), invRes.json()]);
      
      if (reqRes.ok) setRequests(reqJson.requests || []);
      if (invRes.ok) setInventory(invJson.assets || []);
    } catch {
      toast.error("Failed to load asset data.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchData(); }, []);

  return (
    <div className={`space-y-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <LaptopIcon className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Request new equipment or manage assigned assets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          <AssetForm assignedAssets={inventory} onSubmitted={fetchData} />
        </div>
        <div className="space-y-6">
          <AssetHistory requests={requests} loading={loading} onRefresh={fetchData} />
        </div>
      </div>
    </div>
  );
}
