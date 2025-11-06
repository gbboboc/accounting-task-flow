import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { TaskCard } from "@/components/task-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CheckSquare } from "lucide-react"
import { redirect } from "next/navigation"

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; company?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch companies for filter
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("name")

  // Fetch tasks with company info
  let query = supabase
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

  if (params.search) {
    query = query.ilike("title", `%${params.search}%`)
  }

  if (params.company && params.company !== "all") {
    query = query.eq("company_id", params.company)
  }

  const { data: allTasks } = await query

  const today = new Date().toISOString().split("T")[0]

  // Categorize tasks
  const pendingTasks = allTasks?.filter((t) => t.status === "pending" && t.due_date >= today) || []
  const overdueTasks = allTasks?.filter((t) => t.status !== "completed" && t.due_date < today) || []
  const completedTasks = allTasks?.filter((t) => t.status === "completed") || []
  const todayTasks = allTasks?.filter((t) => t.due_date === today && t.status !== "completed") || []

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Toate Sarcinile"
        description={`Gestionați ${allTasks?.length || 0} sarcini pentru companiile dvs.`}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Căutare sarcini..." className="pl-9" defaultValue={params.search} name="search" />
        </div>
        <Select defaultValue={params.company || "all"}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Toate Companiile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate Companiile</SelectItem>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            În Așteptare
            {pendingTasks.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs">
                {pendingTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            Scadente Azi
            {todayTasks.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/20 text-xs">
                {todayTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            Întârziate
            {overdueTasks.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error/20 text-xs">
                {overdueTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Finalizate
            {completedTasks.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-xs">
                {completedTasks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nicio sarcină în așteptare</p>
            </div>
          ) : (
            pendingTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nicio sarcină scadentă azi</p>
            </div>
          ) : (
            todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckSquare className="h-12 w-12 text-success mb-3" />
              <p className="text-muted-foreground">Nicio sarcină întârziată - excelent!</p>
            </div>
          ) : (
            overdueTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nicio sarcină finalizată încă</p>
            </div>
          ) : (
            completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
