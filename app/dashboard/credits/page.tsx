import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreditHistory } from "@/components/credits/credit-history"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus } from "lucide-react"

export default async function CreditsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Récupérer les données de l'utilisateur
  const { data: userData } = await supabase.from("users").select("credits").eq("id", session.user.id).single()

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crédits</h1>
            <p className="text-muted-foreground">Gérez vos crédits TrocSkill</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Solde actuel</CardTitle>
              <CardDescription>Vos crédits disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{userData?.credits || 0}</p>
                    <p className="text-sm text-muted-foreground">crédits disponibles</p>
                  </div>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Acheter des crédits
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarifs</CardTitle>
              <CardDescription>Packs de crédits disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { amount: 50, price: "5€", popular: false },
                  { amount: 100, price: "9€", popular: true },
                  { amount: 200, price: "15€", popular: false },
                  { amount: 500, price: "35€", popular: false },
                ].map((pack) => (
                  <div
                    key={pack.amount}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      pack.popular ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium">{pack.amount} crédits</p>
                      <p className="text-sm text-muted-foreground">{pack.price}</p>
                    </div>
                    {pack.popular && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
                        Populaire
                      </span>
                    )}
                    <Button variant={pack.popular ? "default" : "outline"} size="sm">
                      Acheter
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des transactions</CardTitle>
              <CardDescription>Vos transactions récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <CreditHistory userId={session.user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

