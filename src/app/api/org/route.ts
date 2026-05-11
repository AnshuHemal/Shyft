import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireApprovedUser() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;
  const user = session.user as typeof session.user & {
    accountStatus: string;
    role: string;
  };
  if (user.accountStatus !== "APPROVED" || user.role === "SUPERADMIN")
    return null;
  return session;
}

// ── POST /api/org — create org during onboarding ──────────────────────────────
export async function POST(request: Request) {
  const session = await requireApprovedUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const {
    name,
    slug,
    website,
    industry,
    size,
    description,
    address,
    city,
    country,
    phone,
  } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json(
      { error: "Organisation name and slug are required." },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const slugExists = await prisma.organization.findUnique({
    where: { slug: slug.trim().toLowerCase() },
  });
  if (slugExists && slugExists.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "This slug is already taken. Please choose another." },
      { status: 409 }
    );
  }

  try {
    // Upsert — handles both create and update (e.g. page refresh)
    const org = await prisma.organization.upsert({
      where: { ownerId: session.user.id },
      create: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        size: size || null,
        description: description?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        country: country?.trim() || null,
        phone: phone?.trim() || null,
        ownerId: session.user.id,
      },
      update: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        size: size || null,
        description: description?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        country: country?.trim() || null,
        phone: phone?.trim() || null,
      },
    });

    // Mark onboarding as complete
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({ success: true, org });
  } catch (error) {
    console.error("[Org] Create/update failed:", error);
    return NextResponse.json(
      { error: "Failed to save organisation. Please try again." },
      { status: 500 }
    );
  }
}

// ── GET /api/org — fetch current user's org ───────────────────────────────────
export async function GET() {
  const session = await requireApprovedUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { ownerId: session.user.id },
  });

  return NextResponse.json({ org });
}

// ── PATCH /api/org — update org settings ─────────────────────────────────────
export async function PATCH(request: Request) {
  const session = await requireApprovedUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { ownerId: session.user.id },
  });
  if (!org) {
    return NextResponse.json(
      { error: "Organisation not found." },
      { status: 404 }
    );
  }

  const body = await request.json();
  const {
    name,
    website,
    industry,
    size,
    description,
    address,
    city,
    country,
    phone,
  } = body;

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      website: website?.trim() || null,
      industry: industry?.trim() || null,
      size: size || null,
      description: description?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      country: country?.trim() || null,
      phone: phone?.trim() || null,
    },
  });

  return NextResponse.json({ success: true, org: updated });
}
