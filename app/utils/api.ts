import { clearAuthSession, readAuthSession } from "@/app/hooks/useAuth";


export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default API_URL;


let hasLoggedMissingApiUrl = false;


export async function apiFetch(path: string, init?: RequestInit) {
	const session = readAuthSession();
	const headers = new Headers(init?.headers);

	if (session?.accessToken) {
		headers.set("Authorization", `Bearer ${session.accessToken}`);
	}

	const response = await fetch(buildApiUrl(path), {
		...init,
		headers,
	});

	if (response.status === 401 && typeof window !== "undefined") {
		clearAuthSession();

		if (window.location.pathname !== "/") {
			window.location.replace("/");
		}
	}

	return response;
}


export function getApiUrl(path: string) {
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}

	if (!hasConfiguredApiUrl()) {
		logMissingApiUrl();
		throw new Error("NEXT_PUBLIC_API_URL is not set.");
	}

	return `${API_URL}${path}`;
}


function buildApiUrl(path: string) {
	return getApiUrl(path);
}


function hasConfiguredApiUrl() {
	return typeof API_URL === "string" && API_URL.trim().length > 0;
}


function logMissingApiUrl() {
	if (hasLoggedMissingApiUrl) {
		return;
	}

	hasLoggedMissingApiUrl = true;
	console.error("NEXT_PUBLIC_API_URL is missing. Frontend API requests cannot be resolved.");
}