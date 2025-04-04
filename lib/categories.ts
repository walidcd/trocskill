"use server"

import { getSupabaseServer } from "./supabase/server"
import type { Database } from "./supabase/database.types"

type Category = Database["public"]["Tables"]["categories"]["Row"]

export async function getCategories() {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Erreur lors de la récupération des catégories:", error)
    throw error
  }

  return data as Category[]
}

export async function getCategoryById(id: string) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()

  if (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error)
    throw error
  }

  return data as Category
}

export async function createCategory(categoryData: Database["public"]["Tables"]["categories"]["Insert"]) {
  const supabase = getSupabaseServer()

  const { data, error } = await supabase.from("categories").insert(categoryData).select().single()

  if (error) {
    console.error("Erreur lors de la création de la catégorie:", error)
    throw error
  }

  return data as Category
}

