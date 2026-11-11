import { AddressesManager } from "@/components/account/addresses-manager";

export default function AccountAddressesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Addresses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved delivery addresses for Cash on Delivery checkout.
        </p>
      </div>
      <AddressesManager />
    </section>
  );
}
