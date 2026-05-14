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
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx || ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, hrNote, assignAssetId } = body; // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "reject" && !hrNote?.trim()) {
    return NextResponse.json({ error: "A reason is required when rejecting" }, { status: 400 });
  }

  const assetReq = await prisma.assetRequest.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: {
      employee: { select: { userId: true, id: true } },
      asset: true
    },
  });

  if (!assetReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (assetReq.status !== "PENDING") {
    return NextResponse.json({ error: "Request is already processed" }, { status: 409 });
  }

  let newStatus: any = action === "approve" ? "APPROVED" : "REJECTED";

  // If approved, handle inventory assignment updates
  if (newStatus === "APPROVED") {
    if (assetReq.action === "ACQUIRE" || assetReq.action === "REPLACE") {
      // HR must select an asset from inventory to assign it
      if (!assignAssetId) {
         return NextResponse.json({ error: "You must select an asset to assign." }, { status: 400 });
      }
      
      // Assign the new asset
      await prisma.asset.update({
        where: { id: assignAssetId },
        data: {
          status: "ASSIGNED",
          assignedToId: assetReq.employee.id,
          assignedAt: new Date()
        }
      });

      // If it was a replace, un-assign the old asset
      if (assetReq.action === "REPLACE" && assetReq.assetId) {
        await prisma.asset.update({
          where: { id: assetReq.assetId },
          data: {
            status: "AVAILABLE", // Or MAINTENANCE
            assignedToId: null,
            assignedAt: null
          }
        });
      }
    } else if (assetReq.action === "RETURN" && assetReq.assetId) {
      // Un-assign the returned asset
      await prisma.asset.update({
        where: { id: assetReq.assetId },
        data: {
          status: "AVAILABLE",
          assignedToId: null,
          assignedAt: null
        }
      });
    }
  }

  const updatedReq = await prisma.assetRequest.update({
    where: { id },
    data: {
      status: newStatus,
      hrNote: hrNote?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: ctx.user.id,
    },
  });

  // Notify Employee
  if (assetReq.employee.userId) {
    let type: any = newStatus === "APPROVED" ? "ASSET_REQUEST_APPROVED" : "ASSET_REQUEST_REJECTED";
    let title = newStatus === "APPROVED" ? "Asset Request Approved" : "Asset Request Rejected";
    let message = newStatus === "APPROVED" 
        ? `Your request to ${assetReq.action.toLowerCase()} an asset has been approved.` 
        : `Your request was rejected: ${hrNote}`;

    await prisma.notification.create({
      data: {
        type,
        title,
        message,
        recipientId: assetReq.employee.userId,
        assetRequestId: assetReq.id,
      },
    });
  }

  return NextResponse.json({ request: updatedReq });
}
