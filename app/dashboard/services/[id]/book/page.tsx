import { ChevronLeft, CreditCard } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getServiceById } from "@/lib/services"
import { notFound } from "next/navigation"
import { BookingForm } from "@/components/bookings/booking-form"
import { getSupabaseServer } from "@/lib/supabase/server"

export default async function BookServicePage({ params }: { params: { id: string } }) {
  try {
    const service = await getServiceById(params.id)

    if (!service) {
      return notFound()
    }

    // Récupérer l'utilisateur connecté
    const supabase = getSupabaseServer()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return notFound()
    }

    // Récupérer les crédits de l'utilisateur
    const { data: userData } = await supabase.from("users").select("credits").eq("id", session.user.id).single()

    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/dashboard/services/${params.id}`}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Retour aux détails du service
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Réserver un service</CardTitle>
                  <CardDescription>Sélectionnez une date et un horaire pour votre réservation</CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingForm serviceId={params.id} userId={session.user.id} serviceData={service} />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={service.image_url || "/placeholder.svg?height=200&width=300"}
                        alt={service.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">Par {service.provider.full_name}</p>
                      <div className="mt-1 flex items-center">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {service.category?.name || "Non catégorisé"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Tarif horaire</span>
                      <span className="font-medium">{service.credits_per_hour} crédits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Frais de service</span>
                      <span className="font-medium">1 crédit</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{service.credits_per_hour + 1} crédits</span>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Solde actuel</span>
                      </div>
                      <span className="font-medium">{userData?.credits || 0} crédits</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Après cette réservation, il vous restera{" "}
                      {(userData?.credits || 0) - (service.credits_per_hour + 1)} crédits
                    </div>
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

