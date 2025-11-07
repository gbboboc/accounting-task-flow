import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// POST: Create a new task template
export async function POST(request: Request) {
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

  let payload: {
    name: string
    description?: string
    frequency: string
    deadline_day: number
    deadline_month?: number | null
    applies_to_tva_payers?: boolean
    applies_to_employers?: boolean
    applies_to_org_types?: string[]
    reminder_days?: number[]
    is_active?: boolean
    code?: string
    law_reference?: string
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

  // Validate required fields
  if (!payload.name || !payload.name.trim()) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    )
  }

  if (!payload.frequency) {
    return NextResponse.json(
      { error: "frequency is required" },
      { status: 400 }
    )
  }

  if (
    !["monthly", "quarterly", "annual", "weekly"].includes(payload.frequency)
  ) {
    return NextResponse.json(
      { error: "Invalid frequency value" },
      { status: 400 }
    )
  }

  if (
    !payload.deadline_day ||
    payload.deadline_day < 1 ||
    payload.deadline_day > 31
  ) {
    return NextResponse.json(
      { error: "deadline_day must be between 1 and 31" },
      { status: 400 }
    )
  }

  // Prepare insert data
  const insertData: Record<string, unknown> = {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    frequency: payload.frequency,
    deadline_day: payload.deadline_day,
    deadline_month: payload.deadline_month ?? null,
    applies_to_tva_payers: payload.applies_to_tva_payers ?? false,
    applies_to_employers: payload.applies_to_employers ?? false,
    applies_to_org_types: payload.applies_to_org_types ?? null,
    reminder_days: payload.reminder_days || [7, 3, 1],
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    code: payload.code?.trim() || null,
    law_reference: payload.law_reference?.trim() || null,
    notes: payload.notes?.trim() || null,
  }

  const { data: template, error: createError } = await supabase
    .from("task_templates")
    .insert(insertData)
    .select()
    .single()

  if (createError) {
    return NextResponse.json(
      { error: createError.message || "Failed to create template" },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, data: template })
}

