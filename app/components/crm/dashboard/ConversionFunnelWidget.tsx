import WidgetShell from "@/app/components/cards/WidgetShell";

type FunnelStep = Readonly<{
	label: string;
	value: number;
}>;

type ConversionFunnelWidgetProps = Readonly<{
	steps: FunnelStep[];
}>;

export default function ConversionFunnelWidget({ steps }: ConversionFunnelWidgetProps) {
	const maxValue = Math.max(...steps.map((step) => step.value), 1);

	return (
		<WidgetShell title="Conversion Funnel" description="Lead-to-outcome progression.">
			<div className="flex h-full flex-col gap-1.5">
				{steps.map((step) => (
					<div key={step.label} className="space-y-0.5">
						<div className="flex items-center justify-between text-[10px] font-medium leading-tight text-slate-600">
							<span>{step.label}</span>
							<span>{step.value}</span>
						</div>
						<div className="h-2 rounded-full bg-slate-100">
							<div className="h-full rounded-full bg-[#36B44D]" style={{ width: `${(step.value / maxValue) * 100}%` }} />
						</div>
					</div>
				))}
			</div>
		</WidgetShell>
	);
}
