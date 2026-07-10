"use client";

// Entity mutations with the canonical TanStack pattern: optimistic cache
// update → repository write (Supabase in production, demo store in demo)
// → invalidate. On failure the cache snapshot is restored and the caller
// shows an error toast — a failed write is never presented as success.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as repo from "@/services/repository";
import type { Client, Project, Task } from "@/types";

function useEntityInvalidation(keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
}

// ── Tasks ────────────────────────────────────────────────────────────────

export function useCreateTask() {
  const invalidate = useEntityInvalidation(["tasks"]);
  return useMutation({
    mutationFn: (input: repo.TaskInput) => repo.createTask(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) => repo.updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const previous = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) => (old ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["tasks"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: string }) => repo.addTaskComment(taskId, body),
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useTaskAttachments() {
  const qc = useQueryClient();
  const upload = useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) => repo.uploadTaskAttachment(taskId, file),
    onSuccess: (_d, { taskId }) => qc.invalidateQueries({ queryKey: ["task-attachments", taskId] }),
  });
  const remove = useMutation({
    mutationFn: (item: Parameters<typeof repo.deleteTaskAttachment>[0]) => repo.deleteTaskAttachment(item),
    onSuccess: (_d, item) => qc.invalidateQueries({ queryKey: ["task-attachments", item.taskId] }),
  });
  return { upload, remove };
}

// ── Clients ──────────────────────────────────────────────────────────────

export function useCreateClient() {
  const invalidate = useEntityInvalidation(["clients"]);
  return useMutation({
    mutationFn: (input: repo.ClientInput) => repo.createClient(input),
    onSuccess: invalidate,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<repo.ClientInput> }) => repo.updateClient(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["clients"] });
      const previous = qc.getQueryData<Client[]>(["clients"]);
      qc.setQueryData<Client[]>(["clients"], (old) => (old ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)));
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) qc.setQueryData(["clients"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ── Projects ─────────────────────────────────────────────────────────────

export function useCreateProject() {
  const invalidate = useEntityInvalidation(["projects"]);
  return useMutation({
    mutationFn: (input: repo.ProjectInput) => repo.createProject(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Project> }) => repo.updateProject(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const previous = qc.getQueryData<Project[]>(["projects"]);
      qc.setQueryData<Project[]>(["projects"], (old) => (old ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)));
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) qc.setQueryData(["projects"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const invalidate = useEntityInvalidation(["projects", "tasks"]);
  return useMutation({
    mutationFn: (id: string) => repo.deleteProject(id),
    onSuccess: invalidate,
  });
}
