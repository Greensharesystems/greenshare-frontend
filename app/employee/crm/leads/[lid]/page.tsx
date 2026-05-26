"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import Button from "@/app/components/ui/Button";
import LeadDetailsHeader from "@/components/crm/leads/LeadDetailsHeader";
import { initialLeadRows, type LeadRecord } from "@/components/crm/leads/LeadTable";

type LabDecision = "Accept" | "Reject" | "Not Applicable" | "Other";
type ProposalPanelStatus = "Sent" | "Under Review" | "Not Sent" | "Other";
type LeadPanelStatus = "Open" | "Won" | "Lost" | "Other";

type LabPanelState = {
	lid: string;
	labId: string;
	comments: string;
	decision: LabDecision | "";
	otherDecision: string;
	chemistName: string;
};

type ProposalPanelState = {
	lid: string;
	pid: string;
	comments: string;
	status: ProposalPanelStatus | "";
	otherStatus: string;
	updatedBy: string;
};

type LeadStatusPanelState = {
	lid: string;
	comments: string;
	status: LeadPanelStatus | "";
	otherStatus: string;
	updatedBy: string;
};

export default function LeadDetailsPage() {
	const params = useParams<{ lid: string }>();
	const lid = Array.isArray(params.lid) ? params.lid[0] : params.lid;

	const leadRecord = useMemo(() => {
		return initialLeadRows.find((lead) => lead.lid === lid) ?? buildFallbackLead(lid);
	}, [lid]);

	const [labDraft, setLabDraft] = useState<LabPanelState>(() => createInitialLabPanelState(leadRecord));
	const [savedLab, setSavedLab] = useState<LabPanelState>(() => createInitialLabPanelState(leadRecord));
	const [proposalDraft, setProposalDraft] = useState<ProposalPanelState>(() => createInitialProposalPanelState(leadRecord));
	const [savedProposal, setSavedProposal] = useState<ProposalPanelState>(() => createInitialProposalPanelState(leadRecord));
	const [leadDraft, setLeadDraft] = useState<LeadStatusPanelState>(() => createInitialLeadStatusPanelState(leadRecord));
	const [savedLead, setSavedLead] = useState<LeadStatusPanelState>(() => createInitialLeadStatusPanelState(leadRecord));
	const [labErrors, setLabErrors] = useState<Partial<Record<keyof LabPanelState, string>>>({});
	const [proposalErrors, setProposalErrors] = useState<Partial<Record<keyof ProposalPanelState, string>>>({});
	const [leadErrors, setLeadErrors] = useState<Partial<Record<keyof LeadStatusPanelState, string>>>({});
	const [showLabPreview, setShowLabPreview] = useState(false);
	const [showProposalPreview, setShowProposalPreview] = useState(false);
	const [showLeadPreview, setShowLeadPreview] = useState(false);

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
				<div className="mt-6 grid gap-6 xl:grid-cols-3">
					<StatusPanelCard
						title="Lab Status"
						badge={<StatusBadge tone={getLabBadgeTone(savedLab.decision)}>{savedLab.decision || "Pending"}</StatusBadge>}
					>
						<div className="grid gap-4">
							<DisplayField label="LID" value={labDraft.lid} />
							<TextField
								label="LAB ID"
								value={labDraft.labId}
								onChange={(value) => setLabDraft((current) => ({ ...current, labId: value }))}
								error={labErrors.labId}
								placeholder="LAB-0001"
							/>
							<TextAreaField
								label="Comments"
								value={labDraft.comments}
								onChange={(value) => setLabDraft((current) => ({ ...current, comments: value }))}
								placeholder="Add lab status notes"
							/>
							<SelectField
								label="Decision"
								value={labDraft.decision}
								onChange={(value) =>
									setLabDraft((current) => ({
										...current,
										decision: value as LabPanelState["decision"],
										otherDecision: value === "Other" ? current.otherDecision : "",
									}))
								}
								error={labErrors.decision}
								placeholder="Select decision"
								options={["Accept", "Reject", "Not Applicable", "Other"]}
							/>
							{labDraft.decision === "Other" ? (
								<TextField
									label="Other Decision"
									value={labDraft.otherDecision}
									onChange={(value) => setLabDraft((current) => ({ ...current, otherDecision: value }))}
									error={labErrors.otherDecision}
									placeholder="Enter other decision"
								/>
							) : null}
							<TextField
								label="Chemist Name"
								value={labDraft.chemistName}
								onChange={(value) => setLabDraft((current) => ({ ...current, chemistName: value }))}
								error={labErrors.chemistName}
								placeholder="Enter chemist name"
							/>
						</div>
						<div className="mt-6 flex flex-wrap gap-3 pt-1">
							<Button variant="secondary" onClick={() => setShowLabPreview((current) => !current)}>
								View
							</Button>
							<Button
								onClick={() => {
									const errors = validateLabPanel(labDraft);
									setLabErrors(errors);
									if (Object.keys(errors).length > 0) {
										return;
									}

									setSavedLab(labDraft);
									setShowLabPreview(true);
								}}
							>
								Submit
							</Button>
						</div>
						{showLabPreview ? <PanelPreview title="Current Lab Status" rows={buildLabPreviewRows(savedLab)} /> : null}
					</StatusPanelCard>

					<StatusPanelCard
						title="Proposal Status"
						badge={<StatusBadge tone={getProposalBadgeTone(savedProposal.status)}>{savedProposal.status || "Pending"}</StatusBadge>}
					>
						<div className="grid gap-4">
							<DisplayField label="LID" value={proposalDraft.lid} />
							<TextField
								label="PID"
								value={proposalDraft.pid}
								onChange={(value) => setProposalDraft((current) => ({ ...current, pid: value }))}
								error={proposalErrors.pid}
								placeholder="PID-0001"
							/>
							<TextAreaField
								label="Comments"
								value={proposalDraft.comments}
								onChange={(value) => setProposalDraft((current) => ({ ...current, comments: value }))}
								placeholder="Add proposal status notes"
							/>
							<SelectField
								label="Status"
								value={proposalDraft.status}
								onChange={(value) =>
									setProposalDraft((current) => ({
										...current,
										status: value as ProposalPanelState["status"],
										otherStatus: value === "Other" ? current.otherStatus : "",
									}))
								}
								error={proposalErrors.status}
								placeholder="Select status"
								options={["Sent", "Under Review", "Not Sent", "Other"]}
							/>
							{proposalDraft.status === "Other" ? (
								<TextField
									label="Other Status"
									value={proposalDraft.otherStatus}
									onChange={(value) => setProposalDraft((current) => ({ ...current, otherStatus: value }))}
									error={proposalErrors.otherStatus}
									placeholder="Enter other status"
								/>
							) : null}
							<TextField
								label="Updated By"
								value={proposalDraft.updatedBy}
								onChange={(value) => setProposalDraft((current) => ({ ...current, updatedBy: value }))}
								error={proposalErrors.updatedBy}
								placeholder="Enter updated by"
							/>
						</div>
						<div className="mt-6 flex flex-wrap gap-3 pt-1">
							<Button variant="secondary" onClick={() => setShowProposalPreview((current) => !current)}>
								View
							</Button>
							<Button
								onClick={() => {
									const errors = validateProposalPanel(proposalDraft);
									setProposalErrors(errors);
									if (Object.keys(errors).length > 0) {
										return;
									}

									setSavedProposal(proposalDraft);
									setShowProposalPreview(true);
								}}
							>
								Submit
							</Button>
						</div>
						{showProposalPreview ? <PanelPreview title="Current Proposal Status" rows={buildProposalPreviewRows(savedProposal)} /> : null}
					</StatusPanelCard>

					<StatusPanelCard
						title="Lead Status"
						badge={<StatusBadge tone={getLeadBadgeTone(savedLead.status)}>{savedLead.status || "Pending"}</StatusBadge>}
					>
						<div className="grid gap-4">
							<DisplayField label="LID" value={leadDraft.lid} />
							<TextAreaField
								label="Comments"
								value={leadDraft.comments}
								onChange={(value) => setLeadDraft((current) => ({ ...current, comments: value }))}
								placeholder="Add lead status notes"
							/>
							<SelectField
								label="Status"
								value={leadDraft.status}
								onChange={(value) =>
									setLeadDraft((current) => ({
										...current,
										status: value as LeadStatusPanelState["status"],
										otherStatus: value === "Other" ? current.otherStatus : "",
									}))
								}
								error={leadErrors.status}
								placeholder="Select status"
								options={["Open", "Won", "Lost", "Other"]}
							/>
							{leadDraft.status === "Other" ? (
								<TextField
									label="Other Status"
									value={leadDraft.otherStatus}
									onChange={(value) => setLeadDraft((current) => ({ ...current, otherStatus: value }))}
									error={leadErrors.otherStatus}
									placeholder="Enter other status"
								/>
							) : null}
							<TextField
								label="Updated By"
								value={leadDraft.updatedBy}
								onChange={(value) => setLeadDraft((current) => ({ ...current, updatedBy: value }))}
								error={leadErrors.updatedBy}
								placeholder="Enter updated by"
							/>
						</div>
						<div className="mt-6 flex flex-wrap gap-3 pt-1">
							<Button variant="secondary" onClick={() => setShowLeadPreview((current) => !current)}>
								View
							</Button>
							<Button
								onClick={() => {
									const errors = validateLeadStatusPanel(leadDraft);
									setLeadErrors(errors);
									if (Object.keys(errors).length > 0) {
										return;
									}

									setSavedLead(leadDraft);
									setShowLeadPreview(true);
								}}
							>
								Submit
							</Button>
						</div>
						{showLeadPreview ? <PanelPreview title="Current Lead Status" rows={buildLeadStatusPreviewRows(savedLead)} /> : null}
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
					<p className="mt-2 text-sm text-slate-500">Manage this business status directly from the lead detail workflow.</p>
				</div>
				{badge}
			</div>
			<div className="mt-5 flex flex-1 flex-col">{children}</div>
		</section>
	);
}

