"use client";

import LeadForm, { type LeadFormData } from "@/components/crm/leads/LeadForm";

type AddLeadDrawerProps = Readonly<{
	open: boolean;
	onClose: () => void;
	onCreateLead: (leadData: LeadFormData) => void;
}>;

export default function AddLeadDrawer({ open, onClose, onCreateLead }: AddLeadDrawerProps) {
	if (!open) {
		return null;
	}

	function handleCreateLead(leadData: LeadFormData) {
		onCreateLead(leadData);
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
			<button type="button" aria-label="Close add lead drawer" className="flex-1 cursor-default" onClick={onClose} />
			<div className="flex h-full w-full max-w-2xl translate-x-0 transform flex-col border-l border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out">
				<div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
					<div className="flex flex-col gap-1.5">
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Business Growth</p>
						<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Add Lead</h2>
						<p className="text-sm text-slate-500">Capture a new opportunity and assign the right service requirements.</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
						aria-label="Close add lead drawer"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
							<path d="M4 4 12 12M12 4 4 12" strokeLinecap="round" />
						</svg>
					</button>
				</div>

				<LeadForm onSubmit={handleCreateLead} onCancel={onClose} />
			</div>
		</div>
	);
}
