import { AdminBlogEditorClient } from "@/components/admin/blog/admin-blog-editor-client";

type AdminBlogEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogEditPage({
  params,
}: AdminBlogEditPageProps) {
  const { id } = await params;
  return <AdminBlogEditorClient postId={id} />;
}
