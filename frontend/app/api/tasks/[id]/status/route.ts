import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let { id } = params

  if (!id) {
    const url = new URL(request.url)
    const segments = url.pathname.split("/").filter(Boolean)
    const statusIndex = segments.lastIndexOf("status")
    if (statusIndex > 0) {
      id = segments[statusIndex - 1]
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 })
  }

  let payload: { completed: boolean }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof payload.completed !== "boolean") {
    return NextResponse.json({ error: "'completed' must be a boolean" }, { status: 400 })
  }

  const { data: taskData, error: fetchTaskError } = await supabase
    .from("tasks")
    .select("depends_on_tasks, company_id, title")
    .eq("id", id)
    .maybeSingle()

  if (fetchTaskError) {
    return NextResponse.json(
      { error: fetchTaskError.message || "Failed to load task" },
      { status: 400 },
    )
  }

  if (!taskData) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  let newStatus: string
  if (payload.completed) {
    newStatus = "completed"
  } else {
    const dependsOnTasks = taskData.depends_on_tasks
    if (dependsOnTasks && dependsOnTasks.length > 0) {
      const { data: dependencies, error: depsError } = await supabase
        .from("tasks")
        .select("status")
        .in("id", dependsOnTasks)

      if (depsError) {
        return NextResponse.json(
          { error: depsError.message || "Failed to check dependencies" },
          { status: 400 },
        )
      }

      const allCompleted =
        dependencies &&
        dependencies.length === dependsOnTasks.length &&
        dependencies.every((dep) => dep.status === "completed")
      newStatus = allCompleted ? "pending" : "blocked"
    } else {
      newStatus = "pending"
    }
  }

  const updates = {
    status: newStatus,
    completed_at: payload.completed ? new Date().toISOString() : null,
    completed_by: payload.completed ? user.id : null,
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Failed to update task" },
      { status: 400 },
    )
  }

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, company_id, title")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message || "Failed to load task" },
      { status: 400 },
    )
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  if (payload.completed) {
    const { error: activityError } = await supabase.from("activity_log").insert({
      user_id: user.id,
      company_id: task.company_id,
      task_id: task.id,
      action: "task_completed",
      description: `Completed task: ${task.title}`,
    })

    if (activityError) {
      console.error("Failed to record activity_log entry", activityError)
    }
  }

  return NextResponse.json({ success: true, data: { id: task.id, status: updates.status } })
}

