"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Button from "@/app/components/ui/Button";
import useAuth from "@/app/hooks/useAuth";
import {
	getLabStatus,
	getLeadById,
	getLeadStatus,
	getProposalStatus,
	updateLabStatus,
	updateLeadStatus,
	updateProposalStatus,
	type CrmLabStatusRecord,
	type CrmLeadStatusRecord,
	type CrmProposalStatusRecord,
} from "@/app/services/crm-leads.service";
import LeadDetailsHeader from "@/components/crm/leads/LeadDetailsHeader";
import { type LeadRecord } from "@/components/crm/leads/LeadTable";

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
	const { session } = useAuth();
	const params = useParams<{ lid: string }>();
	const lid = Array.isArray(params.lid) ? (params.lid[0] ?? "") : (params.lid ?? "");
	const defaultDisplayName = session?.displayName ?? "";
	const [leadRecord, setLeadRecord] = useState<LeadRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [pageError, setPageError] = useState<string | null>(null);
	const [labDraft, setLabDraft] = useState<LabPanelState>(() => createEmptyLabPanelState(lid, defaultDisplayName));
	const [savedLab, setSavedLab] = useState<LabPanelState>(() => createEmptyLabPanelState(lid, defaultDisplayName));
	const [proposalDraft, setProposalDraft] = useState<ProposalPanelState>(() => createEmptyProposalPanelState(lid, defaultDisplayName));
	const [savedProposal, setSavedProposal] = useState<ProposalPanelState>(() => createEmptyProposalPanelState(lid, defaultDisplayName));
	const [leadDraft, setLeadDraft] = useState<LeadStatusPanelState>(() => createEmptyLeadStatusPanelState(lid, defaultDisplayName));
	const [savedLead, setSavedLead] = useState<LeadStatusPanelState>(() => createEmptyLeadStatusPanelState(lid, defaultDisplayName));
	const [labErrors, setLabErrors] = useState<Partial<Record<keyof LabPanelState, string>>>({});
	const [proposalErrors, setProposalErrors] = useState<Partial<Record<keyof ProposalPanelState, string>>>({});
	const [leadErrors, setLeadErrors] = useState<Partial<Record<keyof LeadStatusPanelState, string>>>({});
	const [labSubmitError, setLabSubmitError] = useState<string | null>(null);
	const [proposalSubmitError, setProposalSubmitError] = useState<string | null>(null);
	const [leadSubmitError, setLeadSubmitError] = useState<string | null>(null);
	const [isSavingLab, setIsSavingLab] = useState(false);
	const [isSavingProposal, setIsSavingProposal] = useState(false);
	const [isSavingLead, setIsSavingLead] = useState(false);
	const [showLabPreview, setShowLabPreview] = useState(false);
	const [showProposalPreview, setShowProposalPreview] = useState(false);
	const [showLeadPreview, setShowLeadPreview] = useState(false);

	const handleLabSubmit = useCallback(async () => {
		if (!leadRecord) {
			return;
		}

		const errors = validateLabPanel(labDraft);
		setLabErrors(errors);
		setLabSubmitError(null);
		if (Object.keys(errors).length > 0) {
			return;
		}

		const payload = {
			labId: labDraft.labId,
			decision: labDraft.decision,
			otherDecision: labDraft.otherDecision,
			comments: labDraft.comments,
			chemistName: labDraft.chemistName,
		};
		console.log("Submitting Lab Status", payload);

		setIsSavingLab(true);

		try {
			await updateLabStatus(leadRecord.lid, payload);
			const refreshedLabStatus = await getLabStatus(leadRecord.lid);
			const savedState = createInitialLabPanelState(leadRecord, refreshedLabStatus, defaultDisplayName);
			setLabDraft(savedState);
			setSavedLab(savedState);
			setShowLabPreview(true);
			console.log("Lab Status saved");
		}
		catch (error) {
			setLabSubmitError(resolveErrorMessage(error, "Unable to save the lab status right now."));
		}
		finally {
			setIsSavingLab(false);
		}
	}, [defaultDisplayName, labDraft, leadRecord]);

	const handleProposalSubmit = useCallback(async () => {
		if (!leadRecord) {
			return;
		}

		const errors = validateProposalPanel(proposalDraft);
		setProposalErrors(errors);
		setProposalSubmitError(null);
		if (Object.keys(errors).length > 0) {
			return;
		}

		const payload = {
			pid: proposalDraft.pid,
			status: proposalDraft.status,
			otherStatus: proposalDraft.otherStatus,
			comments: proposalDraft.comments,
			updatedBy: proposalDraft.updatedBy,
		};
		console.log("Submitting Proposal Status", payload);

		setIsSavingProposal(true);

		try {
			await updateProposalStatus(leadRecord.lid, payload);
			const refreshedProposalStatus = await getProposalStatus(leadRecord.lid);
			const savedState = createInitialProposalPanelState(leadRecord, refreshedProposalStatus, defaultDisplayName);
			setProposalDraft(savedState);
			setSavedProposal(savedState);
			setShowProposalPreview(true);
			console.log("Proposal Status saved");
		}
		catch (error) {
			setProposalSubmitError(resolveErrorMessage(error, "Unable to save the proposal status right now."));
		}
		finally {
			setIsSavingProposal(false);
		}
	}, [defaultDisplayName, leadRecord, proposalDraft]);

	const handleLeadStatusSubmit = useCallback(async () => {
		if (!leadRecord) {
			return;
		}

		const errors = validateLeadStatusPanel(leadDraft);
		setLeadErrors(errors);
		setLeadSubmitError(null);
		if (Object.keys(errors).length > 0) {
			return;
		}

		const payload = {
			status: leadDraft.status,
			otherStatus: leadDraft.otherStatus,
			comments: leadDraft.comments,
			updatedBy: leadDraft.updatedBy,
		};
		console.log("Submitting Lead Status", payload);

		setIsSavingLead(true);

		try {
			await updateLeadStatus(leadRecord.lid, payload);
			const refreshedLeadStatus = await getLeadStatus(leadRecord.lid);
			const savedState = createInitialLeadStatusPanelState(leadRecord, refreshedLeadStatus, defaultDisplayName);
			setLeadDraft(savedState);
			setSavedLead(savedState);
			setShowLeadPreview(true);
			console.log("Lead Status saved");
		}
		catch (error) {
			setLeadSubmitError(resolveErrorMessage(error, "Unable to save the lead status right now."));
		}
		finally {
			setIsSavingLead(false);
		}
	}, [defaultDisplayName, leadDraft, leadRecord]);

	const loadLeadDetails = useCallback(async () => {
		setIsLoading(true);
		setPageError(null);

		try {
			const [lead, labStatusRecord, proposalStatusRecord, leadStatusRecord] = await Promise.all([
				getLeadById(lid),
				getLabStatus(lid),
				getProposalStatus(lid),
				getLeadStatus(lid),
			]);

			setLeadRecord(lead);

			const nextLabState = createInitialLabPanelState(lead, labStatusRecord, defaultDisplayName);
			const nextProposalState = createInitialProposalPanelState(lead, proposalStatusRecord, defaultDisplayName);
			const nextLeadState = createInitialLeadStatusPanelState(lead, leadStatusRecord, defaultDisplayName);

			setLabDraft(nextLabState);
			setSavedLab(nextLabState);
			setProposalDraft(nextProposalState);
			setSavedProposal(nextProposalState);
			setLeadDraft(nextLeadState);
			setSavedLead(nextLeadState);
			setLabErrors({});
			setProposalErrors({});
			setLeadErrors({});
			setLabSubmitError(null);
			setProposalSubmitError(null);
			setLeadSubmitError(null);
		} catch (error) {
			setPageError(resolveErrorMessage(error, "Unable to load that lead right now."));
		} finally {
			setIsLoading(false);
		}
	}, [defaultDisplayName, lid]);

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
							<Button disabled={isSavingLab} onClick={() => void handleLabSubmit()}>
								{isSavingLab ? "Saving..." : "Submit"}
							</Button>
						</div>
						{labSubmitError ? <p className="mt-4 text-sm text-rose-600">{labSubmitError}</p> : null}
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
							<Button disabled={isSavingProposal} onClick={() => void handleProposalSubmit()}>
								{isSavingProposal ? "Saving..." : "Submit"}
							</Button>
						</div>
						{proposalSubmitError ? <p className="mt-4 text-sm text-rose-600">{proposalSubmitError}</p> : null}
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
							<Button disabled={isSavingLead} onClick={() => void handleLeadStatusSubmit()}>
								{isSavingLead ? "Saving..." : "Submit"}
							</Button>
						</div>
						{leadSubmitError ? <p className="mt-4 text-sm text-rose-600">{leadSubmitError}</p> : null}
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

