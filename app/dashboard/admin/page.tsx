import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AdminActions } from "@/components/admin/admin-actions";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = getSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }
  //deployment
  // Vérifier si l'utilisateur est un administrateur
  const { data: userData, error } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", session.user.id)
    .single();

  if (error || userData?.user_type !== "admin") {
    // Rediriger vers le tableau de bord si l'utilisateur n'est pas un administrateur
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
            <CardDescription>
              Outils d'administration pour la plateforme TrocSkill
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminActions />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
