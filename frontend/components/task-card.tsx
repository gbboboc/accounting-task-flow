"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Calendar, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Task } from "@/lib/types"

interface TaskCardProps {
  task: Task & {
    company?: {
      name: string
    }
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()

  const getStatusColor = () => {
    if (task.status === "completed") return "text-success"
    if (task.status === "overdue") return "text-error"
    if (task.status === "in_progress") return "text-warning"
    return "text-muted-foreground"
  }

  const getStatusBadge = () => {
    const today = new Date().toISOString().split("T")[0]
    if (task.status === "completed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-success border-success">
          Completed
        </Badge>
      )
    }
    if (task.due_date < today) {
      return (
        <Badge variant="outline" className="bg-red-50 text-error border-error">
          Overdue
        </Badge>
      )
    }
    if (task.due_date === today) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-warning border-warning">
          Due Today
        </Badge>
      )
    }
    return <Badge variant="outline">Pending</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString))
  }

  const handleToggleComplete = async (checked: boolean) => {
    setIsCompleting(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsCompleting(false)
      return
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: checked ? "completed" : "pending",
          completed_at: checked ? new Date().toISOString() : null,
          completed_by: checked ? user.id : null,
        })
        .eq("id", task.id)

      if (error) throw error

      // Log activity
      if (checked) {
        await supabase.from("activity_log").insert({
          user_id: user.id,
          company_id: task.company_id,
          task_id: task.id,
          action: "task_completed",
          description: `Completed task: ${task.title}`,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating task:", error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={handleToggleComplete}
            disabled={isCompleting}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </h3>
              {getStatusBadge()}
            </div>
            {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {task.company && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span>{task.company.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due: {formatDate(task.due_date)}</span>
              </div>
              {task.status === "completed" && task.completed_at && (
                <div className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Completed {formatDate(task.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