function createEmptyLabPanelState(lid: string, chemistName: string): LabPanelState {
	return {
		lid,
		labId: "",
		comments: "",
		decision: "Not Applicable",
		otherDecision: "",
		chemistName,
	};
}

function createInitialLabPanelState(lead: LeadRecord, status: CrmLabStatusRecord | null, chemistName: string): LabPanelState {
	if (status) {
		return {
			lid: status.lid,
			labId: status.labId,
			comments: status.comments,
			decision: isLabDecision(status.decision) ? status.decision : "Other",
			otherDecision: status.otherDecision,
			chemistName: status.chemistName || chemistName,
		};
	}

	const decision = mapLabStatusToDecision(lead.labStatus);

	return {
		lid: lead.lid,
		labId: lead.labId || "",
		comments: "",
		decision: decision.value,
		otherDecision: decision.otherValue,
		chemistName,
	};
}

function createEmptyProposalPanelState(lid: string, updatedBy: string): ProposalPanelState {
	return {
		lid,
		pid: "",
		comments: "",
		status: "",
		otherStatus: "",
		updatedBy,
	};
}

function createInitialProposalPanelState(lead: LeadRecord, proposalStatus: CrmProposalStatusRecord | null, updatedBy: string): ProposalPanelState {
	if (proposalStatus) {
		return {
			lid: proposalStatus.lid,
			pid: proposalStatus.pid,
			comments: proposalStatus.comments,
			status: isProposalPanelStatus(proposalStatus.status) ? proposalStatus.status : "Other",
			otherStatus: proposalStatus.otherStatus,
			updatedBy: proposalStatus.updatedBy || updatedBy,
		};
	}

	const status = mapProposalStatusToPanelStatus(lead.proposalStatus);

	return {
		lid: lead.lid,
		pid: lead.proposalId ?? "",
		comments: "",
		status: status.value,
		otherStatus: status.otherValue,
		updatedBy,
	};
}

