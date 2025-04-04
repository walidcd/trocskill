"use server"

import { getSupabaseServer } from "./supabase/server"

export async function seedCategories() {
  const supabase = getSupabaseServer()

  const categories = [
    { name: "Éducation", description: "Cours, tutorat, formation", icon: "book" },
    { name: "Maison & Jardinage", description: "Bricolage, jardinage, décoration", icon: "home" },
    {
      name: "Informatique & Technologie",
      description: "Assistance informatique, développement, réparation",
      icon: "laptop",
    },
    { name: "Santé & Bien-être", description: "Coaching, yoga, nutrition", icon: "heart" },
    { name: "Art & Créativité", description: "Musique, peinture, photographie", icon: "palette" },
    { name: "Cuisine", description: "Cours de cuisine, préparation de repas", icon: "utensils" },
    { name: "Sport", description: "Coaching sportif, partenaires d'entraînement", icon: "dumbbell" },
    { name: "Transport", description: "Covoiturage, livraison", icon: "car" },
    { name: "Animaux", description: "Garde d'animaux, dressage", icon: "paw" },
    { name: "Événements", description: "Organisation, animation", icon: "calendar" },
  ]

  // Vérifier si des catégories existent déjà
  const { data: existingCategories, error: checkError } = await supabase.from("categories").select("name")

  if (checkError) {
    console.error("Erreur lors de la vérification des catégories:", checkError)
    throw checkError
  }

  // Filtrer les catégories qui n'existent pas encore
  const existingNames = existingCategories.map((cat) => cat.name)
  const categoriesToAdd = categories.filter((cat) => !existingNames.includes(cat.name))

  if (categoriesToAdd.length === 0) {
    console.log("Toutes les catégories existent déjà")
    return { success: true, message: "Toutes les catégories existent déjà" }
  }

  // Insérer les nouvelles catégories
  const { data, error } = await supabase.from("categories").insert(categoriesToAdd).select()

  if (error) {
    console.error("Erreur lors de l'ajout des catégories:", error)
    throw error
  }

  return {
    success: true,
    message: `${categoriesToAdd.length} catégories ajoutées avec succès`,
    categories: data,
  }
}

