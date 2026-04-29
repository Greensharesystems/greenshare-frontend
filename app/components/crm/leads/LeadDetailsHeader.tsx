type LeadDetailsHeaderProps = Readonly<{
	lid: string;
	customerName: string;
	cid: string;
	serviceType: string;
	status: string;
	priority: string;
}>;

export default function LeadDetailsHeader({
	lid,
	customerName,
	cid,
	serviceType,
	status,
	priority,
}: LeadDetailsHeaderProps) {
	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Lead Details</p>
					<div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">{customerName}</h1>
							<p className="mt-1 text-sm text-slate-500">{lid}</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
								{status}
							</span>
							<span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
								Priority {priority}
							</span>
						</div>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-3">
					<DetailCard label="CID" value={cid} />
					<DetailCard label="Service Type" value={serviceType} />
					<DetailCard label="Lead ID" value={lid} />
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
