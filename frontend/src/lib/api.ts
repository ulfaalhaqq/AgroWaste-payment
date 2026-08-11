import { getToken } from "./auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  });
}

export function getProductImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
  try {
    const origin = new URL(base).origin;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${origin}${parsed.pathname}${parsed.search}`;
      }
      return url;
    }

    if (url.startsWith("/storage/")) {
      return `${origin}${url}`;
    }
    if (url.startsWith("storage/")) {
      return `${origin}/${url}`;
    }

    const cleanPath = url.startsWith("/") ? url.slice(1) : url;
    return `${origin}/storage/${cleanPath}`;
  } catch (e) {
    // ignore
  }
  return url;
}
