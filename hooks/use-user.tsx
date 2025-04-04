"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type User = Database["public"]["Tables"]["users"]["Row"]

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function getUser() {
      try {
        setIsLoading(true)

        // Récupérer la session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setUser(null)
          return
        }

        // Récupérer les données de l'utilisateur
        const { data, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (error) {
          throw error
        }

        setUser(data)
      } catch (err: any) {
        setError(err)
        console.error("Erreur lors de la récupération de l'utilisateur:", err)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getUser()
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, isLoading, error }
}

