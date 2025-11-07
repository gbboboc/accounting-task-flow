import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ReminderTask {
  task_id: string
  user_id: string
  user_email: string
  company_name: string
  task_title: string
  task_due_date: string
  reminder_type: string
  days_until_due: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get tasks needing reminders
    const { data: tasks, error: tasksError } = await supabase.rpc(
      "get_tasks_needing_reminders",
      { p_check_date: new Date().toISOString().split("T")[0] }
    )

    if (tasksError) {
      throw new Error(`Failed to get tasks: ${tasksError.message}`)
    }

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tasks need reminders", sent: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    const reminders: ReminderTask[] = tasks as ReminderTask[]
    let sentCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each reminder
    for (const reminder of reminders) {
      try {
        const emailSent = await sendReminderEmail(reminder)

        // Log sent reminder
        const { error: logError } = await supabase.from("sent_reminders").insert({
          task_id: reminder.task_id,
          user_id: reminder.user_id,
          reminder_type: reminder.reminder_type,
          email_sent: emailSent,
          error_message: emailSent ? null : "Failed to send email",
        })

        if (logError) {
          console.error(`Failed to log reminder for task ${reminder.task_id}:`, logError)
        }

        if (emailSent) {
          sentCount++
        } else {
          errorCount++
          errors.push(`Task ${reminder.task_id}: Failed to send email`)
        }
      } catch (error) {
        errorCount++
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        errors.push(`Task ${reminder.task_id}: ${errorMsg}`)

        // Log error
        await supabase.from("sent_reminders").insert({
          task_id: reminder.task_id,
          user_id: reminder.user_id,
          reminder_type: reminder.reminder_type,
          email_sent: false,
          error_message: errorMsg,
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${reminders.length} reminders`,
        sent: sentCount,
        errors: errorCount,
        errorDetails: errors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})

async function sendReminderEmail(reminder: ReminderTask): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set")
    return false
  }

  const reminderMessages: Record<string, { subject: string; message: string }> = {
    overdue: {
      subject: `⚠️ Sarcină întârziată: ${reminder.task_title}`,
      message: `Bună ziua,

Aveți o sarcină întârziată pentru compania "${reminder.company_name}":

Sarcină: ${reminder.task_title}
Data scadență: ${formatDate(reminder.task_due_date)}
Status: Întârziată cu ${Math.abs(reminder.days_until_due)} zile

Vă rugăm să finalizați această sarcină cât mai curând posibil.

Vă mulțumim!`,
    },
    due: {
      subject: `📅 Sarcină scadentă astăzi: ${reminder.task_title}`,
      message: `Bună ziua,

Aveți o sarcină scadentă astăzi pentru compania "${reminder.company_name}":

Sarcină: ${reminder.task_title}
Data scadență: Astăzi (${formatDate(reminder.task_due_date)})

Vă rugăm să finalizați această sarcină în cursul zilei.

Vă mulțumim!`,
    },
    "1day": {
      subject: `⏰ Reminder: ${reminder.task_title} - scade mâine`,
      message: `Bună ziua,

Aveți o sarcină care va fi scadentă mâine pentru compania "${reminder.company_name}":

Sarcină: ${reminder.task_title}
Data scadență: Mâine (${formatDate(reminder.task_due_date)})

Vă rugăm să vă pregătiți pentru finalizarea acestei sarcini.

Vă mulțumim!`,
    },
    "3days": {
      subject: `📋 Reminder: ${reminder.task_title} - scade în 3 zile`,
      message: `Bună ziua,

Aveți o sarcină care va fi scadentă în 3 zile pentru compania "${reminder.company_name}":

Sarcină: ${reminder.task_title}
Data scadență: ${formatDate(reminder.task_due_date)} (în ${reminder.days_until_due} zile)

Vă rugăm să vă pregătiți pentru finalizarea acestei sarcini.

Vă mulțumim!`,
    },
    "7days": {
      subject: `📅 Reminder: ${reminder.task_title} - scade în 7 zile`,
      message: `Bună ziua,

Aveți o sarcină care va fi scadentă în 7 zile pentru compania "${reminder.company_name}":

Sarcină: ${reminder.task_title}
Data scadență: ${formatDate(reminder.task_due_date)} (în ${reminder.days_until_due} zile)

Vă rugăm să vă pregătiți pentru finalizarea acestei sarcini.

Vă mulțumim!`,
    },
  }

  const emailContent = reminderMessages[reminder.reminder_type]
  if (!emailContent) {
    console.error(`Unknown reminder type: ${reminder.reminder_type}`)
    return false
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Accounting Task Flow <noreply@yourdomain.com>", // TODO: Update with your domain
        to: reminder.user_email,
        subject: emailContent.subject,
        html: emailContent.message.replace(/\n/g, "<br>"),
        text: emailContent.message,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Resend API error:", errorData)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

