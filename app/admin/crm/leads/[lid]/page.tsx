"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Button from "@/app/components/ui/Button";
import {
getLabStatus,
getLeadById,
getLeadStatus,
getProposalStatus,
getWdsStatus,
type CrmLabStatusRecord,
type CrmLeadStatusRecord,
type CrmProposalStatusRecord,
type CrmWdsStatusRecord,
} from "@/app/services/crm-leads.service";
import LeadDetailsHeader from "@/components/crm/leads/LeadDetailsHeader";
import { type LeadRecord } from "@/components/crm/leads/LeadTable";

export default function LeadDetailsPage() {

const params = useParams<{ lid: string }>();
const lid = Array.isArray(params.lid) ? (params.lid[0] ?? "") : (params.lid ?? "");
const [leadRecord, setLeadRecord] = useState<LeadRecord | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [pageError, setPageError] = useState<string | null>(null);
const [labStatus, setLabStatus] = useState<CrmLabStatusRecord | null>(null);
const [proposalStatus, setProposalStatus] = useState<CrmProposalStatusRecord | null>(null);
const [leadStatus, setLeadStatus] = useState<CrmLeadStatusRecord | null>(null);
const [wdsStatus, setWdsStatus] = useState<CrmWdsStatusRecord | null>(null);

const loadLeadDetails = useCallback(async () => {
setIsLoading(true);
setPageError(null);

try {
const [lead, lab, proposal, leadSt, wds] = await Promise.all([
getLeadById(lid),
getLabStatus(lid),
getProposalStatus(lid),
getLeadStatus(lid),
getWdsStatus(lid),
]);

setLeadRecord(lead);
setLabStatus(lab);
setProposalStatus(proposal);
setLeadStatus(leadSt);
setWdsStatus(wds);
} catch (error) {
setPageError(resolveErrorMessage(error, "Unable to load that lead right now."));
} finally {
setIsLoading(false);
}
}, [lid]);

useEffect(() => {
if (!lid) {
setPageError("That lead could not be found.");
setIsLoading(false);
return;
}

void loadLeadDetails();
}, [lid, loadLeadDetails]);

if (isLoading) {
return (
<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
<div className="mx-auto flex w-full max-w-7xl flex-col rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
Loading lead details...
</div>
</section>
);
}

if (!leadRecord || pageError) {
return (
<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
<div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-700 shadow-sm">
<p>{pageError ?? "That lead could not be found."}</p>
<div>
<Button variant="secondary" onClick={() => void loadLeadDetails()}>
Retry
</Button>
</div>
</div>
</section>
);
}

const wdsComputedStatus = deriveWdsStatus(wdsStatus);
const wdsDays = wdsStatus?.days ?? null;

return (
<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
<div className="mx-auto flex w-full max-w-7xl flex-col">
<LeadDetailsHeader
leadId={leadRecord.lid}
customerId={leadRecord.cid}
customerName={leadRecord.customerName}
wasteType={leadRecord.wasteStream}
wasteClass={leadRecord.wasteClass === "Others" ? leadRecord.otherWasteClass?.trim() || "Others" : leadRecord.wasteClass}
estimatedQuantity={`${leadRecord.estimatedQuantity} ${leadRecord.unit}`}
/>
<div className="mt-6 grid gap-6 xl:grid-cols-4">
<StatusPanelCard
title="Lab Status"
badge={<StatusBadge tone={getLabBadgeTone(labStatus?.decision ?? "")}>{labStatus?.decision || "Pending"}</StatusBadge>}
>
<DisplayField label="LID" value={leadRecord.lid} />
<DisplayField label="LAB ID" value={labStatus?.labId || "-"} />
<DisplayField label="Decision" value={labStatus ? (labStatus.decision === "Other" ? labStatus.otherDecision || "-" : labStatus.decision) : "-"} />
<DisplayField label="Chemist Name" value={labStatus?.chemistName || "-"} />
<DisplayField label="Comments" value={labStatus?.comments || "-"} multiline />
</StatusPanelCard>

<StatusPanelCard
title="Proposal Status"
badge={<StatusBadge tone={getProposalBadgeTone(proposalStatus?.status ?? "")}>{proposalStatus?.status || "Pending"}</StatusBadge>}
>
<DisplayField label="LID" value={leadRecord.lid} />
<DisplayField label="PID" value={proposalStatus?.pid || "-"} />
<DisplayField label="Status" value={proposalStatus ? (proposalStatus.status === "Other" ? proposalStatus.otherStatus || "-" : proposalStatus.status) : "-"} />
<DisplayField label="Updated By" value={proposalStatus?.updatedBy || "-"} />
<DisplayField label="Comments" value={proposalStatus?.comments || "-"} multiline />
</StatusPanelCard>

<StatusPanelCard
title="Lead Status"
badge={<StatusBadge tone={getLeadBadgeTone(leadStatus?.status ?? "")}>{leadStatus?.status || "Pending"}</StatusBadge>}
>
<DisplayField label="LID" value={leadRecord.lid} />
<DisplayField label="Status" value={leadStatus ? (leadStatus.status === "Other" ? leadStatus.otherStatus || "-" : leadStatus.status) : "-"} />
<DisplayField label="Updated By" value={leadStatus?.updatedBy || "-"} />
<DisplayField label="Comments" value={leadStatus?.comments || "-"} multiline />
</StatusPanelCard>

<StatusPanelCard
title="WDS Status"
badge={<StatusBadge tone={getWdsBadgeTone(wdsComputedStatus)}>{wdsComputedStatus}</StatusBadge>}
>
<DisplayField label="LID" value={leadRecord.lid} />
<DisplayField label="WDS No." value={wdsStatus?.wdsNo || "N/A"} />
<DisplayField label="Date Submitted" value={wdsStatus?.dateSubmitted || "-"} />
<DisplayField label="Status" value={wdsComputedStatus} />
<DisplayField label="Date Approved" value={wdsStatus?.dateApproved || "-"} />
<DisplayField label="Days" value={wdsDays !== null ? `${wdsDays} Days` : "-"} />
<DisplayField label="Updated By" value={wdsStatus?.updatedBy || "N/A"} />
<DisplayField label="Comments" value={wdsStatus?.comments || "-"} multiline />
</StatusPanelCard>
</div>
</div>
</section>
);
}

