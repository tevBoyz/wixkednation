import { ChangePinForm } from "@/components/account/change-pin-form";
import { ProfileForm } from "@/components/account/profile-form";

export default function AccountProfilePage() {
  return (
    <section className="space-y-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your name and email. Phone is managed through sign-in.
          </p>
        </div>
        <ProfileForm />
      </div>

      <div className="space-y-6 border-t border-border pt-8">
        <div>
          <h2 className="text-lg font-medium">Change PIN</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a numeric PIN (4-6 digits) for daily sign-in.
          </p>
        </div>
        <ChangePinForm />
      </div>
    </section>
  );
}
