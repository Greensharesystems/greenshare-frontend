import Button from "@/app/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

type LeadPanelMode = "readOnly" | "editable" | "disabled";

type LeadOutcomePanelProps = Readonly<{
	mode?: LeadPanelMode;
}>;

export default function LeadOutcomePanel({ mode = "editable" }: LeadOutcomePanelProps) {
	const isReadOnly = mode === "readOnly";
	const isDisabled = mode === "disabled";
	const actionsDisabled = mode !== "editable";
	const mainStatus = "Open";
	const openSubStatus = "Proposal Sent";
	const openHelperText = "Waiting for customer response";
	const openStatusDate = "25 Apr 2026";

	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Outcome</p>
					<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Lead Outcome</h2>
					<p className="max-w-3xl text-sm text-slate-500">
						Track the current commercial outcome and next progress state for this lead.
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<DetailCard label="Main Status">
						<StatusBadge status={mainStatus} />
					</DetailCard>
					<DetailCard label="Status Date">
						<p className="text-sm font-medium text-slate-900">{openStatusDate}</p>
					</DetailCard>
				</div>

				{mainStatus === "Open" ? (
					<div className="grid gap-4 md:grid-cols-2">
						<DetailCard label="Sub-status">
							<p className="text-sm font-medium text-slate-900">{openSubStatus}</p>
						</DetailCard>
						<DetailCard label="Description">
							<p className="text-sm text-slate-600">{openHelperText}</p>
						</DetailCard>
					</div>
				) : null}

				<div className="flex flex-wrap gap-3 pt-1">
					<Button disabled={actionsDisabled}>Mark as Won</Button>
					<Button variant="secondary" disabled={actionsDisabled}>Mark as Lost</Button>
				</div>

				{isReadOnly ? <p className="text-xs text-slate-500">Read-only mode: outcome details can be reviewed but not updated.</p> : null}
				{isDisabled ? <p className="text-xs text-slate-500">Preview mode: outcome details are visible but actions are unavailable.</p> : null}
			</div>
		</section>
	);
}

function DetailCard({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
			<div className="mt-2">{children}</div>
		</div>
	);
}
