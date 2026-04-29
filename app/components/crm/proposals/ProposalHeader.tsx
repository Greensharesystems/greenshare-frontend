import StatusBadge from "@/components/ui/StatusBadge";

export default function ProposalHeader() {
	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Proposal Details</p>
					<div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Green Loop Trading LLC</h1>
							<p className="mt-1 text-sm text-slate-500">PID-CID001-0001</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge status="Draft" />
							<span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
								Version v1
							</span>
						</div>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-3">
					<DetailCard label="Proposal ID" value="PID-CID001-0001" />
					<DetailCard label="Linked Lead ID" value="LID-24001" />
					<DetailCard label="Customer" value="Green Loop Trading LLC" />
				</div>
			</div>
		</section>
	);
}

function DetailCard({ label, value }: Readonly<{ label: string; value: string }>) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
			<p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
		</div>
	);
}
