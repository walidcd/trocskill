import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessageList } from "@/components/messages/message-list"

export default async function MessagesPage() {
  const supabase = getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Gérez vos conversations avec les autres utilisateurs</p>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Vos conversations récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <MessageList userId={session.user.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

