import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  MapPin,
  Hash,
  Users,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
} from "lucide-react"
import Link from "next/link"
import { CompanyTemplateOverrides } from "@/components/company-template-overrides"

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === "new") {
    redirect("/companies/new")
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch company
  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !company) {
    notFound()
  }

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("company_id", id)
    .order("due_date", { ascending: true })

  // Fetch task templates for overrides management
  const { data: templates } = await supabase
    .from("task_templates")
    .select("*")
    .order("name")

  const today = new Date().toISOString().split("T")[0]
  const upcomingTasks = tasks?.filter((t) => t.status !== "completed" && t.due_date >= today).slice(0, 5) || []
  const completedTasks = tasks?.filter((t) => t.status === "completed") || []
  const overdueTasks = tasks?.filter((t) => t.status !== "completed" && t.due_date < today) || []

  const completionRate = tasks && tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString))
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "Today"
    if (diff === 1) return "Tomorrow"
    if (diff < 0) return `${Math.abs(diff)} days overdue`
    return `${diff} days`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/companies">← Back to Companies</Link>
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{company.location}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary">{company.organization_type}</Badge>
                {company.is_tva_payer && <Badge variant="outline">TVA Plătitor</Badge>}
                {company.has_employees && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {company.employee_count} Employees
                  </Badge>
                )}
                <Badge variant={company.status === "active" ? "default" : "secondary"}>{company.status}</Badge>
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href={`/companies/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {overdueTasks.length > 0 && (
        <Card className="border-error bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm font-medium text-error">
              {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""} require immediate attention
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks This Month</p>
                <p className="text-2xl font-bold mt-1">{tasks?.length || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold mt-1">{completionRate}%</p>
              </div>
              <Clock className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next Deadline</p>
                <p className="text-2xl font-bold mt-1">
                  {upcomingTasks.length > 0 ? getDaysUntil(upcomingTasks[0].due_date).split(" ")[0] : "—"}
                </p>
                {upcomingTasks.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{upcomingTasks[0].title}</p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="info">Company Info</TabsTrigger>
          <TabsTrigger value="templates">Șabloane</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming tasks</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">Due: {formatDate(task.due_date)}</p>
                      </div>
                      <Badge>{getDaysUntil(task.due_date)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">Task management interface coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fiscal Code:</span>
                  <span className="font-medium">{company.fiscal_code}</span>
                </div>
                {company.contact_person && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">{company.contact_person}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{company.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fiscal Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Regime:</span>
                  <span className="font-medium capitalize">{company.tax_regime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA Payer:</span>
                  <span className="font-medium">{company.is_tva_payer ? `Yes (${company.tva_type})` : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employees:</span>
                  <span className="font-medium">{company.has_employees ? company.employee_count : "None"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">{formatDate(company.accounting_start_date)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <CompanyTemplateOverrides
            companyId={id}
            templates={templates || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
