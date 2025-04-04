import { Bell, Calendar, CreditCard, MessageSquare, Plus, Settings, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAverageRatingForUser } from "@/lib/reviews"

export default async function DashboardPage() {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Récupérer les données de l'utilisateur
  const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  // Récupérer le nombre de services publiés
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, status")
    .eq("provider_id", session.user.id)

  const activeServices = services?.filter((s) => s.status === "active").length || 0
  const pendingServices = services?.filter((s) => s.status === "pending").length || 0
  const totalServices = services?.length || 0

  // Récupérer la note moyenne
  const { averageRating, totalReviews } = await getAverageRatingForUser(session.user.id)

  // Récupérer les notifications récentes
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground">Bienvenue sur votre espace TrocSkill</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/notifications">
                <Bell className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Notifications</span>
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
                  {notifications?.length || 0}
                </span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Messages</span>
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">0</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crédits disponibles</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData?.credits || 0}</div>
              <p className="text-xs text-muted-foreground">Gérez vos crédits dans la section Crédits</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services publiés</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalServices}</div>
              <p className="text-xs text-muted-foreground">{pendingServices} en attente de validation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating}/5</div>
              <p className="text-xs text-muted-foreground">Basée sur {totalReviews} avis</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/dashboard/create-service">
                  <Plus className="mr-2 h-4 w-4" />
                  Proposer un service
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/dashboard/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  Voir mes réservations
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/dashboard/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres du compte
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Notifications récentes</CardTitle>
              <CardDescription>
                {notifications && notifications.length > 0
                  ? `Vous avez ${notifications.length} nouvelles notifications`
                  : "Vous n'avez pas de nouvelles notifications"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-4 rounded-md border p-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">Aucune notification récente</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

