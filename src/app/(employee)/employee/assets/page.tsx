import type { Metadata } from "next";
import { EmployeeAssets } from "@/components/employee/assets/employee-assets";

export const metadata: Metadata = {
  title: "Asset Requests",
  description: "Request, replace, or return company assets.",
};

export default function EmployeeAssetsPage() {
  return <EmployeeAssets />;
}
