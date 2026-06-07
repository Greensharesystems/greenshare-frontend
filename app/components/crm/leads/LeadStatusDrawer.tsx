"use client";

import { useState } from "react";

import { updateLeadStatus, type CrmLeadStatusRecord } from "@/app/services/crm-leads.service";

type LeadPanelStatus = "Open" | "Won" | "Lost" | "Other";

type LeadStatusDrawerProps = Readonly<{
	open: boolean;
	onClose: () => void;
	lid: string;
	initialData: CrmLeadStatusRecord | null;
	onSaved: (record: CrmLeadStatusRecord) => void;
}>;

type FormState = {
	comments: string;
	status: LeadPanelStatus | "";
	otherStatus: string;
	updatedBy: string;
};

function buildInitialState(initialData: CrmLeadStatusRecord | null): FormState {
	if (initialData) {
		return {
			comments: initialData.comments,
			status: isLeadPanelStatus(initialData.status) ? initialData.status : "Other",
			otherStatus: initialData.otherStatus,
			updatedBy: initialData.updatedBy,
		};
	}
	return { comments: "", status: "", otherStatus: "", updatedBy: "" };
}

function isLeadPanelStatus(value: string): value is LeadPanelStatus {
	return value === "Open" || value === "Won" || value === "Lost" || value === "Other";
}

export default function LeadStatusDrawer({ open, onClose, lid, initialData, onSaved }: LeadStatusDrawerProps) {
	const [form, setForm] = useState<FormState>(() => buildInitialState(initialData));
	const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	if (!open) {
		return null;
	}

	function validate(): Partial<Record<keyof FormState, string>> {
		const result: Partial<Record<keyof FormState, string>> = {};
		if (!form.status) result.status = "Status is required.";
		if (form.status === "Other" && !form.otherStatus.trim()) result.otherStatus = "Other Status is required.";
		if (!form.updatedBy.trim()) result.updatedBy = "Updated By is required.";
		return result;
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const validationErrors = validate();
		setErrors(validationErrors);
		setSubmitError(null);

		if (Object.keys(validationErrors).length > 0) {
			return;
		}

		setIsSaving(true);
		try {
			const saved = await updateLeadStatus(lid, {
				status: form.status,
				otherStatus: form.otherStatus,
				comments: form.comments,
				updatedBy: form.updatedBy,
			});
			onSaved(saved);
			onClose();
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : "Unable to save the lead status right now.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
			<button type="button" aria-label="Close drawer" className="flex-1 cursor-default" onClick={onClose} />
			<div className="flex h-full w-full max-w-[44rem] flex-col border-l border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
					<div>
						<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Lead Status</h2>
						<p className="mt-1 text-sm text-slate-500">Update the lead lifecycle status for {lid}.</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
						aria-label="Close drawer"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
							<path d="M4 4 12 12M12 4 4 12" strokeLinecap="round" />
						</svg>
					</button>
				</div>

				<form onSubmit={(e) => void handleSubmit(e)} className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
					<div className="grid gap-4">
						<DrawerDisplayField label="LID" value={lid} />
						<DrawerTextAreaField
							label="Comments"
							value={form.comments}
							onChange={(v) => setForm((s) => ({ ...s, comments: v }))}
							placeholder="Add lead status notes"
						/>
						<DrawerSelectField
							label="Status"
							value={form.status}
							onChange={(v) => setForm((s) => ({ ...s, status: v as FormState["status"], otherStatus: v === "Other" ? s.otherStatus : "" }))}
							error={errors.status}
							placeholder="Select status"
							options={["Open", "Won", "Lost", "Other"]}
						/>
						{form.status === "Other" ? (
							<DrawerTextField
								label="Other Status"
								value={form.otherStatus}
								onChange={(v) => setForm((s) => ({ ...s, otherStatus: v }))}
								error={errors.otherStatus}
								placeholder="Enter other status"
							/>
						) : null}
						<DrawerTextField
							label="Updated By"
							value={form.updatedBy}
							onChange={(v) => setForm((s) => ({ ...s, updatedBy: v }))}
							error={errors.updatedBy}
							placeholder="Enter updated by"
						/>
					</div>

					{submitError ? <p className="mt-4 text-sm text-rose-600">{submitError}</p> : null}

					<div className="mt-8 flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="flex-1 rounded-2xl bg-[#36B44D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2b963f] disabled:opacity-60"
						>
							{isSaving ? "Saving..." : "Submit"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function DrawerDisplayField({ label, value }: Readonly<{ label: string; value: string }>) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900">{value}</div>
		</div>
	);
}

function DrawerTextField({ label, value, onChange, error, placeholder }: Readonly<{ label: string; value: string; onChange: (v: string) => void; error?: string; placeholder: string }>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`h-11 w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${error ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 bg-slate-50 focus:border-[#36B44D] focus:ring-[#36B44D]/20"}`}
			/>
			{error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
		</label>
	);
}

function DrawerTextAreaField({ label, value, onChange, placeholder }: Readonly<{ label: string; value: string; onChange: (v: string) => void; placeholder: string }>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<textarea
				rows={4}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
			/>
		</label>
	);
}

function DrawerSelectField({ label, value, onChange, error, placeholder, options }: Readonly<{ label: string; value: string; onChange: (v: string) => void; error?: string; placeholder: string; options: string[] }>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={`h-11 w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${error ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 bg-slate-50 focus:border-[#36B44D] focus:ring-[#36B44D]/20"}`}
			>
				<option value="">{placeholder}</option>
				{options.map((o) => (
					<option key={o} value={o}>{o}</option>
				))}
			</select>
			{error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
		</label>
	);
}
