"use server"

import { getSupabaseServer } from "./supabase/server"

export async function promoteToAdmin(userId: string) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase.from("users").update({ user_type: "admin" }).eq("id", userId).select().single()

  if (error) {
    console.error("Erreur lors de la promotion de l'utilisateur:", error)
    throw error
  }

  return { success: true, user: data }
}

export async function approveService(serviceId: string) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from("services")
    .update({ status: "active" })
    .eq("id", serviceId)
    .select()
    .single()

  if (error) {
    console.error("Erreur lors de l'approbation du service:", error)
    throw error
  }

  // Créer une notification pour le fournisseur
  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: data.provider_id,
    title: "Service approuvé",
    message: `Votre service "${data.name}" a été approuvé et est maintenant visible par les utilisateurs.`,
    type: "service",
    related_id: data.id,
  })

  if (notificationError) {
    console.error("Erreur lors de la création de la notification:", notificationError)
    // Ne pas bloquer le processus si la notification échoue
  }

  return { success: true, service: data }
}

export async function rejectService(serviceId: string, reason: string) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from("services")
    .update({ status: "rejected" })
    .eq("id", serviceId)
    .select()
    .single()

  if (error) {
    console.error("Erreur lors du rejet du service:", error)
    throw error
  }

  // Créer une notification pour le fournisseur
  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: data.provider_id,
    title: "Service refusé",
    message: `Votre service "${data.name}" a été refusé. Raison: ${reason}`,
    type: "service",
    related_id: data.id,
  })

  if (notificationError) {
    console.error("Erreur lors de la création de la notification:", notificationError)
    // Ne pas bloquer le processus si la notification échoue
  }

  return { success: true, service: data }
}

export async function getPendingServices() {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from("services")
    .select(`
      *,
      provider:provider_id(full_name, email)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erreur lors de la récupération des services en attente:", error)
    throw error
  }

  return data
}

// Nouvelles fonctions pour la gestion des utilisateurs

export async function getPendingUsers() {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erreur lors de la récupération des utilisateurs en attente:", error)
    throw error
  }

  return data
}

export async function approveUser(userId: string) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase.from("users").update({ status: "active" }).eq("id", userId).select().single()

  if (error) {
    console.error("Erreur lors de l'approbation de l'utilisateur:", error)
    throw error
  }

  // Envoyer une notification à l'utilisateur
  const { error: notificationError } = await supabase.from("notifications").insert({
    user_id: userId,
    title: "Compte approuvé",
    message: "Votre compte a été approuvé. Vous pouvez maintenant vous connecter et utiliser la plateforme.",
    type: "system",
    related_id: null,
  })

  if (notificationError) {
    console.error("Erreur lors de la création de la notification:", notificationError)
    // Ne pas bloquer le processus si la notification échoue
  }

  return { success: true, user: data }
}

export async function rejectUser(userId: string, reason: string) {
  const supabase = getSupabaseServer()

  // Récupérer l'email de l'utilisateur avant de le supprimer
  const { data: userData, error: userError } = await supabase.from("users").select("email").eq("id", userId).single()

  if (userError) {
    console.error("Erreur lors de la récupération de l'utilisateur:", userError)
    throw userError
  }

  // Supprimer l'utilisateur de la table users
  const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

  if (deleteError) {
    console.error("Erreur lors de la suppression de l'utilisateur:", deleteError)
    throw deleteError
  }

  // Supprimer l'utilisateur de l'authentification
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    console.error("Erreur lors de la suppression de l'utilisateur de l'authentification:", authError)
    throw authError
  }

  return { success: true, email: userData.email }
}

