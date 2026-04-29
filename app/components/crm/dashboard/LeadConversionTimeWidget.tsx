import WidgetShell from "@/app/components/cards/WidgetShell";

type LeadConversionTimeWidgetProps = Readonly<{
	avgDaysToWin: string;
	avgDaysToLost: string;
	fastestConversion: string;
	slowestConversion: string;
}>;

export default function LeadConversionTimeWidget({
	avgDaysToWin,
	avgDaysToLost,
	fastestConversion,
	slowestConversion,
}: LeadConversionTimeWidgetProps) {
	const metrics = [
		{ label: "Avg Days to Win", value: avgDaysToWin },
		{ label: "Avg Days to Lost", value: avgDaysToLost },
		{ label: "Fastest Conversion", value: fastestConversion },
		{ label: "Slowest Conversion", value: slowestConversion },
	];

	return (
		<WidgetShell title="Lead Conversion Time" description="Observed conversion speed.">
			<div className="grid h-full grid-cols-2 gap-2">
				{metrics.map((metric) => (
					<div key={metric.label} className="rounded-xl bg-slate-50 p-2">
						<p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
						<p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-slate-900">{metric.value}</p>
					</div>
				))}
			</div>
		</WidgetShell>
	);
}
