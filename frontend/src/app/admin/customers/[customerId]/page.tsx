import { AdminCustomerDetailClient } from "@/components/admin/customers/admin-customer-detail-client";

type AdminCustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  const { customerId } = await params;

  return <AdminCustomerDetailClient customerId={customerId} />;
}
