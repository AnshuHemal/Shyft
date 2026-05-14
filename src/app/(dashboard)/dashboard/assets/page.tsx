import type { Metadata } from "next";
import { HRAssetsManagement } from "@/components/dashboard/assets/hr-assets-management";

export const metadata: Metadata = {
  title: "Assets & Inventory",
  description: "Manage company assets and employee requests.",
};

export default function AssetsManagementPage() {
  return <HRAssetsManagement />;
}
