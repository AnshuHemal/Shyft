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
    const requests = await prisma.assetRequest.findMany({
      where: { organizationId: ctx.orgId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, avatar: true, employeeId: true } },
        asset: true // If they are replacing/returning an asset
      },
      orderBy: { submittedAt: "desc" }
    });
    return NextResponse.json({ requests });
  }

  // Employee sees only their own
  const requests = await prisma.assetRequest.findMany({
    where: { 
      organizationId: ctx.orgId,
      employeeId: ctx.employeeId!
    },
    include: {
      asset: true
    },
    orderBy: { submittedAt: "desc" }
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx || ctx.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can submit asset requests" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, requestedAsset, assetId, reason, duration } = body;

    if (!["ACQUIRE", "REPLACE", "RETURN"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    
    if (action === "ACQUIRE" && !requestedAsset?.trim()) {
      return NextResponse.json({ error: "Please specify the asset you need." }, { status: 400 });
    }

    if ((action === "REPLACE" || action === "RETURN") && !assetId) {
      return NextResponse.json({ error: "Please select the asset you are replacing/returning." }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: "Please provide a more detailed reason." }, { status: 400 });
    }

    if (action !== "RETURN" && !duration?.trim()) {
      return NextResponse.json({ error: "Duration is required." }, { status: 400 });
    }

    const assetReq = await prisma.assetRequest.create({
      data: {
        action,
        requestedAsset: action === "ACQUIRE" ? requestedAsset.trim() : null,
        assetId: (action === "REPLACE" || action === "RETURN") ? assetId : null,
        reason: reason.trim(),
        duration: action === "RETURN" ? null : duration.trim(),
        employeeId: ctx.employeeId!,
        organizationId: ctx.orgId,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } }
      }
    });

    const empName = `${assetReq.employee.firstName} ${assetReq.employee.lastName}`;

    // Notification: HR
    const orgOwner = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { ownerId: true },
    });
    if (orgOwner) {
      await prisma.notification.create({
        data: {
          type: "ASSET_REQUEST_SUBMITTED",
          title: "New Asset Request",
          message: `${empName} requested to ${action.toLowerCase()} an asset.`,
          recipientId: orgOwner.ownerId,
          assetRequestId: assetReq.id,
        },
      });
    }

    // Notification: Employee
    if (ctx.user.id) {
       await prisma.notification.create({
        data: {
          type: "ASSET_REQUEST_SUBMITTED",
          title: "Asset Request Submitted",
          message: `Your request to ${action.toLowerCase()} an asset has been sent for review.`,
          recipientId: ctx.user.id,
          assetRequestId: assetReq.id,
        },
      });
    }

    return NextResponse.json({ request: assetReq }, { status: 201 });
  } catch (error) {
    console.error("Submit asset request error:", error);
    return NextResponse.json({ error: "Failed to submit request." }, { status: 500 });
  }
}
