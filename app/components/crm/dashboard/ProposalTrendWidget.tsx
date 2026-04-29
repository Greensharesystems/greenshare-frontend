import WidgetShell from "@/app/components/cards/WidgetShell";

type ProposalTrendWidgetProps = Readonly<{
	months: string[];
	values: number[];
}>;

export default function ProposalTrendWidget({ months, values }: ProposalTrendWidgetProps) {
	const points = buildLinePoints(values);

	return (
		<WidgetShell title="Proposal Trend" description="Monthly proposal activity." contentClassName="overflow-hidden">
			<div className="flex h-full flex-col gap-2">
				<div className="relative h-[5.5rem] rounded-xl bg-slate-50 p-2">
					<svg viewBox="0 0 320 120" className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
						<path d="M0 96 H320" className="stroke-slate-200" strokeWidth="1" fill="none" />
						<path d="M0 64 H320" className="stroke-slate-200" strokeWidth="1" fill="none" />
						<path d="M0 32 H320" className="stroke-slate-200" strokeWidth="1" fill="none" />
						<polyline fill="none" stroke="#0EA5E9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
					</svg>
				</div>
				<div className="grid grid-cols-6 gap-1 text-[9px] font-medium text-slate-500 xl:grid-cols-12">
					{months.map((month, index) => (
						<div key={`${month}-${index}`} className="rounded-lg bg-slate-50 px-1 py-0.5 text-center leading-tight">
							<p>{month}</p>
							<p className="text-slate-700">{values[index]}</p>
						</div>
					))}
				</div>
			</div>
		</WidgetShell>
	);
}

function buildLinePoints(values: number[]) {
	if (values.length === 0) {
		return "";
	}

	const maxValue = Math.max(...values, 1);
	return values
		.map((value, index) => {
			const x = values.length === 1 ? 160 : (index / (values.length - 1)) * 320;
			const y = 108 - (value / maxValue) * 88;
			return `${x},${y}`;
		})
		.join(" ");
}
