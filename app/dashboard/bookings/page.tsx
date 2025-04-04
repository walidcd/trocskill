import { getSupabaseServer } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BookingsList } from "@/components/bookings/bookings-list"
import { redirect } from "next/navigation"

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes réservations</h1>
            <p className="text-muted-foreground">Gérez vos réservations de services</p>
          </div>
        </div>

        <BookingsList userId={session.user.id} initialStatus={searchParams.status} />
      </div>
    </DashboardLayout>
  )
}

