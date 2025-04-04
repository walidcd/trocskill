import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/settings/profile-form"

export default async function SettingsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Récupérer les données de l'utilisateur
  const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="account">Compte</TabsTrigger>
            <TabsTrigger value="credits">Crédits</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            <ProfileForm userData={userData} />

            <Card>
              <CardHeader>
                <CardTitle>Compétences</CardTitle>
                <CardDescription>Ajoutez vos compétences pour mieux vous présenter</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                      <Input id="skills" defaultValue={userData?.skills?.join(", ") || ""} />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="languages">Langues parlées</Label>
                      <Input id="languages" defaultValue={userData?.languages?.join(", ") || ""} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Enregistrer les modifications</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité du compte</CardTitle>
                <CardDescription>Mettez à jour votre mot de passe et les paramètres de sécurité</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Mot de passe actuel</Label>
                      <Input id="current-password" type="password" />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-password">Nouveau mot de passe</Label>
                      <Input id="new-password" type="password" />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Mettre à jour le mot de passe</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Préférences du compte</CardTitle>
                <CardDescription>Gérez les paramètres de votre compte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Type de compte</h4>
                      <p className="text-sm text-muted-foreground">
                        Vous êtes actuellement inscrit en tant que{" "}
                        {userData?.user_type === "provider"
                          ? "fournisseur"
                          : userData?.user_type === "consumer"
                            ? "consommateur"
                            : userData?.user_type === "both"
                              ? "fournisseur et consommateur"
                              : userData?.user_type}
                      </p>
                    </div>
                    <Button variant="outline">Modifier</Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Supprimer le compte</h4>
                      <p className="text-sm text-muted-foreground">
                        Supprimer définitivement votre compte et toutes vos données
                      </p>
                    </div>
                    <Button variant="destructive">Supprimer</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Solde de crédits</CardTitle>
                <CardDescription>Consultez et gérez vos crédits TrocSkill</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-semibold">{userData?.credits || 0} crédits</h4>
                      <p className="text-sm text-muted-foreground">Solde actuel</p>
                    </div>
                    <Button>Acheter des crédits</Button>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Historique des transactions</h4>
                    <div className="space-y-2">
                      {[
                        { type: "Achat", amount: "+50", date: "10 juin 2024", description: "Achat de crédits" },
                        { type: "Dépense", amount: "-15", date: "5 juin 2024", description: "Cours de cuisine" },
                        { type: "Gain", amount: "+20", date: "1 juin 2024", description: "Cours de guitare donné" },
                        { type: "Dépense", amount: "-25", date: "25 mai 2024", description: "Réparation d'ordinateur" },
                        { type: "Gain", amount: "+30", date: "20 mai 2024", description: "Aide au jardinage" },
                      ].map((transaction, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">{transaction.date}</div>
                          </div>
                          <div
                            className={`font-semibold ${
                              transaction.amount.startsWith("+") ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.amount} crédits
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
                <CardDescription>Choisissez comment vous souhaitez être notifié</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Nouvelles réservations", description: "Quand quelqu'un réserve un de vos services" },
                    { title: "Messages", description: "Quand vous recevez un nouveau message" },
                    { title: "Avis", description: "Quand quelqu'un laisse un avis sur un de vos services" },
                    { title: "Validation de service", description: "Quand un de vos services est validé ou refusé" },
                    { title: "Rappels", description: "Rappels pour vos réservations à venir" },
                    {
                      title: "Mises à jour",
                      description: "Nouvelles fonctionnalités et mises à jour de la plateforme",
                    },
                  ].map((notification, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`email-${i}`}
                            defaultChecked
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`email-${i}`} className="text-sm">
                            Email
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`app-${i}`}
                            defaultChecked
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`app-${i}`} className="text-sm">
                            Application
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button type="submit">Enregistrer les préférences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

