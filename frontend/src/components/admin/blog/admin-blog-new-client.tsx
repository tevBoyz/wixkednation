"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { createAdminBlogPost } from "@/lib/api/blog.api";
import { getErrorMessage } from "@/lib/api/errors";

/** Creates a draft immediately so cover/media uploads work while writing. */
export function AdminBlogNewClient() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    void createAdminBlogPost({
      title: "Untitled post",
      status: "draft",
      showOnHomepage: false,
    })
      .then((post) => {
        router.replace(`/admin/blog/${post.id}`);
      })
      .catch((err) => {
        const message = getErrorMessage(err, "Could not start a new draft");
        setError(message);
        toast.error(message);
      });
  }, [router]);

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        <p className="text-sm text-muted-foreground">
          Check that the backend and database are reachable, then try again from
          Blog → New post.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <p className="text-sm text-muted-foreground">Starting draft…</p>
    </div>
  );
}
