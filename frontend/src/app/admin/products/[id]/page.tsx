import { AdminProductEditClient } from "@/components/admin/products/admin-product-edit-client";

type AdminProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductEditPage({
  params,
}: AdminProductEditPageProps) {
  const { id } = await params;
  return <AdminProductEditClient productId={id} />;
}
