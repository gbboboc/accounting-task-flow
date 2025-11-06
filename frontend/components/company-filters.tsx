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

interface CompanyFiltersProps {
  initialSearch?: string;
  initialType?: string;
  initialStatus?: string;
}

export function CompanyFilters({
  initialSearch = "",
  initialType = "all",
  initialStatus = "all",
}: CompanyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState(initialStatus);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);
  const prevSearchParamsRef = useRef(searchParams.toString());
  const lastSearchValueRef = useRef(initialSearch);
  const typeRef = useRef(initialType);
  const statusRef = useRef(initialStatus);

  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const updateFilters = useCallback(
    (newSearch: string, newType: string, newStatus: string) => {
      const currentSearch = searchParams.get("search") || "";
      const currentType = searchParams.get("type") || "all";
      const currentStatus = searchParams.get("status") || "all";

      if (
        newSearch.trim() === currentSearch &&
        newType === currentType &&
        newStatus === currentStatus
      ) {
        return;
      }

      isUpdatingRef.current = true;
      const params = new URLSearchParams(searchParams.toString());

      if (newSearch.trim()) {
        params.set("search", newSearch.trim());
      } else {
        params.delete("search");
      }

      if (newType && newType !== "all") {
        params.set("type", newType);
      } else {
        params.delete("type");
      }

      if (newStatus && newStatus !== "all") {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }

      router.replace(`/companies?${params.toString()}`);

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
      const urlType = searchParams.get("type") || "all";
      const urlStatus = searchParams.get("status") || "all";

      setSearch(urlSearch);
      setType(urlType);
      setStatus(urlStatus);
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
      updateFilters(search, typeRef.current, statusRef.current);
    }, 800);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, updateFilters]);

  const handleTypeChange = (value: string) => {
    setType(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    lastSearchValueRef.current = search;
    updateFilters(search, value, statusRef.current);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    lastSearchValueRef.current = search;
    updateFilters(search, typeRef.current, value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Căutare companii..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={type} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tip Organizație" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate Tipurile</SelectItem>
          <SelectItem value="SRL">SRL</SelectItem>
          <SelectItem value="ÎI">ÎI</SelectItem>
          <SelectItem value="ÎP">ÎP</SelectItem>
          <SelectItem value="ONG">ONG</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate Statusurile</SelectItem>
          <SelectItem value="active">Activ</SelectItem>
          <SelectItem value="inactive">Inactiv</SelectItem>
          <SelectItem value="archived">Arhivat</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
