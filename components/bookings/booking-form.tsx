"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

interface BookingFormProps {
  serviceId: string
  userId: string
  serviceData: any
}

export function BookingForm({ serviceId, userId, serviceData }: BookingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    mode: serviceData.in_person_available ? "in_person" : "remote",
    message: "",
  })

  const supabase = getSupabaseClient()

  // Vérifier si l'utilisateur est le propriétaire du service
  const isOwner = serviceData.provider_id === userId

  // Générer des dates disponibles (dans une application réelle, ces données viendraient d'une API)
  const today = new Date()
  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i + 1)
    return date.toISOString().split("T")[0]
  })

  // Générer des créneaux horaires (dans une application réelle, ces données viendraient d'une API)
  const availableSlots = ["09:00-10:00", "10:30-11:30", "13:00-14:00", "14:30-15:30", "16:00-17:00", "17:30-18:30"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier si l'utilisateur est le propriétaire du service
    if (isOwner) {
      toast({
        title: "Réservation impossible",
        description: "Vous ne pouvez pas réserver votre propre service",
        variant: "destructive",
      })
      return
    }

    if (!formData.date || !formData.time) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner une date et un horaire",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Extraire l'heure de début et de fin
      const [startTime, endTime] = formData.time.split("-")

      // Vérifier si l'utilisateur a assez de crédits
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single()

      if (userError) {
        throw userError
      }

      const totalCredits = serviceData.credits_per_hour + 1 // +1 pour les frais de service

      if (userData.credits < totalCredits) {
        throw new Error("Crédits insuffisants pour effectuer cette réservation")
      }

      // Créer la réservation
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          service_id: serviceId,
          consumer_id: userId,
          booking_date: formData.date,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          total_credits: totalCredits,
          status: "confirmed",
          mode: formData.mode,
          message: formData.message || null,
        })
        .select()
        .single()

      if (bookingError) {
        throw bookingError
      }

      // Mettre à jour les crédits de l'utilisateur
      const { error: updateError } = await supabase
        .from("users")
        .update({ credits: userData.credits - totalCredits })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      // Enregistrer la transaction
      const { error: transactionError } = await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: -totalCredits,
        type: "spending",
        description: `Réservation: ${serviceData.name}`,
        booking_id: booking.id,
      })

      if (transactionError) {
        throw transactionError
      }

      toast({
        title: "Réservation confirmée",
        description: "Votre réservation a été confirmée avec succès",
      })

      router.push("/dashboard/bookings")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur lors de la réservation",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher un message si l'utilisateur est le propriétaire du service
  if (isOwner) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Réservation impossible</h3>
        <p className="text-yellow-700 mb-4">Vous ne pouvez pas réserver votre propre service.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Sélectionnez une date</Label>
          <RadioGroup
            value={formData.date}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, date: value }))}
          >
            <div className="grid gap-2">
              {availableDates.map((date) => {
                const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })

                return (
                  <div key={date} className="flex items-center space-x-2 rounded-md border p-3">
                    <RadioGroupItem value={date} id={date} />
                    <Label htmlFor={date} className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formattedDate}
                      </div>
                    </Label>
                  </div>
                )
              })}
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Sélectionnez un horaire</Label>
          <RadioGroup
            value={formData.time}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, time: value }))}
          >
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map((slot) => (
                <div key={slot} className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value={slot} id={slot} />
                  <Label htmlFor={slot} className="cursor-pointer">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      {slot.replace("-", " - ")}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {serviceData.in_person_available && serviceData.remote_available && (
          <div className="space-y-2">
            <Label>Mode de prestation</Label>
            <RadioGroup
              value={formData.mode}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, mode: value }))}
            >
              <div className="grid gap-2">
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="in_person" id="in_person" />
                  <Label htmlFor="in_person" className="cursor-pointer">
                    En personne
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote" className="cursor-pointer">
                    À distance
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Message au prestataire (optionnel)</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Précisez vos besoins ou posez des questions..."
            rows={3}
            value={formData.message}
            onChange={handleChange}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Réservation en cours..." : "Confirmer la réservation"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        En confirmant, vous acceptez les conditions générales de TrocSkill et la politique d'annulation.
      </p>
    </form>
  )
}