function DisplayField({ label, value }: Readonly<{ label: string; value: string }>) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900">
				{value}
			</div>
		</div>
	);
}

function TextField({
	label,
	value,
	onChange,
	error,
	placeholder,
}: Readonly<{
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder: string;
}>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className={`h-11 w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
					error
						? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
						: "border-slate-200 bg-slate-50 focus:border-[#36B44D] focus:ring-[#36B44D]/20"
				}`}
			/>
			{error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
		</label>
	);
}

function TextAreaField({
	label,
	value,
	onChange,
	placeholder,
}: Readonly<{
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<textarea
				rows={4}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
			/>
		</label>
	);
}

function SelectField({
	label,
	value,
	onChange,
	error,
	placeholder,
	options,
}: Readonly<{
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder: string;
	options: string[];
}>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className={`h-11 w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${
					error
						? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
						: "border-slate-200 bg-slate-50 focus:border-[#36B44D] focus:ring-[#36B44D]/20"
				}`}
			>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
			{error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
		</label>
	);
}

function PanelPreview({ title, rows }: Readonly<{ title: string; rows: Array<{ label: string; value: string }> }>) {
	return (
		<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
			<p className="text-sm font-semibold text-slate-900">{title}</p>
			<div className="mt-3 grid gap-3">
				{rows.map((row) => (
					<div key={row.label} className="flex flex-col gap-1 rounded-2xl bg-white px-4 py-3 border border-slate-200">
						<span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{row.label}</span>
						<span className="text-sm text-slate-900">{row.value || "-"}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function StatusBadge({ tone, children }: Readonly<{ tone: string; children: React.ReactNode }>) {
	return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{children}</span>;
}

function createInitialLabPanelState(lead: LeadRecord): LabPanelState {
	const decision = mapLabStatusToDecision(lead.labStatus);

	return {
		lid: lead.lid,
		labId: lead.labId,
		comments: "",
		decision: decision.value,
		otherDecision: decision.otherValue,
		chemistName: "",
	};
}

function createInitialProposalPanelState(lead: LeadRecord): ProposalPanelState {
	const status = mapProposalStatusToPanelStatus(lead.proposalStatus);

	return {
		lid: lead.lid,
		pid: lead.proposalId ?? "",
		comments: "",
		status: status.value,
		otherStatus: status.otherValue,
		updatedBy: "",
	};
}

function createInitialLeadStatusPanelState(lead: LeadRecord): LeadStatusPanelState {
	return {
		lid: lead.lid,
		comments: "",
		status: lead.status,
		otherStatus: "",
		updatedBy: "",
	};
}

function validateLabPanel(state: LabPanelState) {
	const errors: Partial<Record<keyof LabPanelState, string>> = {};

	if (!state.lid.trim()) {
		errors.lid = "LID is required.";
	}
	if (!state.labId.trim()) {
		errors.labId = "LAB ID is required.";
	}
	if (!state.decision) {
		errors.decision = "Decision is required.";
	}
	if (state.decision === "Other" && !state.otherDecision.trim()) {
		errors.otherDecision = "Other Decision is required.";
	}
	if (!state.chemistName.trim()) {
		errors.chemistName = "Chemist Name is required.";
	}

	return errors;
}

function validateProposalPanel(state: ProposalPanelState) {
	const errors: Partial<Record<keyof ProposalPanelState, string>> = {};

	if (!state.lid.trim()) {
		errors.lid = "LID is required.";
	}
	if (!state.pid.trim()) {
		errors.pid = "PID is required.";
	}
	if (!state.status) {
		errors.status = "Status is required.";
	}
	if (state.status === "Other" && !state.otherStatus.trim()) {
		errors.otherStatus = "Other Status is required.";
	}
	if (!state.updatedBy.trim()) {
		errors.updatedBy = "Updated By is required.";
	}

	return errors;
}

function validateLeadStatusPanel(state: LeadStatusPanelState) {
	const errors: Partial<Record<keyof LeadStatusPanelState, string>> = {};

	if (!state.lid.trim()) {
		errors.lid = "LID is required.";
	}
	if (!state.status) {
		errors.status = "Status is required.";
	}
	if (state.status === "Other" && !state.otherStatus.trim()) {
		errors.otherStatus = "Other Status is required.";
	}
	if (!state.updatedBy.trim()) {
		errors.updatedBy = "Updated By is required.";
	}

	return errors;
}

function buildLabPreviewRows(state: LabPanelState) {
	return [
		{ label: "LID", value: state.lid },
		{ label: "LAB ID", value: state.labId },
		{ label: "Decision", value: state.decision === "Other" ? state.otherDecision : state.decision },
		{ label: "Chemist Name", value: state.chemistName },
		{ label: "Comments", value: state.comments },
	];
}

function buildProposalPreviewRows(state: ProposalPanelState) {
	return [
		{ label: "LID", value: state.lid },
		{ label: "PID", value: state.pid },
		{ label: "Status", value: state.status === "Other" ? state.otherStatus : state.status },
		{ label: "Updated By", value: state.updatedBy },
		{ label: "Comments", value: state.comments },
	];
}

function buildLeadStatusPreviewRows(state: LeadStatusPanelState) {
	return [
		{ label: "LID", value: state.lid },
		{ label: "Status", value: state.status === "Other" ? state.otherStatus : state.status },
		{ label: "Updated By", value: state.updatedBy },
		{ label: "Comments", value: state.comments },
	];
}

function mapLabStatusToDecision(status: LeadRecord["labStatus"]) {
	if (status === "Approved") {
		return { value: "Accept" as const, otherValue: "" };
	}
	if (status === "Rejected") {
		return { value: "Reject" as const, otherValue: "" };
	}
	return { value: "Not Applicable" as const, otherValue: "" };
}

function mapProposalStatusToPanelStatus(status: LeadRecord["proposalStatus"]) {
	if (status === "Sent") {
		return { value: "Sent" as const, otherValue: "" };
	}
	if (status === "Under Review") {
		return { value: "Under Review" as const, otherValue: "" };
	}
	if (status === "Not Sent" || status === "Draft") {
		return { value: "Not Sent" as const, otherValue: "" };
	}
	return { value: "Other" as const, otherValue: status };
}

function getLabBadgeTone(value: string) {
	if (value === "Accept") {
		return "bg-emerald-50 text-emerald-700";
	}
	if (value === "Reject") {
		return "bg-rose-50 text-rose-700";
	}
	return "bg-slate-100 text-slate-600";
}

function getProposalBadgeTone(value: string) {
	if (value === "Sent") {
		return "bg-sky-50 text-sky-700";
	}
	if (value === "Under Review") {
		return "bg-violet-50 text-violet-700";
	}
	return "bg-slate-100 text-slate-600";
}

function getLeadBadgeTone(value: string) {
	if (value === "Won") {
		return "bg-emerald-50 text-emerald-700";
	}
	if (value === "Lost") {
		return "bg-rose-50 text-rose-700";
	}
	return "bg-sky-50 text-sky-700";
}

function buildFallbackLead(lid: string): LeadRecord {
	return {
		date: "26-05-2026",
		leadGeneratedDate: "26-05-2026",
		lid,
		source: "Website",
		assignedTo: { name: "CRM Team", initials: "CT" },
		cid: "CID-0001",
		customerName: "Green Loop Trading LLC",
		wasteStream: "Plastic Recycling",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 0,
		unit: "Tons",
		labId: "",
		labStatus: "Pending",
		labUpdatedDate: "26-05-2026",
		proposalId: null,
		proposalStatus: "Draft",
		proposalUpdatedDate: "26-05-2026",
		status: "Open",
		leadStatusUpdatedDate: "26-05-2026",
	};
}
