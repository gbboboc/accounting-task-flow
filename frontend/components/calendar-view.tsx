"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"

interface CalendarViewProps {
  tasks: (Task & {
    companies?: {
      name: string
    }
  })[]
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getTasksForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return tasks.filter((task) => task.due_date === dateStr)
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const today = new Date()
  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dayTasks = getTasksForDate(day)
            const hasOverdue = dayTasks.some(
              (t) => t.status !== "completed" && t.due_date < new Date().toISOString().split("T")[0],
            )
            const hasCompleted = dayTasks.some((t) => t.status === "completed")
            const hasPending = dayTasks.some((t) => t.status === "pending")

            return (
              <div
                key={day}
                className={cn(
                  "aspect-square border rounded-lg p-2 hover:bg-accent transition-colors cursor-pointer",
                  isToday(day) && "border-primary bg-primary/5",
                )}
              >
                <div className="flex flex-col h-full">
                  <span className={cn("text-sm font-medium", isToday(day) && "text-primary")}>{day}</span>
                  {dayTasks.length > 0 && (
                    <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                      {hasOverdue && <div className="h-1 w-full rounded-full bg-error" />}
                      {hasPending && <div className="h-1 w-full rounded-full bg-warning" />}
                      {hasCompleted && <div className="h-1 w-full rounded-full bg-success" />}
                      <span className="text-xs text-muted-foreground">
                        {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-error" />
            <span className="text-sm text-muted-foreground">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
