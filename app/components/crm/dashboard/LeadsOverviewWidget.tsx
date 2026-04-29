import WidgetShell from "@/app/components/cards/WidgetShell";

type LeadsOverviewWidgetProps = Readonly<{
	totalLeads: number;
	openLeads: number;
	receivedLastWeek: number;
	proposalsSentLastWeek: number;
}>;

export default function LeadsOverviewWidget({
	totalLeads,
	openLeads,
	receivedLastWeek,
	proposalsSentLastWeek,
}: LeadsOverviewWidgetProps) {
	const metrics = [
		{ label: "Total Leads", value: totalLeads },
		{ label: "Open Leads", value: openLeads },
		{ label: "Received Last Week", value: receivedLastWeek },
		{ label: "Proposals Sent", value: proposalsSentLastWeek },
	];

	return (
		<WidgetShell title="Leads Overview" description="Weekly movement across intake and pipeline activity.">
			<div className="grid h-full grid-cols-2 gap-2">
				{metrics.map((metric) => (
					<div key={metric.label} className="rounded-xl bg-slate-50 p-2">
						<p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
						<p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] leading-none text-slate-900">{metric.value}</p>
					</div>
				))}
			</div>
		</WidgetShell>
	);
}
