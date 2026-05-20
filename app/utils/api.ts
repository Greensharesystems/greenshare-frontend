import { clearAuthSession, readAuthSession } from "@/app/hooks/useAuth";


export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default API_URL;


let hasLoggedMissingApiUrl = false;

type PdfAction = "view" | "download";

type PdfRequestLogDetails = Readonly<{
	action: PdfAction;
	pdfType: string;
	documentId: string | number;
	path: string;
}>;

type OpenPdfWithAuthOptions = Readonly<{
	pdfType: string;
	documentId: string | number;
	path: string;
	fallbackErrorMessage: string;
}>;


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


export function logPdfRequest({ action, pdfType, documentId, path }: PdfRequestLogDetails) {
	const finalUrl = getApiUrl(path);
	const hasToken = Boolean(readAuthSession()?.accessToken);

	console.log(`[PDF ${action}]`, {
		pdfType,
		id: String(documentId),
		finalUrl,
		hasToken,
	});

	if (/localhost|127\.0\.0\.1/i.test(finalUrl)) {
		console.warn(`[PDF ${action}] NEXT_PUBLIC_API_URL resolves to a local address.`, {
			finalUrl,
		});
	}

	return {
		finalUrl,
		hasToken,
	};
}


export async function openPdfWithAuth({ pdfType, documentId, path, fallbackErrorMessage }: OpenPdfWithAuthOptions) {
	logPdfRequest({
		action: "view",
		pdfType,
		documentId,
		path,
	});

	const previewWindow = typeof window !== "undefined" ? window.open("", "_blank") : null;

	try {
		const response = await apiFetch(path, {
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(await extractResponseErrorMessage(response, fallbackErrorMessage));
		}

		const pdfBlob = await response.blob();
		const previewUrl = window.URL.createObjectURL(pdfBlob);

		if (previewWindow) {
			previewWindow.location.href = previewUrl;
		} else {
			window.open(previewUrl, "_blank", "noopener,noreferrer");
		}

		window.setTimeout(() => {
			window.URL.revokeObjectURL(previewUrl);
		}, 60_000);
	} catch (error) {
		previewWindow?.close();
		throw error;
	}
}


function buildApiUrl(path: string) {
	return getApiUrl(path);
}


async function extractResponseErrorMessage(response: Response, fallbackErrorMessage: string) {
	const contentType = response.headers.get("Content-Type") ?? "";

	if (contentType.includes("application/json")) {
		const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
		return payload?.detail ?? fallbackErrorMessage;
	}

	const text = await response.text().catch(() => "");
	return text || fallbackErrorMessage;
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