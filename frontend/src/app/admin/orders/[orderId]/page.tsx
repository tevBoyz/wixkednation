import { AdminOrderDetailClient } from "@/components/admin/orders/admin-order-detail-client";

type AdminOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { orderId } = await params;

  return <AdminOrderDetailClient orderId={orderId} />;
}
