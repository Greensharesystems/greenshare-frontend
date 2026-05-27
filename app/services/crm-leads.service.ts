"use client";

import type { LeadFormData } from "@/components/crm/leads/LeadForm";
import type { LeadLifecycleStatus, LeadRecord, ProposalStatus, LabStatus, WasteClass } from "@/components/crm/leads/LeadTable";

import { apiFetch } from "@/app/utils/api";


type BackendLeadResponse = Readonly<{
	id: number;
	lid: string;
	cid: string;
	customer_name: string;
	source: string;
	source_detail?: string | null;
	assigned_to: string;
	assigned_to_other?: string | null;
	waste_stream: string;
	waste_class: string;
	waste_class_other?: string | null;
	est_qty: number;
	unit: string;
	unit_other?: string | null;
	comments?: string | null;
	lead_date: string;
	created_at: string;
	updated_at: string;
	lab_id?: string | null;
	lab_status: string;
	lab_status_days: number;
	lab_updated_at: string;
	proposal_id?: string | null;
	proposal_status: string;
	proposal_status_days: number;
	proposal_updated_at: string;
	lead_status: string;
	lead_status_days: number;
	lead_status_updated_at: string;
}>;

type BackendLabStatusResponse = Readonly<{
	id: number;
	lead_id: number;
	lid: string;
	lab_id: string;
	decision: string;
	decision_other?: string | null;
	comments?: string | null;
	chemist_name: string;
	updated_at: string;
}>;

type BackendProposalStatusResponse = Readonly<{
	id: number;
	lead_id: number;
	lid: string;
	pid: string;
	status: string;
	status_other?: string | null;
	comments?: string | null;
	updated_by: string;
	updated_at: string;
}>;

type BackendLeadStatusResponse = Readonly<{
	id: number;
	lead_id: number;
	lid: string;
	status: string;
	status_other?: string | null;
	comments?: string | null;
	updated_by: string;
	updated_at: string;
}>;

type ApiErrorPayload = Readonly<{ detail?: string }>;

export type CrmLabStatusRecord = Readonly<{
	lid: string;
	labId: string;
	decision: string;
	otherDecision: string;
	comments: string;
	chemistName: string;
}>;

export type CrmProposalStatusRecord = Readonly<{
	lid: string;
	pid: string;
	status: string;
	otherStatus: string;
	comments: string;
	updatedBy: string;
}>;

export type CrmLeadStatusRecord = Readonly<{
	lid: string;
	status: string;
	otherStatus: string;
	comments: string;
	updatedBy: string;
}>;


export async function getLeadRecords(): Promise<LeadRecord[]> {
	const response = await apiFetch("/crm/leads", {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to load CRM leads right now."));
	}

	const payload = (await response.json()) as BackendLeadResponse[];
	return payload.map(mapBackendLeadToLeadRecord);
}


export async function getLeadById(lid: string): Promise<LeadRecord> {
	const response = await apiFetch(`/crm/leads/${encodeURIComponent(lid)}`, {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to load that lead right now."));
	}

	const payload = (await response.json()) as BackendLeadResponse;
	return mapBackendLeadToLeadRecord(payload);
}


export async function getNextLeadId(): Promise<string> {
	const response = await apiFetch("/crm/leads/next-id", {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to generate a Lead ID right now."));
	}

	const payload = (await response.json()) as { next_lid: string };
	return payload.next_lid;
}


export async function createLeadRecord(leadData: LeadFormData): Promise<LeadRecord> {
	const response = await apiFetch("/crm/leads", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			lid: leadData.leadId.trim(),
			cid: leadData.cid.trim(),
			customer_name: leadData.customerName.trim(),
			source: leadData.source,
			source_detail: buildSourceDetail(leadData),
			assigned_to: leadData.assignedTo,
			assigned_to_other: leadData.assignedTo === "Other" ? normalizeOptionalString(leadData.assignedPersonName) : null,
			waste_stream: leadData.wasteStream.trim(),
			waste_class: leadData.wasteClass,
			waste_class_other: leadData.wasteClass === "Others" ? normalizeOptionalString(leadData.otherWasteClass) : null,
			est_qty: Number(leadData.estimatedQuantity),
			unit: leadData.unit,
			unit_other: leadData.unit === "Others" ? normalizeOptionalString(leadData.otherUnit) : null,
			comments: normalizeOptionalString(leadData.comments),
			lead_date: leadData.leadDate,
		}),
	});

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to create that lead right now."));
	}

	const payload = (await response.json()) as BackendLeadResponse;
	return mapBackendLeadToLeadRecord(payload);
}


