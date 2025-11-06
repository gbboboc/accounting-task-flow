import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { CompaniesList } from "@/components/companies-list";
import { CompanyFilters } from "@/components/company-filters";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let query = supabase
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,fiscal_code.ilike.%${params.search}%`
    );
  }

  if (params.type && params.type !== "all") {
    query = query.eq("organization_type", params.type);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data: companies } = await query;

  const companiesWithStats = await Promise.all(
    (companies || []).map(async (company) => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status, due_date")
        .eq("company_id", company.id);

      const today = new Date().toISOString().split("T")[0];
      const taskStats = {
        completed: tasks?.filter((t) => t.status === "completed").length || 0,
        pending: tasks?.filter((t) => t.status === "pending").length || 0,
        overdue:
          tasks?.filter((t) => t.status !== "completed" && t.due_date < today)
            .length || 0,
      };

      return { ...company, taskStats };
    })
  );

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
      <CompanyFilters
        initialSearch={params.search || ""}
        initialType={params.type || "all"}
        initialStatus={params.status || "all"}
      />

      {/* Companies Grid */}
      {!companies || companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nicio companie încă</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Începeți prin a adăuga prima companie pentru a gestiona sarcinile
            contabile.
          </p>
          <Button asChild>
            <a href="/companies/new">Adaugă Prima Companie</a>
          </Button>
        </div>
      ) : (
        <CompaniesList companies={companiesWithStats} />
      )}
    </div>
  );
}
