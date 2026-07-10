"use client";

// Typed TanStack Query hooks over the repositories — the single data
// entry point for pages. Demo mode resolves instantly; with Supabase the
// same hooks fetch live rows and cache them.

import { useQuery } from "@tanstack/react-query";
import * as repo from "@/services/repository";

const STALE_MS = 60_000;

function makeHook<T>(key: string, fn: () => Promise<T[]>) {
  return function useCollection() {
    const { data, isLoading, isError, error } = useQuery({
      queryKey: [key],
      queryFn: fn,
      staleTime: STALE_MS,
      // Config errors are deterministic — retrying only delays the message.
      retry: (failureCount, err) => (err instanceof Error && err.name === "DataConfigError" ? false : failureCount < 1),
    });
    return { data: data ?? [], isLoading, isError, error };
  };
}

export const useClients = makeHook("clients", repo.listClients);
export const useProjects = makeHook("projects", repo.listProjects);
export const useTasks = makeHook("tasks", repo.listTasks);
export const useInvoices = makeHook("invoices", repo.listInvoices);
export const useExpenses = makeHook("expenses", repo.listExpenses);
export const useQuotations = makeHook("quotations", repo.listQuotations);
export const useCampaigns = makeHook("campaigns", repo.listCampaigns);
export const useStores = makeHook("stores", repo.listStores);
export const useEmployees = makeHook("employees", repo.listEmployees);
export const useNotifications = makeHook("notifications", repo.listNotifications);
export const useCatalog = makeHook("catalog", repo.listCatalog);
