const DEFAULT_LOCAL_API_URL = "http://127.0.0.1:8000";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const isLocalhost = (hostname: string) =>
    hostname === "localhost" || hostname === "127.0.0.1";

const getFallbackBaseUrl = () => {
    if (typeof window === "undefined") {
        return DEFAULT_LOCAL_API_URL;
    }
    const { protocol, hostname } = window.location;
    if (isLocalhost(hostname)) {
        return DEFAULT_LOCAL_API_URL;
    }
    return `${protocol}//${hostname}:8000`;
};

const envBaseUrl = process.env.NEXT_PUBLIC_API_URL
    ? normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    : "";

export async function apiFetch(path: string, init?: RequestInit) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const primaryUrl = `${envBaseUrl}${normalizedPath}`;

    try {
        return await fetch(primaryUrl, init);
    } catch (error) {
        if (!envBaseUrl && typeof window !== "undefined") {
            const fallbackUrl = `${getFallbackBaseUrl()}${normalizedPath}`;
            return await fetch(fallbackUrl, init);
        }
        throw error;
    }
}
