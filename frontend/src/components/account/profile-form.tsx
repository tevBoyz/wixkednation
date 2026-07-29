"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errors";
import { getCurrentUser, updateCurrentUser } from "@/lib/api/users.api";

export const meQueryKey = ["user", "me"] as const;

const profileSchema = z.object({
  name: z.string().max(120, "Name is too long"),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      { message: "Enter a valid email" },
    ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: meQueryKey,
    queryFn: getCurrentUser,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    reset({
      name: user.name ?? "",
      email: user.email ?? "",
    });
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateCurrentUser({
        name: values.name.trim() || null,
        email: values.email.trim() ? values.email.trim() : null,
      }),
    onSuccess: (next) => {
      setUser(next);
      queryClient.setQueryData(meQueryKey, next);
      reset({
        name: next.name ?? "",
        email: next.email ?? "",
      });
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Could not update profile"));
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  if (isError || !user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Could not load profile")}
        </p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <form
      className="max-w-md space-y-5"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          disabled={mutation.isPending}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-phone">Phone</Label>
        <Input
          id="profile-phone"
          value={user.phone ?? "-"}
          readOnly
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Phone number cannot be changed here.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          disabled={mutation.isPending}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Optional. Leave blank to clear.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending || !isDirty}
      >
        {mutation.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
