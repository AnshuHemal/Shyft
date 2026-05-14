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
    const onboardings = await prisma.employeeOnboarding.findMany({
      where: { organizationId: ctx.orgId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, avatar: true, employeeId: true, email: true, designation: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ onboardings });
  }

  // Employee only gets their own
  const onboarding = await prisma.employeeOnboarding.findUnique({
    where: { employeeId: ctx.employeeId! },
  });
  
  // Also pass the employee data needed to pre-fill
  const empData = await prisma.employee.findUnique({
    where: { id: ctx.employeeId! },
    select: { firstName: true, lastName: true, email: true, designation: true, joiningDate: true }
  });

  return NextResponse.json({ onboarding, employee: empData });
}

export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx || ctx.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can submit onboarding forms" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const existing = await prisma.employeeOnboarding.findUnique({
      where: { employeeId: ctx.employeeId! }
    });

    if (existing && existing.status !== "REJECTED") {
       return NextResponse.json({ error: "Onboarding form already submitted." }, { status: 409 });
    }

    const {
      contactNumber, emergencyContactNumber, currentAddress, permanentAddress, dateOfBirth, 
      isExperienced,
      passbookUrl, panCardUrl, aadhaarCardUrl, marksheet10thUrl, marksheet12thUrl, marksheetGraduationUrl,
      salarySlipUrl, experienceLetterUrl, relievingLetterUrl,
      passportPhotoUrl, casualPhotoUrl
    } = body;

    // We can pull DOJ and Designation directly from the employee record
    const emp = await prisma.employee.findUnique({
      where: { id: ctx.employeeId! },
      select: { designation: true, joiningDate: true, firstName: true, lastName: true }
    });

    if (!emp) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

    const dataObj = {
      employeeId: ctx.employeeId!,
      organizationId: ctx.orgId,
      status: "UNDER_REVIEW" as const,
      contactNumber, emergencyContactNumber, currentAddress, permanentAddress,
      dateOfBirth: new Date(dateOfBirth),
      isExperienced: Boolean(isExperienced),
      designation: emp.designation,
      dateOfJoining: emp.joiningDate,
      passbookUrl, panCardUrl, aadhaarCardUrl, marksheet10thUrl, marksheet12thUrl, marksheetGraduationUrl,
      salarySlipUrl: isExperienced ? salarySlipUrl : null,
      experienceLetterUrl: isExperienced ? experienceLetterUrl : null,
      relievingLetterUrl: isExperienced ? relievingLetterUrl : null,
      passportPhotoUrl, casualPhotoUrl
    };

    let onboarding;
    if (existing) {
      onboarding = await prisma.employeeOnboarding.update({
        where: { id: existing.id },
        data: dataObj
      });
    } else {
      onboarding = await prisma.employeeOnboarding.create({
        data: dataObj
      });
    }

    // Notify HR
    const orgOwner = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { ownerId: true },
    });
    if (orgOwner) {
      await prisma.notification.create({
        data: {
          type: "ONBOARDING_SUBMITTED",
          title: "New Onboarding Submitted",
          message: `${emp.firstName} ${emp.lastName} has submitted their onboarding documents for review.`,
          recipientId: orgOwner.ownerId,
          onboardingId: onboarding.id,
        },
      });
    }

    return NextResponse.json({ onboarding }, { status: 201 });
  } catch (error) {
    console.error("Submit onboarding error:", error);
    return NextResponse.json({ error: "Failed to submit onboarding form." }, { status: 500 });
  }
}
