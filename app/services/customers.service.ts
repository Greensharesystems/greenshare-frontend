"use client";

import { apiFetch } from "@/app/utils/api";


export type CustomerSearchRecord = Readonly<{
	cid: string;
	customerName: string;
}>;


export async function searchCustomers(query: string): Promise<CustomerSearchRecord[]> {
	const trimmedQuery = query.trim();
	if (!trimmedQuery) {
		return [];
	}

	const response = await apiFetch(`/customers/search?q=${encodeURIComponent(trimmedQuery)}`, {
		cache: "no-store",
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
		throw new Error(payload?.detail ?? "Unable to search customers right now.");
	}

	const payload = (await response.json()) as Array<{ cid?: string; customer_name?: string }>;
	return payload.map((customer) => ({
		cid: String(customer.cid ?? "").trim(),
		customerName: String(customer.customer_name ?? "").trim(),
	}));
}


export async function downloadCustomersCsv(customerIds: string[]): Promise<void> {
	const response = await apiFetch("/customers/export/csv", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ customerIds }),
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
		throw new Error(payload?.detail ?? "Unable to download the customer dataset right now.");
	}

	const csvBlob = await response.blob();
	const downloadUrl = window.URL.createObjectURL(csvBlob);
	const link = document.createElement("a");
	const filename = extractDownloadFilename(response.headers.get("Content-Disposition"), "customers-export.csv");

	link.href = downloadUrl;
	link.download = filename;
	link.style.display = "none";
	document.body.append(link);
	link.click();
	link.remove();

	window.setTimeout(() => {
		window.URL.revokeObjectURL(downloadUrl);
	}, 1000);
}


function extractDownloadFilename(contentDisposition: string | null, fallbackFilename: string) {
	if (!contentDisposition) {
		return fallbackFilename;
	}

	const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
	if (utf8Match && utf8Match[1]) {
		return decodeURIComponent(utf8Match[1]);
	}

	const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
	if (filenameMatch && filenameMatch[1]) {
		return filenameMatch[1];
	}

	return fallbackFilename;
}