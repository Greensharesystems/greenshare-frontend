import Link from "next/link";

export type LeadStatus = "New" | "Assigned" | "Contacted" | "Won" | "Lost";

export type LeadRecord = Readonly<{
	lid: string;
	cid: string;
	customerName: string;
	serviceType: string;
	status: LeadStatus;
	createdDate: string;
}>;

export const initialLeadRows: LeadRecord[] = [
	{
		lid: "LID-24001",
		cid: "CID-10021",
		customerName: "Green Loop Trading LLC",
		serviceType: "Plastic Recycling",
		status: "New",
		createdDate: "24 Apr 2026",
	},
	{
		lid: "LID-24002",
		cid: "CID-10034",
		customerName: "Eco Source Manufacturing",
		serviceType: "E-Waste Collection",
		status: "Assigned",
		createdDate: "23 Apr 2026",
	},
	{
		lid: "LID-24003",
		cid: "CID-10041",
		customerName: "Blue Horizon Facilities",
		serviceType: "Paper Recovery",
		status: "Contacted",
		createdDate: "22 Apr 2026",
	},
];

const columns = ["LID", "CID", "Customer Name", "Service Type", "Status", "Created Date", "Actions"] as const;

const statusClasses: Record<LeadStatus, string> = {
	New: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
	Assigned: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
	Contacted: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
	Won: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
	Lost: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};


type LeadTableProps = Readonly<{
	leads: LeadRecord[];
}>;

export default function LeadTable({ leads }: LeadTableProps) {
	return (
		<div className="w-full overflow-x-auto">
			<table className="min-w-full border-collapse text-left text-sm text-slate-700">
				<thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
					<tr>
						{columns.map((column) => (
							<th key={column} className="px-4 py-3 font-semibold">
								{column}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{leads.length === 0 ? (
						<tr>
							<td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
								No leads added yet.
							</td>
						</tr>
					) : (
						leads.map((lead) => (
						<tr key={lead.lid} className="border-b border-slate-200 transition hover:bg-slate-50 last:border-b-0">
							<td className="p-4 font-medium text-slate-900">{lead.lid}</td>
							<td className="p-4 text-slate-600">{lead.cid}</td>
							<td className="p-4 text-slate-600">{lead.customerName}</td>
							<td className="p-4 text-slate-600">{lead.serviceType}</td>
							<td className="p-4">
								<span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusClasses[lead.status]].join(" ")}>
									{lead.status}
								</span>
							</td>
							<td className="p-4 text-slate-600">{lead.createdDate}</td>
							<td className="p-4">
								<div className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
									<Link href={`/employee/crm/leads/${lead.lid}`} className="transition hover:text-[#36B44D] hover:underline">
										Edit
									</Link>
									<span className="text-slate-300">|</span>
									{isOutcomeLead(lead.status) ? (
										<Link href={`/employee/crm/leads/${lead.lid}`} className="transition hover:text-[#36B44D] hover:underline">
											View
										</Link>
									) : (
										<span className="cursor-not-allowed text-slate-300">View</span>
									)}
								</div>
							</td>
						</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

function isOutcomeLead(status: LeadStatus) {
	return status === "Won" || status === "Lost";
}