function StatusPanelCard({ title, badge, children }: Readonly<{ title: string; badge: React.ReactNode; children: React.ReactNode }>) {
return (
<section className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
<div className="flex items-start justify-between gap-4">
<div>
<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
<p className="mt-2 text-sm text-slate-500">Current saved status for this lead.</p>
</div>
{badge}
</div>
<div className="mt-5 flex flex-1 flex-col gap-4">{children}</div>
</section>
);
}

function DisplayField({ label, value, multiline = false }: Readonly<{ label: string; value: string; multiline?: boolean }>) {
return (
<div className="flex flex-col gap-1.5">
<span className="text-sm font-medium text-slate-700">{label}</span>
{multiline ? (
<div className="min-h-[3.5rem] w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 whitespace-pre-wrap">{value}</div>
) : (
<div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900">{value}</div>
)}
</div>
);
}

function StatusBadge({ tone, children }: Readonly<{ tone: string; children: React.ReactNode }>) {
return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{children}</span>;
}

function getLabBadgeTone(value: string) {
if (value === "Accept") return "bg-emerald-50 text-emerald-700";
if (value === "Reject") return "bg-rose-50 text-rose-700";
return "bg-slate-100 text-slate-600";
}

function getProposalBadgeTone(value: string) {
if (value === "Sent") return "bg-sky-50 text-sky-700";
if (value === "Under Review") return "bg-violet-50 text-violet-700";
return "bg-slate-100 text-slate-600";
}

function getLeadBadgeTone(value: string) {
if (value === "Won") return "bg-emerald-50 text-emerald-700";
if (value === "Lost") return "bg-rose-50 text-rose-700";
return "bg-sky-50 text-sky-700";
}

function getWdsBadgeTone(value: string) {
if (value === "Approved") return "bg-emerald-50 text-emerald-700";
if (value === "Open") return "bg-sky-50 text-sky-700";
return "bg-slate-100 text-slate-600";
}

function deriveWdsStatus(wds: CrmWdsStatusRecord | null): string {
if (!wds || !wds.dateSubmitted) return "N/A";
if (wds.dateApproved) return "Approved";
return "Open";
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
if (error instanceof Error && error.message.trim()) {
return error.message;
}
return fallbackMessage;
}