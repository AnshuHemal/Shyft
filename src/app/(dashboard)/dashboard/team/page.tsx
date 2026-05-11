import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusIcon, MailIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Team" };

const MEMBERS = [
  { name: "Alex Johnson", email: "alex@shyft.app", role: "Admin", hours: "38.5h", status: "active" },
  { name: "Sam Rivera", email: "sam@shyft.app", role: "Member", hours: "32.0h", status: "active" },
  { name: "Jordan Lee", email: "jordan@shyft.app", role: "Member", hours: "41.2h", status: "idle" },
  { name: "Casey Morgan", email: "casey@shyft.app", role: "Member", hours: "28.5h", status: "offline" },
  { name: "Taylor Kim", email: "taylor@shyft.app", role: "Member", hours: "35.0h", status: "active" },
  { name: "Morgan Chen", email: "morgan@shyft.app", role: "Viewer", hours: "0h", status: "offline" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage your workspace members."
        actions={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-4" />
            Invite member
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MEMBERS.map((member) => (
          <Card key={member.email} size="sm" className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background",
                      member.status === "active" && "bg-green-500",
                      member.status === "idle" && "bg-yellow-500",
                      member.status === "offline" && "bg-muted-foreground/40"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{member.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                    <MailIcon className="size-3 shrink-0" />
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="secondary" className="text-sm capitalize">
                  {member.role}
                </Badge>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {member.hours} this week
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
