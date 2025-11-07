"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Calendar, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/types";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task & {
    company?: {
      name: string;
    };
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();

  const getStatusColor = () => {
    if (task.status === "completed") return "text-success";
    if (task.status === "overdue") return "text-error";
    if (task.status === "in_progress") return "text-warning";
    return "text-muted-foreground";
  };

  const getStatusBadge = () => {
    const today = new Date().toISOString().split("T")[0];
    if (task.status === "completed") {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-success border-success"
        >
          Completed
        </Badge>
      );
    }
    if (task.due_date < today) {
      return (
        <Badge variant="outline" className="bg-red-50 text-error border-error">
          Overdue
        </Badge>
      );
    }
    if (task.due_date === today) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-warning border-warning"
        >
          Due Today
        </Badge>
      );
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const handleToggleComplete = async (nextValue: boolean | "indeterminate") => {
    const completed = nextValue === true;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        let message = "Failed to update task.";

        try {
          const payload = (await response.json()) as { error?: string };
          if (payload?.error) {
            message = payload.error;
          }
        } catch {
          // ignore json parse errors
        }

        toast.error(message);
        console.error("Error updating task:", message);
        return;
      }

      if (completed) {
        toast.success("Sarcina a fost cu succes finalizată");
      } else {
        toast.success("Sarcina a fost repornită");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Eroare la actualizarea sarcinii. Vă rugăm să încercați din nou."
      );
    } finally {
      setIsCompleting(false);
    }
  };

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
              <h3
                className={`font-medium ${
                  task.status === "completed"
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {task.title}
              </h3>
              {getStatusBadge()}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {task.description}
              </p>
            )}
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
  );
}
