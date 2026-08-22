import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import {
  toQuery,
  type BlogListResult,
  type BlogPost,
  type BlogPostStatus,
  type BlogTag,
  type BlogTagPageResult,
} from "@/lib/api/types";

export type {
  BlogListResult,
  BlogPost,
  BlogPostStatus,
  BlogTag,
  BlogTagPageResult,
};

export type BlogMediaItem = {
  id: string;
  path: string;
  alt: string | null;
  url: string | null;
  createdAt: string;
};

export type AdminBlogBody = {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  bodyJson?: Record<string, unknown> | unknown;
  bodyHtml?: string | null;
  status?: BlogPostStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  authorName?: string | null;
  showOnHomepage?: boolean;
  tagIds?: string[];
};

export type AdminBlogTagBody = {
  name: string;
  slug?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isActive?: boolean;
};

export async function listPublicBlogPosts(params?: {
  page?: number;
  limit?: number;
  showOnHomepage?: boolean;
}): Promise<BlogListResult> {
  const query = toQuery({
    page: params?.page,
    limit: params?.limit,
    showOnHomepage: params?.showOnHomepage ? "true" : undefined,
  });
  return apiData<BlogListResult>(`/api/blog${query}`, { auth: false });
}

export async function fetchPublicBlogPost(slug: string): Promise<BlogPost> {
  const data = await apiData<{ post: BlogPost }>(
    `/api/blog/${encodeURIComponent(slug)}`,
    { auth: false },
  );
  return data.post;
}

export async function listPublicBlogTags(): Promise<BlogTag[]> {
  const data = await apiData<{ tags: BlogTag[] }>("/api/blog/tags", {
    auth: false,
  });
  return data.tags ?? [];
}

export async function fetchPublicBlogTagPage(
  slug: string,
  params?: { page?: number; limit?: number },
): Promise<BlogTagPageResult> {
  const query = toQuery({
    page: params?.page,
    limit: params?.limit,
  });
  return apiData<BlogTagPageResult>(
    `/api/blog/tags/${encodeURIComponent(slug)}${query}`,
    { auth: false },
  );
}

export async function listAdminBlogTags(params?: {
  includeInactive?: boolean;
}): Promise<BlogTag[]> {
  const query = toQuery({
    includeInactive: params?.includeInactive ? "true" : undefined,
  });
  const data = await apiData<{ tags: BlogTag[] }>(
    `/api/admin/blog/tags${query}`,
  );
  return data.tags ?? [];
}

export async function createAdminBlogTag(
  body: AdminBlogTagBody,
): Promise<BlogTag> {
  const data = await apiData<{ tag: BlogTag }>("/api/admin/blog/tags", {
    method: "POST",
    body,
  });
  return data.tag;
}

export async function updateAdminBlogTag(
  id: string,
  body: Partial<AdminBlogTagBody>,
): Promise<BlogTag> {
  const data = await apiData<{ tag: BlogTag }>(`/api/admin/blog/tags/${id}`, {
    method: "PATCH",
    body,
  });
  return data.tag;
}

export async function listBlogPosts(params?: {
  page?: number;
  limit?: number;
  showOnHomepage?: boolean;
}): Promise<BlogPost[]> {
  const result = await listPublicBlogPosts(params);
  return result.posts ?? [];
}

export async function listAdminBlogPosts(params?: {
  status?: BlogPostStatus;
  includeDeleted?: boolean;
}): Promise<BlogPost[]> {
  const query = toQuery({
    status: params?.status,
    includeDeleted: params?.includeDeleted ? "true" : undefined,
  });
  const data = await apiData<{ posts: BlogPost[] }>(`/api/admin/blog${query}`);
  return data.posts ?? [];
}

export async function fetchAdminBlogPost(id: string): Promise<BlogPost> {
  const data = await apiData<{ post: BlogPost }>(`/api/admin/blog/${id}`);
  return data.post;
}

export async function createAdminBlogPost(
  body: AdminBlogBody,
): Promise<BlogPost> {
  const data = await apiData<{ post: BlogPost }>("/api/admin/blog", {
    method: "POST",
    body,
  });
  return data.post;
}

export async function updateAdminBlogPost(
  id: string,
  body: Partial<AdminBlogBody>,
): Promise<BlogPost> {
  const data = await apiData<{ post: BlogPost }>(`/api/admin/blog/${id}`, {
    method: "PATCH",
    body,
  });
  return data.post;
}

export async function deleteAdminBlogPost(id: string): Promise<void> {
  await apiRequest<ApiEnvelope<unknown>>(`/api/admin/blog/${id}`, {
    method: "DELETE",
  });
}

export async function restoreAdminBlogPost(id: string): Promise<BlogPost> {
  const data = await apiData<{ post: BlogPost }>(
    `/api/admin/blog/${id}/restore`,
    { method: "PATCH" },
  );
  return data.post;
}

/** Aliases used by storefront pages */
export const fetchBlogPostsPage = listPublicBlogPosts;
export const fetchBlogPostBySlug = fetchPublicBlogPost;
export const listHomepageBlogPosts = (limit = 6) =>
  listPublicBlogPosts({ showOnHomepage: true, limit, page: 1 });
