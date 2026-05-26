type LeadDetailsHeaderProps = Readonly<{
	leadId: string;
	customerId: string;
	customerName: string;
	wasteType: string;
	wasteClass: string;
	estimatedQuantity: string;
}>;

export default function LeadDetailsHeader({
	leadId,
	customerId,
	customerName,
	wasteType,
	wasteClass,
	estimatedQuantity,
}: LeadDetailsHeaderProps) {
	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Lead Details</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<DetailCard label="Lead ID" value={leadId} />
					<DetailCard label="Customer ID" value={customerId} />
					<DetailCard label="Customer Name" value={customerName} />
					<DetailCard label="Waste Type" value={wasteType} />
					<DetailCard label="Class" value={wasteClass} />
					<DetailCard label="Est. Qty" value={estimatedQuantity} />
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
