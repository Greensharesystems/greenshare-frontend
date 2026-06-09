"use client";

import { apiFetch } from "@/app/utils/api";


export const STREAM_CODE_CATEGORIES = ["Hazardous Stream", "Non-Hazardous Stream", "Recyclable Stream"] as const;
export const STREAM_CODE_STATUSES = ["Active", "Inactive"] as const;

export type StreamCodeCategory = (typeof STREAM_CODE_CATEGORIES)[number];
export type StreamCodeStatus = (typeof STREAM_CODE_STATUSES)[number];

export type StreamCodeRecord = Readonly<{
	id: number;
	scid?: string | null;
	streamCode: string;
	category: StreamCodeCategory;
	streamName: string;
	description: string;
	status: StreamCodeStatus;
	createdAt: string;
	updatedAt: string;
}>;

export type StreamCodePayload = Readonly<{
	streamCode: string;
	category: StreamCodeCategory;
	streamName: string;
	description?: string | null;
	status: StreamCodeStatus;
}>;

type BackendStreamCodeRecord = Readonly<{
	id: number;
	scid?: string | null;
	stream_code: string;
	category: StreamCodeCategory;
	stream_name: string;
	description?: string | null;
	status: StreamCodeStatus;
	created_at: string;
	updated_at: string;
}>;


export async function getStreamCodes(): Promise<StreamCodeRecord[]> {
	const response = await apiFetch("/crm/stream-codes", { cache: "no-store" });

	if (!response.ok) {
		throw new Error(await extractErrorMessage(response, "Unable to load Stream Codes."));
	}

	const payload = (await response.json()) as BackendStreamCodeRecord[];
	return payload.map(mapStreamCodeRecord);
}


export async function getNextStreamCode(category: StreamCodeCategory): Promise<string> {
	const response = await apiFetch(`/crm/stream-codes/next-code?category=${encodeURIComponent(category)}`, { cache: "no-store" });

	if (!response.ok) {
		throw new Error(await extractErrorMessage(response, "Unable to generate Stream Code."));
	}

	const payload = (await response.json()) as { next_stream_code: string };
	return payload.next_stream_code;
}


export async function createStreamCode(payload: StreamCodePayload): Promise<StreamCodeRecord> {
	const response = await apiFetch("/crm/stream-codes", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(toBackendPayload(payload)),
	});

	if (!response.ok) {
		throw new Error(await extractErrorMessage(response, "Unable to create Stream Code."));
	}

	return mapStreamCodeRecord((await response.json()) as BackendStreamCodeRecord);
}


export async function updateStreamCode(idOrCode: string | number, payload: StreamCodePayload): Promise<StreamCodeRecord> {
	const response = await apiFetch(`/crm/stream-codes/${encodeURIComponent(String(idOrCode))}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(toBackendPayload(payload)),
	});

	if (!response.ok) {
		throw new Error(await extractErrorMessage(response, "Unable to update Stream Code."));
	}

	return mapStreamCodeRecord((await response.json()) as BackendStreamCodeRecord);
}


export async function deleteStreamCode(idOrCode: string | number): Promise<void> {
	const response = await apiFetch(`/crm/stream-codes/${encodeURIComponent(String(idOrCode))}`, { method: "DELETE" });

	if (!response.ok) {
		throw new Error(await extractErrorMessage(response, "Unable to remove Stream Code."));
	}
}


function toBackendPayload(payload: StreamCodePayload) {
	return {
		stream_code: payload.streamCode,
		category: payload.category,
		stream_name: payload.streamName,
		description: payload.description?.trim() || null,
		status: payload.status,
	};
}


function mapStreamCodeRecord(record: BackendStreamCodeRecord): StreamCodeRecord {
	return {
		id: record.id,
		scid: record.scid,
		streamCode: record.stream_code,
		category: record.category,
		streamName: record.stream_name,
		description: record.description ?? "",
		status: record.status,
		createdAt: record.created_at,
		updatedAt: record.updated_at,
	};
}


async function extractErrorMessage(response: Response, fallbackMessage: string) {
	const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
	return payload?.detail ?? fallbackMessage;
}
