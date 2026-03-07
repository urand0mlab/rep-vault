import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingCompleted: true },
    });

    // Source of truth check against the database to avoid stale JWT state.
    if (user?.onboardingCompleted) {
        redirect("/");
    }

    return <OnboardingForm />;
}
