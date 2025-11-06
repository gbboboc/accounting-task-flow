"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface Company {
  id: string
  name: string
}

interface TaskFiltersProps {
  companies?: Company[]
  initialSearch?: string
  initialCompany?: string
}

export function TaskFilters({ companies = [], initialSearch = "", initialCompany = "all" }: TaskFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [company, setCompany] = useState(initialCompany)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const companyRef = useRef(initialCompany)

  // Keep company ref in sync
  useEffect(() => {
    companyRef.current = company
  }, [company])

  // Update URL when filters change
  const updateFilters = useCallback(
    (newSearch: string, newCompany: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newSearch) {
        params.set("search", newSearch)
      } else {
        params.delete("search")
      }

      if (newCompany && newCompany !== "all") {
        params.set("company", newCompany)
      } else {
        params.delete("company")
      }

      router.push(`/tasks?${params.toString()}`)
    },
    [router, searchParams],
  )

  // Sync state with URL params when they change externally (e.g., browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || ""
    const urlCompany = searchParams.get("company") || "all"
    
    if (urlSearch !== search) {
      setSearch(urlSearch)
    }
    if (urlCompany !== company) {
      setCompany(urlCompany)
    }
  }, [searchParams, search, company])

  // Handle search input with debounce (only triggers on search changes)
  useEffect(() => {
    // Skip initial render
    if (search === initialSearch) {
      return
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer - use ref to get current company value
    debounceTimerRef.current = setTimeout(() => {
      updateFilters(search, companyRef.current)
    }, 500) // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [search, initialSearch, updateFilters])

  // Handle company select change - immediate update
  const handleCompanyChange = (value: string) => {
    setCompany(value)
    // Clear search debounce timer and update immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    updateFilters(search, value)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Căutare sarcini..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={company} onValueChange={handleCompanyChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Toate Companiile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate Companiile</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

