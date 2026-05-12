import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireLead() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;

  const user = session.user as typeof session.user & { role: string };
  if (user.role !== "EMPLOYEE") return null;

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true, organizationId: true },
  });

  if (!employee) return null;
  return { session, employee };
}

export async function GET(request: Request) {
  const ctx = await requireLead();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  // Fetch all employees reporting to this lead
  // and include their timesheets for the selected month
  const teamTimesheets = await prisma.employee.findMany({
    where: {
      reportingToId: ctx.employee.id,
      organizationId: ctx.employee.organizationId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      timesheets: {
        where: {
          month,
          year,
          status: "SUBMITTED",
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          entries: {
            select: {
              startTime: true,
              endTime: true,
              breakMinutes: true,
              tasks: {
                select: {
                  subject: true,
                }
              }
            }
          }
        }
      }
    },
    orderBy: { firstName: "asc" }
  });

  // Filter to only those with submitted timesheets
  const pendingApprovals = teamTimesheets.filter(t => t.timesheets.length > 0);

  return NextResponse.json({ 
    approvals: pendingApprovals,
    month,
    year
  });
}
