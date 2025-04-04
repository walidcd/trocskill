"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export function AuthForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [accountType, setAccountType] = useState("consumer")
  const [acceptTerms, setAcceptTerms] = useState(false)

  const supabase = getSupabaseClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Nettoyer les sessions existantes pour éviter les conflits
      await supabase.auth.signOut()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Vérifier si l'utilisateur est approuvé
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("status")
        .eq("id", data.user.id)
        .single()

      if (userError) {
        throw userError
      }

      if (userData.status === "pending") {
        // Déconnecter l'utilisateur s'il n'est pas approuvé
        await supabase.auth.signOut()

        throw new Error(
          "Votre compte est en attente d'approbation par un administrateur. Veuillez réessayer ultérieurement.",
        )
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error("Erreur de connexion:", error)
      toast({
        title: "Erreur de connexion",
        description: error.message || "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      toast({
        title: "Conditions d'utilisation",
        description: "Vous devez accepter les conditions d'utilisation pour créer un compte",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Nettoyer les sessions existantes pour éviter les conflits
      await supabase.auth.signOut()

      // Inscription avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: accountType,
          },
        },
      })

      if (authError) {
        throw authError
      }

      // Création de l'entrée dans la table users
      if (authData.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          user_type: accountType,
          credits: 100, // Crédits de départ
          status: "pending", // Statut en attente d'approbation
          member_since: new Date().toISOString(),
        })

        if (profileError) {
          throw profileError
        }
      }

      toast({
        title: "Compte créé avec succès",
        description:
          "Votre compte est en attente d'approbation par un administrateur. Vous recevrez un email lorsque votre compte sera approuvé.",
      })

      // Déconnecter l'utilisateur après l'inscription
      await supabase.auth.signOut()

      // Réinitialiser le formulaire
      setEmail("")
      setPassword("")
      setFullName("")
      setAccountType("consumer")
      setAcceptTerms(false)
    } catch (error: any) {
      console.error("Erreur d'inscription:", error)
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-md w-full">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">TrocSkill</CardTitle>
        <CardDescription>Échangez vos compétences et services</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="votre@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Button variant="link" className="p-0 h-auto text-xs">
                    Mot de passe oublié ?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="votre@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-type">Type de compte</Label>
                <select
                  id="account-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                >
                  <option value="provider">Fournisseur de services</option>
                  <option value="consumer">Consommateur</option>
                  <option value="both">Les deux</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  <Label htmlFor="terms" className="text-xs">
                    J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité
                  </Label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Création en cours..." : "Créer un compte"}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Après inscription, votre compte devra être approuvé par un administrateur avant de pouvoir vous
                connecter.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

