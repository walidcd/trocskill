"use server"

import { getSupabaseServer } from "./supabase/server"

export async function createAdminUser() {
  const supabase = getSupabaseServer()

  // Vérifier si un admin existe déjà
  const { data: existingAdmin, error: checkError } = await supabase
    .from("users")
    .select("id")
    .eq("user_type", "admin")
    .limit(1)

  if (checkError) {
    console.error("Erreur lors de la vérification des administrateurs:", checkError)
    throw checkError
  }

  if (existingAdmin && existingAdmin.length > 0) {
    return {
      success: true,
      message: "Un administrateur existe déjà",
      admin: existingAdmin[0],
    }
  }

  // Créer un utilisateur admin
  const email = "admin@trocskill.com"
  const password = "Admin123!"

  // Créer l'utilisateur dans Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Administrateur",
      user_type: "admin",
    },
  })

  if (authError) {
    console.error("Erreur lors de la création de l'utilisateur admin:", authError)

    // Si l'erreur est que l'utilisateur existe déjà, essayer de le récupérer
    if (authError.message.includes("already exists")) {
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

      if (userError) {
        throw authError
      }

      // Mettre à jour le type d'utilisateur
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ user_type: "admin" })
        .eq("id", userData.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return {
        success: true,
        message: "Utilisateur admin mis à jour",
        admin: updatedUser,
      }
    }

    throw authError
  }

  // Créer l'entrée dans la table users
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      email,
      full_name: "Administrateur",
      user_type: "admin",
      credits: 1000, // Beaucoup de crédits pour l'admin
    })
    .select()
    .single()

  if (userError) {
    console.error("Erreur lors de la création de l'entrée utilisateur admin:", userError)
    throw userError
  }

  return {
    success: true,
    message: "Utilisateur admin créé avec succès",
    admin: userData,
    credentials: {
      email,
      password,
    },
  }
}

