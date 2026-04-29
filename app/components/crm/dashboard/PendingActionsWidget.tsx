import WidgetShell from "@/app/components/cards/WidgetShell";

type PendingActionRow = Readonly<{
	lid: string;
	customer: string;
	stage: string;
	responsible: string;
	due: string;
}>;

type PendingActionsWidgetProps = Readonly<{
	rows: PendingActionRow[];
}>;

export default function PendingActionsWidget({ rows }: PendingActionsWidgetProps) {
	const visibleRows = rows.slice(0, 2);

	return (
		<WidgetShell title="Pending Actions" description="Top urgent follow-ups." contentClassName="overflow-auto">
			<table className="min-w-full border-collapse text-left text-[10px] text-slate-700">
				<thead className="border-b border-slate-200 bg-slate-50 text-[9px] uppercase tracking-[0.12em] text-slate-500">
					<tr>
						<th className="px-2 py-1.5 font-semibold">LID</th>
						<th className="px-2 py-1.5 font-semibold">Customer</th>
						<th className="px-2 py-1.5 font-semibold">Stage</th>
						<th className="px-2 py-1.5 font-semibold">Owner</th>
						<th className="px-2 py-1.5 font-semibold">Due</th>
					</tr>
				</thead>
				<tbody>
					{visibleRows.map((row) => (
						<tr key={row.lid} className="border-b border-slate-100 last:border-b-0">
							<td className="px-2 py-1.5 font-medium text-slate-900">{row.lid}</td>
							<td className="px-2 py-1.5">{row.customer}</td>
							<td className="px-2 py-1.5">{row.stage}</td>
							<td className="px-2 py-1.5">{row.responsible}</td>
							<td className="px-2 py-1.5 text-amber-700">{row.due}</td>
						</tr>
					))}
				</tbody>
			</table>
		</WidgetShell>
	);
}
