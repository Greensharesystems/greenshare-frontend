import WidgetShell from "@/app/components/cards/WidgetShell";

type CustomerOverviewWidgetProps = Readonly<{
	totalCustomers: number;
	activeCustomers: number;
	newCustomersThisMonth: number;
}>;

export default function CustomerOverviewWidget({
	totalCustomers,
	activeCustomers,
	newCustomersThisMonth,
}: CustomerOverviewWidgetProps) {
	return (
		<WidgetShell title="Customer Overview" description="Portfolio health and recent account growth.">
			<div className="grid h-full grid-cols-3 gap-2">
				<MetricCard label="Total Customers" value={String(totalCustomers)} tone="slate" />
				<MetricCard label="Active Customers" value={String(activeCustomers)} tone="green" />
				<MetricCard label="New This Month" value={String(newCustomersThisMonth)} tone="blue" />
			</div>
		</WidgetShell>
	);
}

function MetricCard({ label, value, tone }: Readonly<{ label: string; value: string; tone: "slate" | "green" | "blue" }>) {
	const toneClasses = {
		slate: "bg-slate-50 text-slate-900",
		green: "bg-emerald-50 text-emerald-700",
		blue: "bg-sky-50 text-sky-700",
	}[tone];

	return (
		<div className={["rounded-xl p-2", toneClasses].join(" ")}>
			<p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
			<p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] leading-none">{value}</p>
		</div>
	);
}
