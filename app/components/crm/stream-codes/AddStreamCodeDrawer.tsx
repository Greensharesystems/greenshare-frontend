"use client";

import { useEffect, useMemo, useState } from "react";

import {
	STREAM_CODE_CATEGORIES,
	STREAM_CODE_STATUSES,
	getNextStreamCode,
	type StreamCodeCategory,
	type StreamCodePayload,
	type StreamCodeRecord,
	type StreamCodeStatus,
} from "@/app/services/stream-codes.service";


type AddStreamCodeDrawerProps = Readonly<{
	open: boolean;
	mode: "create" | "edit";
	initialData?: StreamCodeRecord | null;
	onClose: () => void;
	onSave: (payload: StreamCodePayload) => Promise<void>;
}>;

type FormState = {
	category: StreamCodeCategory | "";
	streamCode: string;
	streamName: string;
	description: string;
	status: StreamCodeStatus;
};

const EMPTY_FORM: FormState = {
	category: "",
	streamCode: "",
	streamName: "",
	description: "",
	status: "Active",
};


export default function AddStreamCodeDrawer({ open, mode, initialData, onClose, onSave }: AddStreamCodeDrawerProps) {
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const title = mode === "edit" ? "Edit Stream Code" : "Add Stream Code";
	const isEdit = mode === "edit";
	const canSubmit = useMemo(() => Boolean(form.category && form.streamCode.trim() && form.streamName.trim()), [form.category, form.streamCode, form.streamName]);

	useEffect(() => {
		if (!open) return;

		setError(null);
		if (initialData) {
			setForm({
				category: initialData.category,
				streamCode: initialData.streamCode,
				streamName: initialData.streamName,
				description: initialData.description,
				status: initialData.status,
			});
			return;
		}

		setForm(EMPTY_FORM);
	}, [initialData, open]);

	if (!open) {
		return null;
	}

	async function handleCategoryChange(category: StreamCodeCategory | "") {
		setForm((current) => ({ ...current, category, streamCode: isEdit ? current.streamCode : "" }));
		setError(null);

		if (!category || isEdit) return;

		setIsGenerating(true);
		try {
			const nextCode = await getNextStreamCode(category);
			setForm((current) => ({ ...current, streamCode: nextCode }));
		} catch (error) {
			setError(resolveErrorMessage(error, "Unable to generate the Stream Code."));
		} finally {
			setIsGenerating(false);
		}
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!form.category || !canSubmit || isSaving) return;

		setIsSaving(true);
		setError(null);
		try {
			await onSave({
				category: form.category,
				streamCode: form.streamCode.trim(),
				streamName: form.streamName.trim(),
				description: form.description.trim() || null,
				status: form.status,
			});
			onClose();
		} catch (error) {
			setError(resolveErrorMessage(error, "Unable to save Stream Code."));
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
			<button type="button" aria-label="Close Stream Code drawer" className="flex-1 cursor-default" onClick={onClose} />
			<div className="flex h-full w-full max-w-[34rem] translate-x-0 transform flex-col border-l border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out">
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
					<div>
						<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
						<p className="mt-1 text-sm text-slate-500">Manage CRM stream code master data.</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
						aria-label="Close Stream Code drawer"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
							<path d="M4 4 12 12M12 4 4 12" strokeLinecap="round" />
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
					<div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
						{error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

						<label className="flex flex-col gap-1.5">
							<span className="text-[12px] font-semibold text-slate-600">Category</span>
							<select
								value={form.category}
								onChange={(event) => void handleCategoryChange(event.target.value as StreamCodeCategory | "")}
								className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
								required
							>
								<option value="">Select category</option>
								{STREAM_CODE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
							</select>
						</label>

						<label className="flex flex-col gap-1.5">
							<span className="text-[12px] font-semibold text-slate-600">Stream Code</span>
							<input
								value={isGenerating ? "Generating..." : form.streamCode}
								readOnly
								className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none"
								placeholder="Select a category"
							/>
						</label>

						<label className="flex flex-col gap-1.5">
							<span className="text-[12px] font-semibold text-slate-600">Stream Name</span>
							<input
								value={form.streamName}
								onChange={(event) => setForm((current) => ({ ...current, streamName: event.target.value }))}
								className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
								placeholder="e.g. Paint Cans"
								required
							/>
						</label>

						<label className="flex flex-col gap-1.5">
							<span className="text-[12px] font-semibold text-slate-600">Description</span>
							<textarea
								value={form.description}
								onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
								className="min-h-28 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
								placeholder="Optional notes"
							/>
						</label>

						<label className="flex flex-col gap-1.5">
							<span className="text-[12px] font-semibold text-slate-600">Status</span>
							<select
								value={form.status}
								onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StreamCodeStatus }))}
								className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
							>
								{STREAM_CODE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
							</select>
						</label>
					</div>

					<div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
						<button type="button" onClick={onClose} disabled={isSaving} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">Cancel</button>
						<button type="submit" disabled={!canSubmit || isSaving || isGenerating} className="rounded-2xl border border-[#36B44D] bg-[#36B44D] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(54,180,77,0.22)] transition hover:bg-[#2f9f45] disabled:cursor-not-allowed disabled:opacity-60">
							{isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Stream Code"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}


function resolveErrorMessage(error: unknown, fallbackMessage: string) {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallbackMessage;
}
