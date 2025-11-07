import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// POST: Create a manual task for a company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user owns the company
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("user_id", user.id)
    .single()

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  let payload: {
    title: string
    description?: string
    due_date: string
    notes?: string
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  if (!payload.title || !payload.title.trim()) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    )
  }

  if (!payload.due_date) {
    return NextResponse.json(
      { error: "due_date is required" },
      { status: 400 }
    )
  }

  // Validate due_date format
  const dueDate = new Date(payload.due_date)
  if (isNaN(dueDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid due_date format" },
      { status: 400 }
    )
  }

  // Create the task (template_id will be null for manual tasks)
  const { data: task, error: createError } = await supabase
    .from("tasks")
    .insert({
      company_id: companyId,
      template_id: null, // Manual tasks have no template
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      due_date: payload.due_date,
      notes: payload.notes?.trim() || null,
      status: "pending",
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json(
      { error: createError.message || "Failed to create task" },
      { status: 400 }
    )
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: user.id,
    company_id: companyId,
    task_id: task.id,
    action: "task_created_manual",
    description: `Created manual task: ${task.title}`,
  })

  return NextResponse.json({ success: true, data: task })
}

