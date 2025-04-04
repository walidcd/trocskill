"use server"

import { getSupabaseServer } from "./supabase/server"

export async function getAverageRatingForUser(userId: string) {
  const supabase = getSupabaseServer()

  // Récupérer toutes les notes pour les services de l'utilisateur
  const { data, error } = await supabase.from("reviews").select("rating").eq("provider_id", userId)

  if (error) {
    console.error("Erreur lors de la récupération des notes:", error)
    return { averageRating: 0, totalReviews: 0 }
  }

  if (!data || data.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }

  // Calculer la moyenne
  const sum = data.reduce((acc, review) => acc + review.rating, 0)
  const average = sum / data.length

  return {
    averageRating: Number.parseFloat(average.toFixed(1)),
    totalReviews: data.length,
  }
}

export async function getAverageRatingForService(serviceId: string) {
  const supabase = getSupabaseServer()

  // Récupérer toutes les notes pour le service
  const { data, error } = await supabase.from("reviews").select("rating").eq("service_id", serviceId)

  if (error) {
    console.error("Erreur lors de la récupération des notes:", error)
    return { averageRating: 0, totalReviews: 0 }
  }

  if (!data || data.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }

  // Calculer la moyenne
  const sum = data.reduce((acc, review) => acc + review.rating, 0)
  const average = sum / data.length

  return {
    averageRating: Number.parseFloat(average.toFixed(1)),
    totalReviews: data.length,
  }
}

