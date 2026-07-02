import { ProjectDetail } from "@/features/projects/project-detail";
import { projects } from "@/lib/data/seed";

// Prerender every project workspace at build time (static — Edge-free on
// Cloudflare Pages). Unknown ids fall through to the 404 page.
export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}
export const dynamicParams = false;

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
