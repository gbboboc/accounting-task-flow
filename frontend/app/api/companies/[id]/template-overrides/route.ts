import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// GET: Fetch all template overrides for a company
export async function GET(
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

  const { data: overrides, error } = await supabase
    .from("task_template_overrides")
    .select("*")
    .eq("company_id", companyId)

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch overrides" },
      { status: 400 }
    )
  }

  return NextResponse.json({ data: overrides || [] })
}

// POST/PUT: Create or update a template override
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
    template_id: string
    is_disabled: boolean
    notes?: string
    custom_deadline_day?: number | null
    custom_deadline_month?: number | null
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  if (!payload.template_id) {
    return NextResponse.json(
      { error: "template_id is required" },
      { status: 400 }
    )
  }

  if (typeof payload.is_disabled !== "boolean") {
    return NextResponse.json(
      { error: "is_disabled must be a boolean" },
      { status: 400 }
    )
  }

  if (
    payload.custom_deadline_day !== undefined &&
    payload.custom_deadline_day !== null &&
    (payload.custom_deadline_day < 1 || payload.custom_deadline_day > 31)
  ) {
    return NextResponse.json(
      { error: "custom_deadline_day must be between 1 and 31" },
      { status: 400 }
    )
  }

  // Validate custom deadline month if provided
  if (
    payload.custom_deadline_month !== undefined &&
    payload.custom_deadline_month !== null &&
    (payload.custom_deadline_month < 1 || payload.custom_deadline_month > 12)
  ) {
    return NextResponse.json(
      { error: "custom_deadline_month must be between 1 and 12" },
      { status: 400 }
    )
  }

  // Upsert the override (create or update)
  const { data: override, error: upsertError } = await supabase
    .from("task_template_overrides")
    .upsert(
      {
        company_id: companyId,
        template_id: payload.template_id,
        is_disabled: payload.is_disabled,
        notes: payload.notes || null,
        custom_deadline_day: payload.custom_deadline_day ?? null,
        custom_deadline_month: payload.custom_deadline_month ?? null,
      },
      {
        onConflict: "company_id,template_id",
      }
    )
    .select()
    .single()

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message || "Failed to create/update override" },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, data: override })
}

// DELETE: Remove a template override
export async function DELETE(
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

  const url = new URL(request.url)
  const templateId = url.searchParams.get("template_id")

  if (!templateId) {
    return NextResponse.json(
      { error: "template_id is required" },
      { status: 400 }
    )
  }

  const { error: deleteError } = await supabase
    .from("task_template_overrides")
    .delete()
    .eq("company_id", companyId)
    .eq("template_id", templateId)

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message || "Failed to delete override" },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true })
}

