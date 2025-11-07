import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Admin role required" },
      { status: 403 }
    )
  }

  if (!id) {
    return NextResponse.json(
      { error: "Template id is required" },
      { status: 400 }
    )
  }

  let payload: Partial<{
    name: string
    description: string
    frequency: string
    deadline_day: number
    deadline_month: number | null
    applies_to_tva_payers: boolean
    applies_to_employers: boolean
    applies_to_org_types: string[]
    reminder_days: number[]
    is_active: boolean
  }>

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  if (payload.name !== undefined && !payload.name.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    )
  }

  if (
    payload.frequency !== undefined &&
    !["monthly", "quarterly", "annual", "weekly"].includes(payload.frequency)
  ) {
    return NextResponse.json(
      { error: "Invalid frequency value" },
      { status: 400 }
    )
  }

  if (
    payload.deadline_day !== undefined &&
    (payload.deadline_day < 1 || payload.deadline_day > 31)
  ) {
    return NextResponse.json(
      { error: "deadline_day must be between 1 and 31" },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {}

  if (payload.name !== undefined) updateData.name = payload.name.trim()
  if (payload.description !== undefined)
    updateData.description = payload.description?.trim() || null
  if (payload.frequency !== undefined) updateData.frequency = payload.frequency
  if (payload.deadline_day !== undefined)
    updateData.deadline_day = payload.deadline_day
  if (payload.deadline_month !== undefined)
    updateData.deadline_month = payload.deadline_month
  if (payload.applies_to_tva_payers !== undefined)
    updateData.applies_to_tva_payers = payload.applies_to_tva_payers
  if (payload.applies_to_employers !== undefined)
    updateData.applies_to_employers = payload.applies_to_employers
  if (payload.applies_to_org_types !== undefined)
    updateData.applies_to_org_types = payload.applies_to_org_types
  if (payload.reminder_days !== undefined)
    updateData.reminder_days = payload.reminder_days
  if (payload.is_active !== undefined) updateData.is_active = payload.is_active

  const { data: template, error: updateError } = await supabase
    .from("task_templates")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Failed to update template" },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, data: template })
}

