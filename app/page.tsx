"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkSession = async () => {
      try {
        setIsLoading(true)
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.getSession()

        // Si une erreur se produit, on la gère silencieusement
        if (error) {
          console.error("Erreur de session:", error)
          // Nettoyer les cookies d'authentification en cas d'erreur
          await supabase.auth.signOut()
        }
      } catch (err) {
        console.error("Erreur lors de la vérification de la session:", err)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (error === "pending_approval") {
      toast({
        title: "Compte en attente d'approbation",
        description:
          "Votre compte est en attente d'approbation par un administrateur. Vous recevrez un email lorsque votre compte sera approuvé.",
        variant: "destructive",
      })
    }
  }, [error])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-muted p-4">
      <AuthForm />
    </div>
  )
}

