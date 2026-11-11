import { OrderDetailClient } from "@/components/orders/order-detail-client";

type AccountOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const { orderId } = await params;

  return (
    <section>
      <OrderDetailClient orderId={orderId} />
    </section>
  );
}