function createEmptyLeadStatusPanelState(lid: string, updatedBy: string): LeadStatusPanelState {
	return {
		lid,
		comments: "",
		status: "",
		otherStatus: "",
		updatedBy,
	};
}

function createInitialLeadStatusPanelState(lead: LeadRecord, leadStatus: CrmLeadStatusRecord | null, updatedBy: string): LeadStatusPanelState {
	if (leadStatus) {
		return {
			lid: leadStatus.lid,
			comments: leadStatus.comments,
			status: isLeadPanelStatus(leadStatus.status) ? leadStatus.status : "Other",
			otherStatus: leadStatus.otherStatus,
			updatedBy: leadStatus.updatedBy || updatedBy,
		};
	}

	return {
		lid: lead.lid,
		comments: "",
		status: lead.status,
		otherStatus: "",
		updatedBy,
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

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallbackMessage;
}

function isLabDecision(value: string): value is LabDecision {
	return value === "Accept" || value === "Reject" || value === "Not Applicable" || value === "Other";
}

function isProposalPanelStatus(value: string): value is ProposalPanelStatus {
	return value === "Sent" || value === "Under Review" || value === "Not Sent" || value === "Other";
}

function isLeadPanelStatus(value: string): value is LeadPanelStatus {
	return value === "Open" || value === "Won" || value === "Lost" || value === "Other";
}
