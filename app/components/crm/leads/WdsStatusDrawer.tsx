"use client";

import { useState } from "react";

import { updateWdsStatus, type CrmWdsStatusRecord } from "@/app/services/crm-leads.service";

type WdsStatusDrawerProps = Readonly<{
	open: boolean;
	onClose: () => void;
	lid: string;
	initialData: CrmWdsStatusRecord | null;
	onSaved: (record: CrmWdsStatusRecord) => void;
}>;

type FormState = {
	dateSubmitted: string;
	dateApproved: string;
	comments: string;
	updatedBy: string;
};

function buildInitialState(initialData: CrmWdsStatusRecord | null): FormState {
	if (initialData) {
		return {
			dateSubmitted: initialData.dateSubmitted ?? "",
			dateApproved: initialData.dateApproved ?? "",
			comments: initialData.comments,
			updatedBy: initialData.updatedBy,
		};
	}
	return { dateSubmitted: "", dateApproved: "", comments: "", updatedBy: "" };
}

export default function WdsStatusDrawer({ open, onClose, lid, initialData, onSaved }: WdsStatusDrawerProps) {
	const [form, setForm] = useState<FormState>(() => buildInitialState(initialData));
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	if (!open) {
		return null;
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setSubmitError(null);
		setIsSaving(true);

		try {
			const saved = await updateWdsStatus(lid, {
				dateSubmitted: form.dateSubmitted.trim() || null,
				dateApproved: form.dateApproved.trim() || null,
				comments: form.comments,
				updatedBy: form.updatedBy,
			});
			onSaved(saved);
			onClose();
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : "Unable to save the WDS status right now.");
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
						<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">WDS Status</h2>
						<p className="mt-1 text-sm text-slate-500">Update the WDS submission status for {lid}.</p>
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
						<DrawerTextField
							label="Date Submitted"
							value={form.dateSubmitted}
							onChange={(v) => setForm((s) => ({ ...s, dateSubmitted: v }))}
							placeholder="dd-MM-yyyy"
						/>
						<DrawerTextField
							label="Date Approved"
							value={form.dateApproved}
							onChange={(v) => setForm((s) => ({ ...s, dateApproved: v }))}
							placeholder="dd-MM-yyyy"
						/>
						<DrawerTextAreaField
							label="Comments"
							value={form.comments}
							onChange={(v) => setForm((s) => ({ ...s, comments: v }))}
							placeholder="Add WDS status notes"
						/>
						<DrawerTextField
							label="Updated By"
							value={form.updatedBy}
							onChange={(v) => setForm((s) => ({ ...s, updatedBy: v }))}
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

function DrawerTextField({ label, value, onChange, placeholder }: Readonly<{ label: string; value: string; onChange: (v: string) => void; placeholder: string }>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
			/>
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