export async function getLabStatus(lid: string): Promise<CrmLabStatusRecord | null> {
	const response = await apiFetch(`/crm/leads/${encodeURIComponent(lid)}/lab-status`, {
		cache: "no-store",
	});

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to load the lab status right now."));
	}

	const payload = (await response.json()) as BackendLabStatusResponse;
	return mapBackendLabStatus(payload);
}


export async function updateLabStatus(lid: string, payload: Readonly<{ labId: string; decision: string; otherDecision: string; comments: string; chemistName: string }>): Promise<CrmLabStatusRecord> {
	const response = await apiFetch(`/crm/leads/${encodeURIComponent(lid)}/lab-status`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			lab_id: payload.labId.trim(),
			decision: payload.decision,
			decision_other: payload.decision === "Other" ? normalizeOptionalString(payload.otherDecision) : null,
			comments: normalizeOptionalString(payload.comments),
			chemist_name: payload.chemistName.trim(),
		}),
	});

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to save the lab status right now."));
	}

	const responsePayload = (await response.json()) as BackendLabStatusResponse;
	return mapBackendLabStatus(responsePayload);
}


export async function getProposalStatus(lid: string): Promise<CrmProposalStatusRecord | null> {
	const response = await apiFetch(`/crm/leads/${encodeURIComponent(lid)}/proposal-status`, {
		cache: "no-store",
	});

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to load the proposal status right now."));
	}

	const payload = (await response.json()) as BackendProposalStatusResponse;
	return mapBackendProposalStatus(payload);
}


export async function updateProposalStatus(lid: string, payload: Readonly<{ pid: string; status: string; otherStatus: string; comments: string; updatedBy: string }>): Promise<CrmProposalStatusRecord> {
	const response = await apiFetch(`/crm/leads/${encodeURIComponent(lid)}/proposal-status`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			pid: payload.pid.trim(),
			status: payload.status,
			status_other: payload.status === "Other" ? normalizeOptionalString(payload.otherStatus) : null,
			comments: normalizeOptionalString(payload.comments),
			updated_by: payload.updatedBy.trim(),
		}),
	});

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to save the proposal status right now."));
	}

	const responsePayload = (await response.json()) as BackendProposalStatusResponse;
	return mapBackendProposalStatus(responsePayload);
}


export async function getLeadStatus(lid: string): Promise<CrmLeadStatusRecord | null> {
	const response = await apiFetch(`/crm/leads/${encodeURIComponent(lid)}/lead-status`, {
		cache: "no-store",
	});

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to load the lead status right now."));
	}

	const payload = (await response.json()) as BackendLeadStatusResponse;
	return mapBackendLeadStatus(payload);
}


export async function updateLeadStatus(lid: string, payload: Readonly<{ status: string; otherStatus: string; comments: string; updatedBy: string }>): Promise<CrmLeadStatusRecord> {
	const response = await apiFetch(`/crm/leads/${encodeURIComponent(lid)}/lead-status`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			status: payload.status,
			status_other: payload.status === "Other" ? normalizeOptionalString(payload.otherStatus) : null,
			comments: normalizeOptionalString(payload.comments),
			updated_by: payload.updatedBy.trim(),
		}),
	});

	if (!response.ok) {
		throw new Error(await extractResponseErrorMessage(response, "Unable to save the lead status right now."));
	}

	const responsePayload = (await response.json()) as BackendLeadStatusResponse;
	return mapBackendLeadStatus(responsePayload);
}


