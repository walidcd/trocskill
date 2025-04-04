import { Check, Flag, MoreHorizontal, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserApprovalList } from "@/components/admin/user-approval-list"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ModerationPage() {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Vérifier si l'utilisateur est un administrateur
  const { data: userData, error } = await supabase.from("users").select("user_type").eq("id", session.user.id).single()

  if (error || userData?.user_type !== "admin") {
    // Rediriger vers le tableau de bord si l'utilisateur n'est pas un administrateur
    redirect("/dashboard")
  }

  const pendingServices = [
    {
      id: 1,
      name: "Cours de guitare pour débutants",
      provider: "Marie Dubois",
      category: "Musique",
      submitted: "12 juin 2024",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      name: "Aide au jardinage",
      provider: "Pierre Martin",
      category: "Jardinage",
      submitted: "11 juin 2024",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      name: "Cours de cuisine française",
      provider: "Sophie Lefèvre",
      category: "Cuisine",
      submitted: "10 juin 2024",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  const reports = [
    {
      id: 1,
      service: "Réparation d'ordinateurs",
      provider: "Thomas Bernard",
      reporter: "Jean Dupont",
      reason: "Service non conforme à la description",
      date: "8 juin 2024",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      service: "Cours de yoga",
      provider: "Julie Moreau",
      reporter: "Marie Lambert",
      reason: "Comportement inapproprié",
      date: "5 juin 2024",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modération</h1>
          <p className="text-muted-foreground">Gérez les services, les utilisateurs et les signalements</p>
        </div>

        <Tabs defaultValue="pending" className="mt-6">
          <TabsList>
            <TabsTrigger value="pending">Services en attente ({pendingServices.length})</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs en attente</TabsTrigger>
            <TabsTrigger value="reports">Signalements ({reports.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Services en attente de validation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingServices.map((service) => (
                    <div key={service.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={service.image || "/placeholder.svg"}
                            alt={service.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">Proposé par {service.provider}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="rounded-full bg-muted px-2 py-1 text-xs">{service.category}</span>
                            <span className="text-muted-foreground">Soumis le {service.submitted}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            Voir les détails
                          </Button>
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                            <Check className="mr-2 h-4 w-4" />
                            Approuver
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <X className="mr-2 h-4 w-4" />
                                Refuser
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[300px]">
                              <div className="p-4 space-y-4">
                                <h4 className="font-medium">Motif du refus</h4>
                                <Textarea placeholder="Veuillez indiquer la raison du refus..." rows={3} />
                                <div className="flex justify-end">
                                  <Button size="sm" variant="destructive">
                                    Confirmer le refus
                                  </Button>
                                </div>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs en attente d'approbation</CardTitle>
              </CardHeader>
              <CardContent>
                <UserApprovalList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Signalements à traiter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={report.image || "/placeholder.svg"}
                            alt={report.service}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{report.service}</h3>
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              <Flag className="inline-block h-3 w-3 mr-1" />
                              Signalé
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Fourni par {report.provider}</p>
                          <p className="text-sm text-muted-foreground">
                            Signalé par {report.reporter} le {report.date}
                          </p>
                          <p className="text-sm font-medium mt-1">Motif : {report.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            Voir les détails
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Contacter le fournisseur</DropdownMenuItem>
                              <DropdownMenuItem>Contacter le signaleur</DropdownMenuItem>
                              <DropdownMenuItem>Suspendre le service</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Supprimer le service</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

