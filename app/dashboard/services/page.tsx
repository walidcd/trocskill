import { Filter, Search, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getServices } from "@/lib/services"
import { getCategories } from "@/lib/categories"

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string }
}) {
  const services = await getServices(20, 0, searchParams.category, searchParams.search)
  const categories = await getCategories()

  // Créer un mapping des IDs de catégories vers leurs noms
  const categoryMap = categories.reduce(
    (acc, category) => {
      acc[category.id] = category.name
      return acc
    },
    {} as Record<string, string>,
  )

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services disponibles</h1>
            <p className="text-muted-foreground">Découvrez les services proposés par la communauté</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <form>
                <Input
                  type="search"
                  name="search"
                  placeholder="Rechercher un service..."
                  className="pl-8 w-full"
                  defaultValue={searchParams.search}
                />
              </form>
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrer</span>
            </Button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/services">
              <Button variant={!searchParams.category ? "default" : "outline"} size="sm">
                Tous
              </Button>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/dashboard/services?category=${category.id}`}>
                <Button variant={searchParams.category === category.id ? "default" : "outline"} size="sm">
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.length > 0 ? (
            services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <Image
                    src={service.image_url || "/placeholder.svg?height=200&width=300"}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">Par {service.provider.full_name}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      4.8
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {service.category_id ? categoryMap[service.category_id] : "Non catégorisé"}
                    </span>
                    <span className="font-medium">{service.credits_per_hour} crédits/h</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/services/${service.id}`}>Voir les détails</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Aucun service trouvé</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

