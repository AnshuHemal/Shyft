import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCtx() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;
  const user = session.user as any;

  if (user.role === "USER") {
    const org = await prisma.organization.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (!org) return null;
    return { user, orgId: org.id, role: "ADMIN" as const, employeeId: null };
  }

  if (user.role === "EMPLOYEE") {
    const emp = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true, organizationId: true },
    });
    if (!emp) return null;
    return { user, orgId: emp.organizationId, role: "EMPLOYEE" as const, employeeId: emp.id };
  }
  return null;
}

export async function GET(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (ctx.role === "ADMIN") {
    const assets = await prisma.asset.findMany({
      where: { organizationId: ctx.orgId },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true, employeeId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ assets });
  }

  // Employee only gets their assigned assets (used for Return/Replace dropdowns)
  const assets = await prisma.asset.findMany({
    where: { 
      organizationId: ctx.orgId,
      assignedToId: ctx.employeeId
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx || ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, prodId, type, assignedToId } = body;

    if (!name || !prodId) {
      return NextResponse.json({ error: "Name and Prod ID are required." }, { status: 400 });
    }

    // Check if prodId is unique in this org
    const existing = await prisma.asset.findUnique({
      where: {
        organizationId_prodId: {
          organizationId: ctx.orgId,
          prodId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "An asset with this Prod ID already exists." }, { status: 409 });
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        prodId,
        type: type || "Other",
        organizationId: ctx.orgId,
        assignedToId: assignedToId || null,
        status: assignedToId ? "ASSIGNED" : "AVAILABLE",
        assignedAt: assignedToId ? new Date() : null,
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } }
      }
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("Add asset error:", error);
    return NextResponse.json({ error: "Failed to create asset." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getCtx();
  if (!ctx || ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, assignedToId } = body;

    const existing = await prisma.asset.findFirst({
      where: { id, organizationId: ctx.orgId }
    });

    if (!existing) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const updateData: any = {};
    if (status) updateData.status = status;
    
    // Explicit null check to allow un-assigning
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
      if (assignedToId) {
        updateData.assignedAt = new Date();
        updateData.status = "ASSIGNED";
      } else {
        updateData.assignedAt = null;
        updateData.status = "AVAILABLE"; // Or MAINTENACE, depends on logic, but default to AVAILABLE
      }
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { firstName: true, lastName: true, avatar: true } }
      }
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Update asset error:", error);
    return NextResponse.json({ error: "Failed to update asset." }, { status: 500 });
  }
}
