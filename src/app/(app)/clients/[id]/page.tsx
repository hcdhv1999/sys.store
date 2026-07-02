import { ClientDetail } from "@/features/clients/client-detail";
import { clients } from "@/lib/data/seed";

// Prerender every client profile at build time (static — Edge-free on
// Cloudflare Pages). Unknown ids fall through to the 404 page.
export function generateStaticParams() {
  return clients.map((client) => ({ id: client.id }));
}
export const dynamicParams = false;

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetail id={id} />;
}
