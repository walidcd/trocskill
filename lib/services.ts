"use server"

import { getSupabaseServer } from "./supabase/server"
import type { Database } from "./supabase/database.types"

type Service = Database["public"]["Tables"]["services"]["Row"]
type ServiceWithProvider = Service & { provider: { full_name: string; avatar_url: string | null } }

export async function getServices(limit = 10, offset = 0, category?: string, search?: string) {
  const supabase = getSupabaseServer()

  let query = supabase
    .from("services")
    .select(`
      *,
      provider:provider_id(full_name, avatar_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq("category_id", category)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erreur lors de la récupération des services:", error)
    throw error
  }

  return data as ServiceWithProvider[]
}

export async function getServiceById(id: string) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from("services")
    .select(`
      *,
      provider:provider_id(id, full_name, avatar_url, member_since),
      category:category_id(name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erreur lors de la récupération du service:", error)
    throw error
  }

  return data
}

export async function getServicesByProviderId(providerId: string) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase
    .from("services")
    .select(`
      *,
      category:category_id(name)
    `)
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erreur lors de la récupération des services du fournisseur:", error)
    throw error
  }

  return data
}

export async function createService(serviceData: Database["public"]["Tables"]["services"]["Insert"]) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase.from("services").insert(serviceData).select().single()

  if (error) {
    console.error("Erreur lors de la création du service:", error)
    throw error
  }

  return data
}

export async function updateService(id: string, serviceData: Database["public"]["Tables"]["services"]["Update"]) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase.from("services").update(serviceData).eq("id", id).select().single()

  if (error) {
    console.error("Erreur lors de la mise à jour du service:", error)
    throw error
  }

  return data
}

export async function deleteService(id: string) {
  const supabase = getSupabaseServer()

  const { error } = await supabase.from("services").delete().eq("id", id)

  if (error) {
    console.error("Erreur lors de la suppression du service:", error)
    throw error
  }

  return true
}

