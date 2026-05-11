import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrganisationSettings } from "@/components/dashboard/organisation-settings";

export const metadata: Metadata = { title: "Organisation Settings" };

export default async function OrganisationPage() {
  const session = await getSession();
  const user = session!.user;

  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
  });

  return <OrganisationSettings org={org} />;
}
