"use client"

import { useEffect, useState } from "react"
import { Calendar, Check, Clock, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface BookingsListProps {
  userId: string
  initialStatus?: string
}

export function BookingsList({ userId, initialStatus }: BookingsListProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialStatus || "upcoming")
  const [bookings, setBookings] = useState({
    upcoming: [],
    past: [],
    cancelled: [],
  })

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchBookings()
  }, [userId, activeTab])

  const fetchBookings = async () => {
    setIsLoading(true)

    try {
      // Récupérer les réservations à venir
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("bookings")
        .select(`
          *,
          service:service_id(
            name, 
            image_url,
            provider_id,
            provider:provider_id(full_name)
          )
        `)
        .eq("consumer_id", userId)
        .eq("status", "confirmed")
        .gte("booking_date", new Date().toISOString().split("T")[0])
        .order("booking_date", { ascending: true })

      if (upcomingError) throw upcomingError

      // Récupérer les réservations passées
      const { data: pastData, error: pastError } = await supabase
        .from("bookings")
        .select(`
          *,
          service:service_id(
            name, 
            image_url,
            provider_id,
            provider:provider_id(full_name)
          ),
          reviews(id)
        `)
        .eq("consumer_id", userId)
        .eq("status", "completed")
        .order("booking_date", { ascending: false })

      if (pastError) throw pastError

      // Récupérer les réservations annulées
      const { data: cancelledData, error: cancelledError } = await supabase
        .from("bookings")
        .select(`
          *,
          service:service_id(
            name, 
            image_url,
            provider_id,
            provider:provider_id(full_name)
          )
        `)
        .eq("consumer_id", userId)
        .eq("status", "cancelled")
        .order("booking_date", { ascending: false })

      if (cancelledError) throw cancelledError

      setBookings({
        upcoming: upcomingData || [],
        past: pastData || [],
        cancelled: cancelledData || [],
      })
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos réservations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      if (error) throw error

      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée avec succès",
      })

      fetchBookings()
      router.refresh()
    } catch (error) {
      console.error("Erreur lors de l'annulation de la réservation:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  return (
    <Tabs defaultValue={activeTab} className="mt-6" onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="upcoming">À venir ({bookings.upcoming.length})</TabsTrigger>
        <TabsTrigger value="past">Passées ({bookings.past.length})</TabsTrigger>
        <TabsTrigger value="cancelled">Annulées ({bookings.cancelled.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : bookings.upcoming.length > 0 ? (
            bookings.upcoming.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={booking.service?.image_url || "/placeholder.svg?height=100&width=100"}
                        alt={booking.service?.name || "Service"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{booking.service?.name || "Service"}</h3>
                      <p className="text-sm text-muted-foreground">
                        Avec {booking.service?.provider?.full_name || "Prestataire"}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-medium">{booking.total_credits} crédits</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Contacter
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancelBooking(booking.id)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Vous n'avez pas de réservations à venir</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/services">Réserver un service</Link>
              </Button>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="past" className="mt-4">
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : bookings.past.length > 0 ? (
            bookings.past.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={booking.service?.image_url || "/placeholder.svg?height=100&width=100"}
                        alt={booking.service?.name || "Service"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{booking.service?.name || "Service"}</h3>
                      <p className="text-sm text-muted-foreground">
                        Avec {booking.service?.provider?.full_name || "Prestataire"}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-medium">{booking.total_credits} crédits</div>
                      {booking.reviews && booking.reviews.length > 0 ? (
                        <div className="flex items-center text-sm text-green-600">
                          <Check className="mr-1 h-4 w-4" />
                          Avis laissé
                        </div>
                      ) : (
                        <Button size="sm">Laisser un avis</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Vous n'avez pas de réservations passées</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="cancelled" className="mt-4">
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : bookings.cancelled.length > 0 ? (
            bookings.cancelled.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={booking.service?.image_url || "/placeholder.svg?height=100&width=100"}
                        alt={booking.service?.name || "Service"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{booking.service?.name || "Service"}</h3>
                      <p className="text-sm text-muted-foreground">
                        Avec {booking.service?.provider?.full_name || "Prestataire"}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-medium">{booking.total_credits} crédits</div>
                      <div className="flex items-center text-sm text-destructive">
                        <X className="mr-1 h-4 w-4" />
                        Annulé par {booking.cancelled_by === userId ? "vous" : "le prestataire"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Vous n'avez pas de réservations annulées</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

