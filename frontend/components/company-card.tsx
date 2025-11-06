"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Building2, MapPin, Hash, Users, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Company } from "@/lib/types"

interface CompanyCardProps {
  company: Company & {
    taskStats?: {
      completed: number
      pending: number
      overdue: number
    }
  }
  onDelete?: (id: string) => void
}

export function CompanyCard({ company, onDelete }: CompanyCardProps) {
  const getStatusColor = () => {
    if (company.taskStats?.overdue && company.taskStats.overdue > 0) {
      return "border-error"
    }
    return ""
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${getStatusColor()}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate">{company.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{company.location}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/companies/${company.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/companies/${company.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-error" onClick={() => onDelete?.(company.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Fiscal Code:</span>
            <span className="font-medium">{company.fiscal_code}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{company.organization_type}</Badge>
            {company.is_tva_payer && <Badge variant="outline">TVA Plătitor</Badge>}
            {company.has_employees && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {company.employee_count} Employees
              </Badge>
            )}
          </div>

          {company.taskStats && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Task Status</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">{company.taskStats.completed} completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-muted-foreground">{company.taskStats.pending} pending</span>
                </div>
                {company.taskStats.overdue > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-error" />
                    <span className="text-error font-medium">{company.taskStats.overdue} overdue</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" className="flex-1 bg-transparent">
            <Link href={`/companies/${company.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
