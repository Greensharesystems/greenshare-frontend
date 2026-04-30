import { clearAuthSession, readAuthSession } from "@/app/hooks/useAuth";


export const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
	throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export default API_URL;


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

	return `${API_URL}${path}`;
}


function buildApiUrl(path: string) {
	return getApiUrl(path);
}