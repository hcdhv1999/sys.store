import { ProjectDetail } from "@/features/projects/project-detail";

// Project workspaces resolve real tenant records by id at request time. In
// production the id is a Supabase UUID that cannot be enumerated at build
// time, so this route runs on the Edge runtime (dynamic params) rather than
// being statically prerendered from the seed.
export const runtime = "edge";
export const dynamicParams = true;

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
