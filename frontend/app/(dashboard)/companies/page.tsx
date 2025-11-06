import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { CompanyCard } from "@/components/company-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Building2 } from "lucide-react"
import { redirect } from "next/navigation"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch companies with filters
  let query = supabase.from("companies").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,fiscal_code.ilike.%${params.search}%`)
  }

  if (params.type && params.type !== "all") {
    query = query.eq("organization_type", params.type)
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  const { data: companies } = await query

  // Fetch task statistics for each company
  const companiesWithStats = await Promise.all(
    (companies || []).map(async (company) => {
      const { data: tasks } = await supabase.from("tasks").select("status, due_date").eq("company_id", company.id)

      const today = new Date().toISOString().split("T")[0]
      const taskStats = {
        completed: tasks?.filter((t) => t.status === "completed").length || 0,
        pending: tasks?.filter((t) => t.status === "pending").length || 0,
        overdue: tasks?.filter((t) => t.status !== "completed" && t.due_date < today).length || 0,
      }

      return { ...company, taskStats }
    }),
  )

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Companii"
        description={`Gestionați ${companies?.length || 0} companii`}
        action={{
          label: "Adaugă Companie",
          href: "/companies/new",
        }}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Căutare companii..." className="pl-9" defaultValue={params.search} name="search" />
        </div>
        <Select defaultValue={params.type || "all"}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tip Organizație" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate Tipurile</SelectItem>
            <SelectItem value="SRL">SRL</SelectItem>
            <SelectItem value="ÎI">ÎI</SelectItem>
            <SelectItem value="ÎP">ÎP</SelectItem>
            <SelectItem value="ONG">ONG</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue={params.status || "all"}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate Statusurile</SelectItem>
            <SelectItem value="active">Activ</SelectItem>
            <SelectItem value="inactive">Inactiv</SelectItem>
            <SelectItem value="archived">Arhivat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Companies Grid */}
      {!companies || companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nicio companie încă</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Începeți prin a adăuga prima companie pentru a gestiona sarcinile contabile.
          </p>
          <Button asChild>
            <a href="/companies/new">Adaugă Prima Companie</a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companiesWithStats.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  )
}
