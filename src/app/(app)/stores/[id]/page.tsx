import { StoreDetail } from "@/features/stores/store-detail";
import { stores } from "@/lib/data/seed";

// Prerender every store page at build time (static — Edge-free on
// Cloudflare Pages). Unknown ids fall through to the 404 page.
export function generateStaticParams() {
  return stores.map((store) => ({ id: store.id }));
}
export const dynamicParams = false;

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoreDetail id={id} />;
}
