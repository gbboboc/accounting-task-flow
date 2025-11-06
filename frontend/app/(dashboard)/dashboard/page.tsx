import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, CheckSquare, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch dashboard statistics
  const { data: companies } = await supabase.from("companies").select("*").eq("user_id", user.id).eq("status", "active")

  const { data: allTasks } = await supabase
    .from("tasks")
    .select("*, companies!inner(*)")
    .eq("companies.user_id", user.id)

  const today = new Date().toISOString().split("T")[0]
  const tasksToday = allTasks?.filter((task) => task.due_date === today) || []
  const overdueTasks = allTasks?.filter((task) => task.status !== "completed" && task.due_date < today) || []
  const completedThisMonth =
    allTasks?.filter((task) => {
      if (task.status !== "completed" || !task.completed_at) return false
      const completedDate = new Date(task.completed_at)
      const now = new Date()
      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear()
    }) || []

  // Recent activity
  const { data: recentActivity } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Upcoming tasks (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingTasks =
    allTasks
      ?.filter((task) => {
        return (
          task.status !== "completed" && task.due_date >= today && task.due_date <= nextWeek.toISOString().split("T")[0]
        )
      })
      .slice(0, 5) || []

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ro-RO", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "Astăzi"
    if (diff === 1) return "Mâine"
    if (diff < 0) return `${Math.abs(diff)} zile întârziere`
    return `${diff} zile`
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Tablou de bord"
        description={`Bine ai revenit! Iată ce se întâmplă cu sarcinile tale contabile.`}
        action={{
          label: "Adaugă companie",
          href: "/companies/new",
        }}
      />

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total companii" value={companies?.length || 0} icon={Building2} variant="default" />
        <StatCard title="Sarcini astăzi" value={tasksToday.length} icon={Clock} variant="warning" />
        <StatCard
          title="Sarcini întârziate"
          value={overdueTasks.length}
          icon={AlertCircle}
          variant={overdueTasks.length > 0 ? "error" : "default"}
        />
        <StatCard
          title="Finalizate luna aceasta"
          value={completedThisMonth.length}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Sarcini viitoare</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nu există sarcini viitoare în următoarele 7 zile</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Scadență: {formatDate(task.due_date)}</p>
                    </div>
                    <Badge variant={task.due_date === today ? "default" : "secondary"}>
                      {getDaysUntil(task.due_date)}
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/tasks">
                    Vezi toate sarcinile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activitate recentă</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nicio activitate recentă</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <CheckSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("ro-RO", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        }).format(new Date(activity.created_at))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {overdueTasks.length > 0 && (
        <Card className="border-error bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <AlertCircle className="h-5 w-5" />
              Atenție necesară
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Aveți {overdueTasks.length} sarcin{overdueTasks.length !== 1 ? "i" : "ă"} întârziat
              {overdueTasks.length !== 1 ? "e" : "ă"} care necesită atenție imediată.
            </p>
            <Button asChild variant="destructive">
              <Link href="/tasks?filter=overdue">
                Vezi sarcinile întârziate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
