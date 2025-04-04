import { Calendar, Flag, MapPin, MessageSquare, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getServiceById } from "@/lib/services"
import { notFound } from "next/navigation"

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  try {
    const service = await getServiceById(params.id)

    if (!service) {
      return notFound()
    }

    return (
      <DashboardLayout>
        <div className="p-4 md:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image
                  src={service.image_url || "/placeholder.svg?height=400&width=800"}
                  alt={service.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold">{service.name}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium">
                    {service.category?.name || "Non catégorisé"}
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span>4.8</span>
                    <span className="text-muted-foreground">(24 avis)</span>
                  </div>
                  {service.location && (
                    <span className="text-sm text-muted-foreground">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {service.location}
                    </span>
                  )}
                </div>
              </div>

              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="reviews">Avis (24)</TabsTrigger>
                  <TabsTrigger value="availability">Disponibilités</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="space-y-4">
                  <p>{service.description}</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium">Mode de prestation</h3>
                      <div className="flex flex-wrap gap-2">
                        {service.in_person_available && (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">En personne</span>
                        )}
                        {service.remote_available && (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">À distance</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Niveau d'expertise</h3>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                        {service.expertise_level || "Non spécifié"}
                      </span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews">
                  <div className="space-y-4">
                    {[1, 2, 3].map((review) => (
                      <div key={review} className="rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted"></div>
                          <div>
                            <div className="font-medium">Utilisateur {review}</div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
                              5.0
                            </div>
                          </div>
                          <div className="ml-auto text-xs text-muted-foreground">Il y a 2 semaines</div>
                        </div>
                        <p className="mt-2 text-sm">
                          Excellent service, très professionnel et pédagogue. Je recommande vivement !
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="availability">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <h3 className="font-medium">Jours disponibles</h3>
                      <div className="flex flex-wrap gap-2">
                        {service.available_days && service.available_days.length > 0 ? (
                          service.available_days.map((day) => (
                            <span key={day} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                              {day}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Aucune disponibilité spécifiée</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Calendrier</h3>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
                          <div key={day} className="text-xs font-medium py-1">
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => (
                          <div
                            key={i}
                            className={`text-xs p-2 rounded-md ${
                              [1, 3, 6, 8, 10, 15, 17, 22, 24, 29].includes(i + 1)
                                ? "bg-primary/20 cursor-pointer hover:bg-primary/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full">
                      <Image
                        src={service.provider.avatar_url || "/placeholder.svg?height=100&width=100"}
                        alt={service.provider.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.provider.full_name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span>4.8</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Membre depuis{" "}
                        {new Date(service.provider.member_since).toLocaleDateString("fr-FR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tarif horaire</span>
                      <span className="font-semibold">{service.credits_per_hour} crédits</span>
                    </div>

                    <Button className="w-full" size="lg" asChild>
                      <Link href={`/dashboard/services/${params.id}/book`}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Réserver
                      </Link>
                    </Button>

                    <Button variant="outline" className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contacter
                    </Button>

                    <Button variant="ghost" className="w-full text-muted-foreground">
                      <Flag className="mr-2 h-4 w-4" />
                      Signaler
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Services similaires</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-md flex-shrink-0">
                          <Image
                            src="/placeholder.svg?height=50&width=50"
                            alt="Service"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">Cours de piano débutant</h4>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span>4.7</span>
                            <span className="text-muted-foreground">(18 avis)</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium">12 crédits</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Erreur lors du chargement du service:", error)
    return notFound()
  }
}

