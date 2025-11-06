"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Company {
  id: string;
  name: string;
}

interface TaskFiltersProps {
  companies?: Company[];
  initialSearch?: string;
  initialCompany?: string;
}

export function TaskFilters({
  companies = [],
  initialSearch = "",
  initialCompany = "all",
}: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [company, setCompany] = useState(initialCompany);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);
  const prevSearchParamsRef = useRef(searchParams.toString());
  const lastSearchValueRef = useRef(initialSearch);

  const updateFilters = useCallback(
    (newSearch: string, newCompany: string) => {
      const currentSearch = searchParams.get("search") || "";
      const currentCompany = searchParams.get("company") || "all";

      if (newSearch.trim() === currentSearch && newCompany === currentCompany) {
        return;
      }

      isUpdatingRef.current = true;
      const params = new URLSearchParams(searchParams.toString());

      if (newSearch.trim()) {
        params.set("search", newSearch.trim());
      } else {
        params.delete("search");
      }

      if (newCompany && newCompany !== "all") {
        params.set("company", newCompany);
      } else {
        params.delete("company");
      }

      router.replace(`/tasks?${params.toString()}`);

      setTimeout(() => {
        isUpdatingRef.current = false;
        prevSearchParamsRef.current = searchParams.toString();
      }, 150);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const currentParams = searchParams.toString();

    if (
      currentParams !== prevSearchParamsRef.current &&
      !isUpdatingRef.current
    ) {
      const urlSearch = searchParams.get("search") || "";
      const urlCompany = searchParams.get("company") || "all";

      setSearch(urlSearch);
      setCompany(urlCompany);
      lastSearchValueRef.current = urlSearch;
    }

    prevSearchParamsRef.current = currentParams;
  }, [searchParams]);

  useEffect(() => {
    if (search === lastSearchValueRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      lastSearchValueRef.current = search;
      updateFilters(search, company);
    }, 800); 

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, company, updateFilters]);

  const handleCompanyChange = (value: string) => {
    setCompany(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    lastSearchValueRef.current = search;
    updateFilters(search, value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
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
  );
}
