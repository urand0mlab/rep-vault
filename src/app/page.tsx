import { prisma } from "@/lib/prisma";
import { ExerciseList } from "@/components/ExerciseList";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/auth";

export default async function Dashboard({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const params = await searchParams;

  // Parse date from URL or default to today
  let targetDate = new Date();
  if (params.date) {
    const parsed = new Date(`${params.date}T00:00:00.000Z`);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  const dateString = `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}T00:00:00.000Z`;

  // Calculate Previous and Next days for navigation
  const prevDate = new Date(targetDate);
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);
  const prevDateStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}-${String(prevDate.getUTCDate()).padStart(2, '0')}`;

  const nextDate = new Date(targetDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextDateStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDate.getUTCDate()).padStart(2, '0')}`;

  const session = await auth();
  if (!session?.user?.id) {
    return null; // The middleware will handle the redirect, but this is a fallback.
  }

  const todayWorkout = await prisma.workoutDay.findUnique({
    where: {
      date_userId: {
        date: new Date(dateString),
        userId: session.user.id
      }
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          setLogs: {
            orderBy: { setNumber: "asc" }
          }
        }
      }
    }
  });

  const formattedDate = targetDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href={`/?date=${prevDateStr}`} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="text-center">
          <p className="text-xs font-medium tracking-tight text-primary/80 uppercase mb-1">
            Hi {session.user.email?.split('@')[0]}!
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">{todayWorkout?.name || "Rest Day"}</h1>
          <p className="text-muted-foreground date-header mt-0.5 text-sm">
            {formattedDate}
          </p>
        </div>
        <Link href={`/?date=${nextDateStr}`} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-6 w-6" />
        </Link>
      </header>

      {!todayWorkout ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed bg-muted/20 mt-10">
          <p className="text-muted-foreground">No planned exercises for this date. Enjoy your rest!</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          <ExerciseList exercises={todayWorkout.exercises} />
        </div>
      )}
    </div>
  );
}
