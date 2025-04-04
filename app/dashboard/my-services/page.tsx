import { Edit, Eye, MoreHorizontal, Trash } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getServicesByProviderId } from "@/lib/services"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function MyServicesPage() {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const services = await getServicesByProviderId(session.user.id)

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mes services</h1>
            <p className="text-muted-foreground">Gérez les services que vous proposez</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/create-service">Proposer un nouveau service</Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.length > 0 ? (
            services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="p-0">
                  <div className="aspect-video relative">
                    <Image
                      src={service.image_url || "/placeholder.svg?height=200&width=300"}
                      alt={service.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    <div
                      className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-medium ${
                        service.status === "active"
                          ? "bg-green-100 text-green-800"
                          : service.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : service.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.status === "active"
                        ? "Actif"
                        : service.status === "pending"
                          ? "En attente"
                          : service.status === "rejected"
                            ? "Refusé"
                            : service.status === "inactive"
                              ? "Inactif"
                              : service.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {service.category?.name || "Non catégorisé"}
                    </span>
                    <span className="font-medium">{service.credits_per_hour} crédits/h</span>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {/* Placeholder pour les réservations */}0 réservation{0 !== 1 ? "s" : ""}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between p-4 pt-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/services/${service.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      {service.status === "active" ? (
                        <DropdownMenuItem>Désactiver</DropdownMenuItem>
                      ) : service.status === "inactive" ? (
                        <DropdownMenuItem>Activer</DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore proposé de services</p>
              <Button asChild>
                <Link href="/dashboard/create-service">Proposer un service</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

