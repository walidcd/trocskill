import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateServiceForm } from "@/components/services/create-service-form"
import { getCategories } from "@/lib/categories"

export default async function CreateServicePage() {
  const categories = await getCategories()

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Proposer un service</CardTitle>
            <CardDescription>
              Remplissez le formulaire ci-dessous pour proposer un nouveau service à la communauté
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateServiceForm categories={categories} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

