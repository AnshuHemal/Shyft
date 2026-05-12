"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  BuildingIcon,
  BadgeIcon,
} from "lucide-react";

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

interface EmployeeProfileProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    address: string | null;
    employeeId: string | null;
    designation: string;
    department: string | null;
    position: string | null;
    employmentType: string;
    status: string;
    joiningDate: Date | null;
    salary: number | null;
    currency: string | null;
    notes: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  ON_LEAVE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  TERMINATED: "bg-destructive/10 text-destructive border-destructive/20",
};

export function EmployeeProfile({ employee }: EmployeeProfileProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const displayName = `${employee.firstName} ${employee.lastName}`;

  return (
    <div
      className={cn(
        "space-y-6 max-w-3xl transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal and professional information.
        </p>
      </div>

      {/* Profile header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                {getInitials(employee.firstName, employee.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{employee.designation}</p>
              {employee.department && (
                <p className="text-xs text-muted-foreground mt-0.5">{employee.department}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    STATUS_COLORS[employee.status] ?? STATUS_COLORS.INACTIVE
                  )}
                >
                  {employee.status.replace("_", " ")}
                </span>
                {employee.employeeId && (
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {employee.employeeId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <CardTitle>Personal information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Phone" value={employee.phone} />
            <InfoRow
              label="Date of birth"
              value={
                employee.dateOfBirth
                  ? new Date(employee.dateOfBirth).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null
              }
            />
            <InfoRow label="Gender" value={employee.gender} />
            <div className="sm:col-span-2">
              <InfoRow label="Address" value={employee.address} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional info */}
      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="size-4 text-muted-foreground" />
            <CardTitle>Professional information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow label="Designation" value={employee.designation} />
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Position / Level" value={employee.position} />
            <InfoRow
              label="Employment type"
              value={employee.employmentType.replace("_", " ")}
            />
            <InfoRow
              label="Joining date"
              value={
                employee.joiningDate
                  ? new Date(employee.joiningDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null
              }
            />
            <InfoRow
              label="Salary"
              value={
                employee.salary
                  ? `${employee.currency ?? "INR"} ${employee.salary.toLocaleString("en-IN")}`
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
