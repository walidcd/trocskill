"use server"

import { getSupabaseServer } from "./supabase/server"
import type { Database } from "./supabase/database.types"

type Booking = Database["public"]["Tables"]["bookings"]["Row"]
type BookingWithDetails = Booking & {
  service: {
    name: string
    image_url: string | null
    credits_per_hour: number
  }
  provider: {
    full_name: string
  }
}

export async function getBookingsByUserId(userId: string, status?: string) {
  const supabase = getSupabaseServer()

  let query = supabase
    .from("bookings")
    .select(`
      *,
      service:service_id(name, image_url, credits_per_hour, provider_id),
      provider:service_id(provider_id(full_name))
    `)
    .eq("consumer_id", userId)
    .order("booking_date", { ascending: true })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erreur lors de la récupération des réservations:", error)
    throw error
  }

  return data as BookingWithDetails[]
}

export async function getBookingsForProvider(providerId: string, status?: string) {
  const supabase = getSupabaseServer()

  let query = supabase
    .from("bookings")
    .select(`
      *,
      service:service_id(name, image_url, credits_per_hour),
      consumer:consumer_id(full_name, avatar_url)
    `)
    .eq("service.provider_id", providerId)
    .order("booking_date", { ascending: true })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erreur lors de la récupération des réservations du fournisseur:", error)
    throw error
  }

  return data
}

export async function createBooking(bookingData: Database["public"]["Tables"]["bookings"]["Insert"]) {
  const supabase = getSupabaseServer()

  // Commencer une transaction
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("credits_per_hour, provider_id")
    .eq("id", bookingData.service_id)
    .single()

  if (serviceError) {
    console.error("Erreur lors de la récupération du service:", serviceError)
    throw serviceError
  }

  // Calculer le coût total
  const totalCredits = service.credits_per_hour + 1 // +1 pour les frais de service

  // Vérifier si l'utilisateur a assez de crédits
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("credits")
    .eq("id", bookingData.consumer_id)
    .single()

  if (userError) {
    console.error("Erreur lors de la récupération de l'utilisateur:", userError)
    throw userError
  }

  if (user.credits < totalCredits) {
    throw new Error("Crédits insuffisants pour effectuer cette réservation")
  }

  // Créer la réservation
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      ...bookingData,
      total_credits: totalCredits,
      status: "confirmed",
    })
    .select()
    .single()

  if (bookingError) {
    console.error("Erreur lors de la création de la réservation:", bookingError)
    throw bookingError
  }

  // Mettre à jour les crédits de l'utilisateur
  const { error: updateUserError } = await supabase
    .from("users")
    .update({ credits: user.credits - totalCredits })
    .eq("id", bookingData.consumer_id)

  if (updateUserError) {
    console.error("Erreur lors de la mise à jour des crédits de l'utilisateur:", updateUserError)
    throw updateUserError
  }

  // Enregistrer la transaction de crédits
  const { error: transactionError } = await supabase.from("credit_transactions").insert({
    user_id: bookingData.consumer_id,
    amount: -totalCredits,
    type: "spending",
    description: `Réservation: ${booking.id}`,
    booking_id: booking.id,
  })

  if (transactionError) {
    console.error("Erreur lors de l'enregistrement de la transaction:", transactionError)
    throw transactionError
  }

  // Créer une notification pour le fournisseur
  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: service.provider_id,
    title: "Nouvelle réservation",
    message: `Vous avez une nouvelle réservation pour votre service.`,
    type: "booking",
    related_id: booking.id,
  })

  if (notificationError) {
    console.error("Erreur lors de la création de la notification:", notificationError)
    // Ne pas bloquer le processus si la notification échoue
  }

  return booking
}

export async function cancelBooking(bookingId: string, userId: string) {
  const supabase = getSupabaseServer()

  // Récupérer la réservation
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, service:service_id(provider_id)")
    .eq("id", bookingId)
    .single()

  if (bookingError) {
    console.error("Erreur lors de la récupération de la réservation:", bookingError)
    throw bookingError
  }

  // Vérifier si l'utilisateur est autorisé à annuler
  if (booking.consumer_id !== userId && booking.service.provider_id !== userId) {
    throw new Error("Vous n'êtes pas autorisé à annuler cette réservation")
  }

  // Vérifier si la réservation peut être annulée
  if (booking.status === "cancelled" || booking.status === "completed") {
    throw new Error("Cette réservation ne peut pas être annulée")
  }

  // Annuler la réservation
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)

  if (updateError) {
    console.error("Erreur lors de l'annulation de la réservation:", updateError)
    throw updateError
  }

  // Rembourser les crédits si l'annulation est faite par le fournisseur
  if (booking.service.provider_id === userId) {
    // Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", booking.consumer_id)
      .single()

    if (userError) {
      console.error("Erreur lors de la récupération de l'utilisateur:", userError)
      throw userError
    }

    // Mettre à jour les crédits de l'utilisateur
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ credits: user.credits + booking.total_credits })
      .eq("id", booking.consumer_id)

    if (updateUserError) {
      console.error("Erreur lors de la mise à jour des crédits de l'utilisateur:", updateUserError)
      throw updateUserError
    }

    // Enregistrer la transaction de crédits
    const { error: transactionError } = await supabase.from("credit_transactions").insert({
      user_id: booking.consumer_id,
      amount: booking.total_credits,
      type: "refund",
      description: `Remboursement: ${bookingId}`,
      booking_id: bookingId,
    })

    if (transactionError) {
      console.error("Erreur lors de l'enregistrement de la transaction:", transactionError)
      throw transactionError
    }
  }

  // Créer une notification
  const notificationUserId = booking.service.provider_id === userId ? booking.consumer_id : booking.service.provider_id

  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: notificationUserId,
    title: "Réservation annulée",
    message: `La réservation a été annulée.`,
    type: "booking",
    related_id: bookingId,
  })

  if (notificationError) {
    console.error("Erreur lors de la création de la notification:", notificationError)
    // Ne pas bloquer le processus si la notification échoue
  }

  return true
}

