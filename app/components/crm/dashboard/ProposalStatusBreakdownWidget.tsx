import WidgetShell from "@/app/components/cards/WidgetShell";

type ProposalStatusItem = Readonly<{
	label: string;
	value: number;
}>;

type ProposalStatusBreakdownWidgetProps = Readonly<{
	statuses: ProposalStatusItem[];
}>;

export default function ProposalStatusBreakdownWidget({ statuses }: ProposalStatusBreakdownWidgetProps) {
	const total = statuses.reduce((sum, item) => sum + item.value, 0) || 1;

	return (
		<WidgetShell title="Proposal Status Breakdown" description="Current proposal status mix.">
			<div className="flex h-full flex-col gap-1.5">
				{statuses.map((status) => (
					<div key={status.label} className="space-y-0.5">
						<div className="flex items-center justify-between text-[10px] font-medium leading-tight text-slate-600">
							<span>{status.label}</span>
							<span>{status.value}</span>
						</div>
						<div className="h-2 rounded-full bg-slate-100">
							<div className="h-full rounded-full bg-sky-500" style={{ width: `${(status.value / total) * 100}%` }} />
						</div>
					</div>
				))}
			</div>
		</WidgetShell>
	);
}
