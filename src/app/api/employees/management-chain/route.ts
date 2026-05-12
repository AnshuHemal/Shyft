import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const user = session.user as typeof session.user & { role: string };
  
  // Find current employee and their reporting line
  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      reportingToId: true,
    }
  });

  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const chain: { id: string; firstName: string; lastName: string; designation: string }[] = [];
  let currentId = employee.reportingToId;

  // Recursively fetch the management chain up to 5 levels
  let depth = 0;
  while (currentId && depth < 5) {
    const manager = await prisma.employee.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
        reportingToId: true,
      }
    });

    if (manager) {
      chain.push({
        id: manager.id,
        firstName: manager.firstName,
        lastName: manager.lastName,
        designation: manager.designation,
      });
      currentId = manager.reportingToId;
    } else {
      currentId = null;
    }
    depth++;
  }

  return NextResponse.json({ chain });
}
