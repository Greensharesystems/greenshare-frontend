import WidgetShell from "@/app/components/cards/WidgetShell";

type OutcomeValueWidgetProps = Readonly<{
	wonLeadsValue: string;
	lostLeadsValue: string;
	winRate: string;
	lostRate: string;
}>;

export default function OutcomeValueWidget({
	wonLeadsValue,
	lostLeadsValue,
	winRate,
	lostRate,
}: OutcomeValueWidgetProps) {
	return (
		<WidgetShell title="Outcome Value" description="Won vs lost commercial performance.">
			<div className="grid h-full grid-cols-2 gap-2">
				<OutcomeCard label="Won Leads Value" value={wonLeadsValue} tone="green" />
				<OutcomeCard label="Lost Leads Value" value={lostLeadsValue} tone="red" />
				<OutcomeCard label="Win Rate" value={winRate} tone="green" />
				<OutcomeCard label="Lost Rate" value={lostRate} tone="red" />
			</div>
		</WidgetShell>
	);
}

function OutcomeCard({ label, value, tone }: Readonly<{ label: string; value: string; tone: "green" | "red" }>) {
	const valueClassName = tone === "green" ? "text-emerald-700" : "text-rose-700";

	return (
		<div className="rounded-xl bg-slate-50 p-2">
			<p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
			<p className={["mt-1.5 text-sm font-semibold tracking-[-0.02em] leading-tight", valueClassName].join(" ")}>{value}</p>
		</div>
	);
}
