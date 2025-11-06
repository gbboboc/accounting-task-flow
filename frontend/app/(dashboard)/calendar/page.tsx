import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { CalendarView } from "@/components/calendar-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { redirect } from "next/navigation"

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all tasks with company info
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      companies!inner(
        id,
        name,
        user_id
      )
    `)
    .eq("companies.user_id", user.id)
    .order("due_date", { ascending: true })

  // Get today's tasks
  const today = new Date().toISOString().split("T")[0]
  const todayTasks = tasks?.filter((t) => t.due_date === today && t.status !== "completed") || []

  // Get upcoming tasks (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingTasks =
    tasks
      ?.filter((t) => {
        return t.status !== "completed" && t.due_date > today && t.due_date <= nextWeek.toISOString().split("T")[0]
      })
      .slice(0, 5) || []

  return (
    <div className="space-y-8">
      <DashboardHeader title="Calendar" description="Vizualizați sarcinile în format calendar" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarView tasks={tasks || []} />
        </div>

        <div className="space-y-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sarcinile de Azi</CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nicio sarcină scadentă azi</p>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div key={task.id} className="p-3 rounded-lg border hover:bg-accent transition-colors">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{task.companies?.name}</p>
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
                <p className="text-sm text-muted-foreground text-center py-4">Nicio sarcină viitoare</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="p-3 rounded-lg border hover:bg-accent transition-colors">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.companies?.name} • Scadență: {new Date(task.due_date).toLocaleDateString("ro-RO")}
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
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="monthly" defaultChecked />
                <Label htmlFor="monthly" className="text-sm font-normal cursor-pointer">
                  Declarații lunare
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="quarterly" defaultChecked />
                <Label htmlFor="quarterly" className="text-sm font-normal cursor-pointer">
                  Rapoarte trimestriale
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="annual" defaultChecked />
                <Label htmlFor="annual" className="text-sm font-normal cursor-pointer">
                  Obligații anuale
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