function mapBackendLeadToLeadRecord(lead: BackendLeadResponse): LeadRecord {
	const assignedToName = resolveAssigneeName(lead.assigned_to, lead.assigned_to_other);

	return {
		date: lead.lead_date,
		leadGeneratedDate: lead.lead_date,
		lid: lead.lid,
		source: resolveLeadSource(lead.source, lead.source_detail),
		assignedTo: {
			name: assignedToName,
			initials: buildInitials(assignedToName),
		},
		cid: lead.cid,
		customerName: lead.customer_name,
		wasteStream: lead.waste_stream,
		wasteClass: mapWasteClass(lead.waste_class),
		otherWasteClass: lead.waste_class_other ?? null,
		estimatedQuantity: Number.isFinite(lead.est_qty) ? lead.est_qty : 0,
		unit: resolveUnit(lead.unit, lead.unit_other),
		labId: lead.lab_id ?? "",
		labStatus: mapLabStatus(lead.lab_status),
		labStatusDays: Number.isFinite(lead.lab_status_days) ? lead.lab_status_days : 0,
		labUpdatedDate: lead.lab_updated_at || lead.lead_date,
		proposalId: lead.proposal_id ?? null,
		proposalStatus: mapProposalStatus(lead.proposal_status),
		proposalStatusDays: Number.isFinite(lead.proposal_status_days) ? lead.proposal_status_days : 0,
		proposalUpdatedDate: lead.proposal_updated_at || lead.lead_date,
		status: mapLeadLifecycleStatus(lead.lead_status),
		leadStatusDays: Number.isFinite(lead.lead_status_days) ? lead.lead_status_days : 0,
		leadStatusUpdatedDate: lead.lead_status_updated_at || lead.lead_date,
	};
}


function mapBackendLabStatus(status: BackendLabStatusResponse): CrmLabStatusRecord {
	return {
		lid: status.lid,
		labId: status.lab_id,
		decision: status.decision,
		otherDecision: status.decision_other ?? "",
		comments: status.comments ?? "",
		chemistName: status.chemist_name,
	};
}


function mapBackendProposalStatus(status: BackendProposalStatusResponse): CrmProposalStatusRecord {
	return {
		lid: status.lid,
		pid: status.pid,
		status: status.status,
		otherStatus: status.status_other ?? "",
		comments: status.comments ?? "",
		updatedBy: status.updated_by,
	};
}


function mapBackendLeadStatus(status: BackendLeadStatusResponse): CrmLeadStatusRecord {
	return {
		lid: status.lid,
		status: status.status,
		otherStatus: status.status_other ?? "",
		comments: status.comments ?? "",
		updatedBy: status.updated_by,
	};
}


async function extractResponseErrorMessage(response: Response, fallbackMessage: string) {
	const contentType = response.headers.get("Content-Type") ?? "";

	if (contentType.includes("application/json")) {
		const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
		return payload?.detail ?? fallbackMessage;
	}

	const responseText = await response.text().catch(() => "");
	return responseText || fallbackMessage;
}


function buildSourceDetail(leadData: LeadFormData) {
	if (leadData.source === "Other") {
		return normalizeOptionalString(leadData.otherSource);
	}

	if (leadData.source === "Transporter") {
		return normalizeOptionalString(leadData.transporterName);
	}

	if (leadData.source === "Referral") {
		return normalizeOptionalString(leadData.referralName);
	}

	return null;
}


function normalizeOptionalString(value: string | null | undefined) {
	const normalizedValue = String(value ?? "").trim();
	return normalizedValue || null;
}


function resolveLeadSource(source: string, sourceDetail?: string | null) {
	if (source === "Other" && sourceDetail?.trim()) {
		return sourceDetail.trim();
	}

	return source;
}


function resolveAssigneeName(assignedTo: string, assignedToOther?: string | null) {
	if (assignedTo === "Other" && assignedToOther?.trim()) {
		return assignedToOther.trim();
	}

	return assignedTo;
}


function resolveUnit(unit: string, unitOther?: string | null) {
	if (unit === "Others" && unitOther?.trim()) {
		return unitOther.trim();
	}

	return unit;
}


function buildInitials(name: string) {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("") || "NA"
	);
}


function mapWasteClass(value: string): WasteClass {
	if (value === "Hazardous") {
		return "Hazardous";
	}

	if (value === "Recyclable") {
		return "Recyclable";
	}

	if (value === "Non Hazardous" || value === "Non-Hazardous") {
		return "Non-Hazardous";
	}

	return "Others";
}


function mapLabStatus(value: string): LabStatus {
	if (value === "Approved") {
		return "Accept";
	}

	if (value === "Rejected") {
		return "Reject";
	}

	if (value === "Accept" || value === "Reject" || value === "Not Applicable" || value === "Other") {
		return value;
	}

	return "Pending";
}


function mapProposalStatus(value: string): ProposalStatus {
	if (value === "Draft") {
		return "Pending";
	}

	if (value === "Pending" || value === "Sent" || value === "Not Sent" || value === "Accepted" || value === "Under Review" || value === "Other") {
		return value;
	}

	return "Pending";
}


function mapLeadLifecycleStatus(value: string): LeadLifecycleStatus {
	if (value === "Won" || value === "Lost" || value === "Other") {
		return value;
	}

	return "Open";
}