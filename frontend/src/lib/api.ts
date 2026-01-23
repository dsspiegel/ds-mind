const DEFAULT_LOCAL_API_URL = "http://127.0.0.1:8000";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const isLocalhost = (hostname: string) =>
    hostname === "localhost" || hostname === "127.0.0.1";

const getFallbackBaseUrl = () => {
    if (typeof window === "undefined") {
        return DEFAULT_LOCAL_API_URL;
    }
    // Only use localhost fallback when actually on localhost
    const { hostname } = window.location;
    if (isLocalhost(hostname)) {
        return DEFAULT_LOCAL_API_URL;
    }
    // In production, don't guess - require NEXT_PUBLIC_API_URL to be set
    console.warn("API URL not configured for production. Set NEXT_PUBLIC_API_URL.");
    return "";
};

const envBaseUrl = process.env.NEXT_PUBLIC_API_URL
    ? normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    : "";

export async function apiFetch(path: string, init?: RequestInit) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Use env URL if set, otherwise fallback for localhost development
    const baseUrl = envBaseUrl || getFallbackBaseUrl();
    if (!baseUrl) {
        throw new Error("API URL not configured. Set NEXT_PUBLIC_API_URL environment variable.");
    }

    const url = `${baseUrl}${normalizedPath}`;
    return await fetch(url, init);
}

