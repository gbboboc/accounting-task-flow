import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { CalendarView } from "@/components/calendar-view";
import { CalendarFilters } from "@/components/calendar-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    company?: string;
    monthly?: string;
    quarterly?: string;
    annual?: string;
    weekly?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("name");

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      companies!inner(
        id,
        name,
        user_id
      ),
      task_templates(
        frequency
      )
    `
    )
    .eq("companies.user_id", user.id)
    .order("due_date", { ascending: true });

  if (params.company && params.company !== "all") {
    query = query.eq("company_id", params.company);
  }

  const { data: tasks } = await query;

  let filteredTasks = tasks || [];

  const monthlyEnabled = params.monthly !== "false";
  const quarterlyEnabled = params.quarterly !== "false";
  const annualEnabled = params.annual !== "false";
  const weeklyEnabled = params.weekly !== "false";

  if (
    !monthlyEnabled ||
    !quarterlyEnabled ||
    !annualEnabled ||
    !weeklyEnabled
  ) {
    filteredTasks = filteredTasks.filter((task) => {
      const frequency = (task.task_templates as { frequency?: string } | null)
        ?.frequency;
      if (!frequency) return true;

      if (frequency === "monthly") return monthlyEnabled;
      if (frequency === "quarterly") return quarterlyEnabled;
      if (frequency === "annual") return annualEnabled;
      if (frequency === "weekly") return weeklyEnabled;

      return true;
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const todayTasks =
    filteredTasks.filter(
      (t) => t.due_date === today && t.status !== "completed"
    ) || [];

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingTasks =
    filteredTasks
      .filter((t) => {
        return (
          t.status !== "completed" &&
          t.due_date > today &&
          t.due_date <= nextWeek.toISOString().split("T")[0]
        );
      })
      .slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Calendar"
        description="Vizualizați sarcinile în format calendar"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarView tasks={filteredTasks} />
        </div>

        <div className="space-y-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sarcinile de Azi</CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nicio sarcină scadentă azi
                </p>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.companies?.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Următoarele (7 zile)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nicio sarcină viitoare
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.companies?.name} • Scadență:{" "}
                        {new Date(task.due_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtre</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarFilters
                companies={companies || []}
                initialCompany={params.company || "all"}
                initialMonthly={params.monthly !== "false"}
                initialQuarterly={params.quarterly !== "false"}
                initialAnnual={params.annual !== "false"}
                initialWeekly={params.weekly !== "false"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
