"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Eye, Pencil, Search, X } from "lucide-react";

import Button from "@/app/components/ui/Button";

export type LeadLifecycleStatus = "Open" | "Won" | "Lost";
export type LabStatus = "Approved" | "Pending" | "Rejected";
export type ProposalStatus = "Sent" | "Draft" | "Not Sent" | "Accepted" | "Under Review";
export type WasteClass = "Hazardous" | "Recyclable" | "Non-Hazardous";

type Assignee = Readonly<{
	name: string;
	initials: string;
}>;

export type LeadRecord = Readonly<{
	date: string;
	lid: string;
	source: string;
	assignedTo: Assignee;
	cid: string;
	customerName: string;
	wasteStream: string;
	wasteClass: WasteClass;
	estimatedQuantity: number;
	unit: string;
	labId: string;
	labStatus: LabStatus;
	proposalId: string | null;
	proposalStatus: ProposalStatus;
	status: LeadLifecycleStatus;
}>;

type LeadTableProps = Readonly<{
	leads: LeadRecord[];
}>;

type FilterState = Readonly<{
	search: string;
	source: string;
	assignedTo: string;
	status: string;
	labStatus: string;
	proposalStatus: string;
}>;

const DEFAULT_FILTERS: FilterState = {
	search: "",
	source: "All",
	assignedTo: "All",
	status: "All",
	labStatus: "All",
	proposalStatus: "All",
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20] as const;
const DATA_COLUMN_COUNT = 16;

const badgeClasses = {
	lab: {
		Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		Pending: "bg-amber-50 text-amber-700 ring-amber-200",
		Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
	},
	proposal: {
		Sent: "bg-sky-50 text-sky-700 ring-sky-200",
		Draft: "bg-slate-100 text-slate-600 ring-slate-200",
		"Not Sent": "bg-slate-100 text-slate-600 ring-slate-200",
		Accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		"Under Review": "bg-violet-50 text-violet-700 ring-violet-200",
	},
	status: {
		Open: "bg-sky-50 text-sky-700 ring-sky-200",
		Won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		Lost: "bg-rose-50 text-rose-700 ring-rose-200",
	},
	class: {
		Hazardous: "bg-rose-50 text-rose-700 ring-rose-200",
		Recyclable: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		"Non-Hazardous": "bg-sky-50 text-sky-700 ring-sky-200",
	},
} as const;

const sourceOptions = ["All", "Website", "Referral", "Sales Visit", "WhatsApp", "Existing Client"];

export const initialLeadRows: LeadRecord[] = [
	{
		date: "07-05-2026",
		lid: "LID-0001",
		source: "Website",
		assignedTo: { initials: "AK", name: "Ahmed Khan" },
		cid: "CID-0001",
		customerName: "Green Loop Trading",
		wasteStream: "Solvent Foam",
		wasteClass: "Hazardous",
		estimatedQuantity: 50,
		unit: "Tons",
		labId: "LAB-0001",
		labStatus: "Approved",
		proposalId: "PID-0001",
		proposalStatus: "Sent",
		status: "Open",
	},
	{
		date: "08-05-2026",
		lid: "LID-0002",
		source: "Referral",
		assignedTo: { initials: "SA", name: "Sara Ali" },
		cid: "CID-0002",
		customerName: "Blue Star Industries",
		wasteStream: "Oily Sludge",
		wasteClass: "Hazardous",
		estimatedQuantity: 120,
		unit: "Drums",
		labId: "LAB-0002",
		labStatus: "Pending",
		proposalId: null,
		proposalStatus: "Draft",
		status: "Open",
	},
	{
		date: "09-05-2026",
		lid: "LID-0003",
		source: "Sales Visit",
		assignedTo: { initials: "IG", name: "Imran Gill" },
		cid: "CID-0003",
		customerName: "Emirates Marine",
		wasteStream: "Scrap Plastic",
		wasteClass: "Recyclable",
		estimatedQuantity: 18,
		unit: "Tons",
		labId: "LAB-0003",
		labStatus: "Approved",
		proposalId: "PID-0002",
		proposalStatus: "Accepted",
		status: "Won",
	},
	{
		date: "10-05-2026",
		lid: "LID-0004",
		source: "WhatsApp",
		assignedTo: { initials: "LT", name: "Lab Team" },
		cid: "CID-0004",
		customerName: "Gulf Chemicals",
		wasteStream: "Chemical Residue",
		wasteClass: "Hazardous",
		estimatedQuantity: 7,
		unit: "IBCs",
		labId: "LAB-0004",
		labStatus: "Rejected",
		proposalId: null,
		proposalStatus: "Not Sent",
		status: "Lost",
	},
	{
		date: "11-05-2026",
		lid: "LID-0005",
		source: "Existing Client",
		assignedTo: { initials: "FT", name: "Finance Team" },
		cid: "CID-0005",
		customerName: "Desert Recycling",
		wasteStream: "Mixed Paper",
		wasteClass: "Non-Hazardous",
		estimatedQuantity: 32,
		unit: "Tons",
		labId: "LAB-0005",
		labStatus: "Approved",
		proposalId: "PID-0003",
		proposalStatus: "Under Review",
		status: "Open",
	},
	{
		date: "12-05-2026",
		lid: "LID-0006",
		source: "Website",
		assignedTo: { initials: "OM", name: "Omar Malik" },
		cid: "CID-0006",
		customerName: "Metro Polymers",
		wasteStream: "PET Flakes",
		wasteClass: "Recyclable",
		estimatedQuantity: 24,
		unit: "Tons",
		labId: "LAB-0006",
		labStatus: "Pending",
		proposalId: "PID-0004",
		proposalStatus: "Sent",
		status: "Open",
	},
	{
		date: "13-05-2026",
		lid: "LID-0007",
		source: "Referral",
		assignedTo: { initials: "NK", name: "Noor Khan" },
		cid: "CID-0007",
		customerName: "Arabian Logistics",
		wasteStream: "Packaging Cardboard",
		wasteClass: "Recyclable",
		estimatedQuantity: 40,
		unit: "Bales",
		labId: "LAB-0007",
		labStatus: "Approved",
		proposalId: "PID-0005",
		proposalStatus: "Accepted",
		status: "Won",
	},
	{
		date: "14-05-2026",
		lid: "LID-0008",
		source: "Sales Visit",
		assignedTo: { initials: "RA", name: "Rashid Ahmed" },
		cid: "CID-0008",
		customerName: "Gulf Food Works",
		wasteStream: "Organic Slurry",
		wasteClass: "Non-Hazardous",
		estimatedQuantity: 15,
		unit: "Tanks",
		labId: "LAB-0008",
		labStatus: "Rejected",
		proposalId: null,
		proposalStatus: "Draft",
		status: "Lost",
	},
];
export default function LeadTable({ leads }: LeadTableProps) {
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
	const [rowsPerPage, setRowsPerPage] = useState<(typeof ROWS_PER_PAGE_OPTIONS)[number]>(10);
	const [currentPage, setCurrentPage] = useState(1);

	const assignedToOptions = useMemo(() => {
		return ["All", ...Array.from(new Set(leads.map((lead) => lead.assignedTo.name)))];
	}, [leads]);

	const filteredLeads = useMemo(() => {
		const normalizedSearch = filters.search.trim().toLowerCase();

		return leads.filter((lead) => {
			const matchesSearch =
				normalizedSearch.length === 0 ||
				[lead.lid, lead.customerName, lead.wasteStream].some((value) => value.toLowerCase().includes(normalizedSearch));

			return (
				matchesSearch &&
				(filters.source === "All" || lead.source === filters.source) &&
				(filters.assignedTo === "All" || lead.assignedTo.name === filters.assignedTo) &&
				(filters.status === "All" || lead.status === filters.status) &&
				(filters.labStatus === "All" || lead.labStatus === filters.labStatus) &&
				(filters.proposalStatus === "All" || lead.proposalStatus === filters.proposalStatus)
			);
		});
	}, [filters, leads]);

	const totalPages = Math.max(1, Math.ceil(filteredLeads.length / rowsPerPage));
	const safePage = Math.min(currentPage, totalPages);
	const startIndex = (safePage - 1) * rowsPerPage;
	const endIndex = Math.min(startIndex + rowsPerPage, filteredLeads.length);
	const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
	const visiblePageNumbers = buildPageNumbers(totalPages, safePage);

	function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
		setFilters((current) => ({
			...current,
			[key]: value,
		}));
		setCurrentPage(1);
	}

	function clearFilters() {
		setFilters(DEFAULT_FILTERS);
		setCurrentPage(1);
	}

	function exportVisibleRows() {
		const header = [
			"Date",
			"LID",
			"Source",
			"Assigned To",
			"CID",
			"Customer Name",
			"Waste Stream",
			"Class",
			"Est. Qty",
			"Unit",
			"Lab ID",
			"Lab Status",
			"PID",
			"Proposal Status",
			"Status",
		];

		const rows = filteredLeads.map((lead) => [
			lead.date,
			lead.lid,
			lead.source,
			lead.assignedTo.name,
			lead.cid,
			lead.customerName,
			lead.wasteStream,
			lead.wasteClass,
			String(lead.estimatedQuantity),
			lead.unit,
			lead.labId,
			lead.labStatus,
			lead.proposalId ?? "-",
			lead.proposalStatus,
			lead.status,
		]);

		const csv = [header, ...rows]
			.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
			.join("\n");

		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "crm-leads.csv";
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="overflow-x-auto pb-1">
				<div className="flex min-w-max flex-wrap items-end gap-3 xl:flex-nowrap">
					<label className="flex w-[18rem] shrink-0 flex-col gap-1.5">
							<span className="text-[11px] font-semibold text-slate-500">Search</span>
							<div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#36B44D] focus-within:ring-4 focus-within:ring-[#36B44D]/10">
								<Search className="h-3.5 w-3.5 text-slate-400" />
								<input
									type="search"
									value={filters.search}
									onChange={(event) => updateFilter("search", event.target.value)}
									placeholder="Search by LID, Customer, Waste Stream"
									className="w-full border-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
								/>
							</div>
						</label>
					<FilterSelect className="w-38 shrink-0" label="Source" value={filters.source} onChange={(value) => updateFilter("source", value)} options={sourceOptions} />
					<FilterSelect className="w-40 shrink-0" label="Assigned To" value={filters.assignedTo} onChange={(value) => updateFilter("assignedTo", value)} options={assignedToOptions} />
					<FilterSelect className="w-35 shrink-0" label="Status" value={filters.status} onChange={(value) => updateFilter("status", value)} options={["All", "Open", "Won", "Lost"]} />
					<FilterSelect className="w-38 shrink-0" label="Lab Status" value={filters.labStatus} onChange={(value) => updateFilter("labStatus", value)} options={["All", "Approved", "Pending", "Rejected"]} />
					<FilterSelect className="w-40 shrink-0" label="Proposal Status" value={filters.proposalStatus} onChange={(value) => updateFilter("proposalStatus", value)} options={["All", "Sent", "Draft", "Not Sent", "Accepted", "Under Review"]} />
					<div className="flex shrink-0 items-end gap-2 xl:ml-auto">
						<Button variant="secondary" size="sm" className="min-h-9 rounded-xl px-3 text-[12px]" onClick={exportVisibleRows}>
							<Download className="h-3.5 w-3.5" />
							Export
						</Button>
						<Button variant="secondary" size="sm" className="min-h-9 rounded-xl px-3 text-[12px]" onClick={clearFilters}>
							<X className="h-3.5 w-3.5" />
							Clear Filters
						</Button>
					</div>
				</div>
			</div>

			<div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white">
				<div className="w-full overflow-x-auto">
					<table className="min-w-362.5 border-separate border-spacing-0 text-left text-[12.5px] text-slate-700">
						<colgroup>
							<col className="w-21" />
							<col className="w-23" />
							<col className="w-25.5" />
							<col className="w-34.5" />
							<col className="w-23" />
							<col className="w-36.5" />
							<col className="w-31" />
							<col className="w-24.5" />
							<col className="w-19.5" />
							<col className="w-16" />
							<col className="w-24" />
							<col className="w-22" />
							<col className="w-24" />
							<col className="w-27.5" />
							<col className="w-22" />
							<col className="w-21" />
						</colgroup>
						<thead className="sticky top-0 z-10 bg-slate-50">
							<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
								<HeaderCell rowSpan={2} label="Date" />
								<HeaderCell rowSpan={2} label="LID" linked />
								<HeaderCell rowSpan={2} label="Source" />
								<HeaderCell rowSpan={2} label="Assigned To" />
								<HeaderCell rowSpan={2} label="CID" linked />
								<HeaderCell rowSpan={2} label="Customer Name" />
								<HeaderCell rowSpan={2} label="Waste Stream" />
								<HeaderCell rowSpan={2} label="Class" />
								<HeaderCell rowSpan={2} label="Est. Qty" />
								<HeaderCell rowSpan={2} label="Unit" />
								<GroupHeader label="Lab Status" colSpan={2} />
								<GroupHeader label="Proposal Status" colSpan={2} />
								<HeaderCell rowSpan={2} label="Status" />
								<HeaderCell rowSpan={2} label="Actions" centered />
							</tr>
							<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
								<HeaderCell label="Lab ID" linked />
								<HeaderCell label="Status" />
								<HeaderCell label="PID" linked />
								<HeaderCell label="Status" />
							</tr>
						</thead>
						<tbody>
							{paginatedLeads.length === 0 ? (
								<tr>
									<td colSpan={DATA_COLUMN_COUNT} className="px-4 py-10 text-center text-sm text-slate-500">
										No leads match the current filters.
									</td>
								</tr>
							) : (
								paginatedLeads.map((lead) => (
									<tr key={lead.lid} className="bg-white transition hover:bg-slate-50/80">
										<DataCell>{lead.date}</DataCell>
										<DataCell>
											<RecordLink href={`/employee/crm/leads/${lead.lid}`} value={lead.lid} />
										</DataCell>
										<DataCell>{lead.source}</DataCell>
										<DataCell>
											<div className="flex items-center gap-2 whitespace-nowrap">
												<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white">{lead.assignedTo.initials}</span>
												<span className="truncate">{lead.assignedTo.name}</span>
											</div>
										</DataCell>
										<DataCell>
											<RecordLink href={`/employee/crm/leads/${lead.lid}`} value={lead.cid} />
										</DataCell>
										<DataCell className="max-w-36.5 truncate">{lead.customerName}</DataCell>
										<DataCell className="max-w-31 truncate">{lead.wasteStream}</DataCell>
										<DataCell>
											<Badge tone={badgeClasses.class[lead.wasteClass]}>{lead.wasteClass}</Badge>
										</DataCell>
										<DataCell>{lead.estimatedQuantity}</DataCell>
										<DataCell>{lead.unit}</DataCell>
										<DataCell>
											<RecordLink href={`/employee/crm/leads/${lead.lid}`} value={lead.labId} />
										</DataCell>
										<DataCell>
											<Badge tone={badgeClasses.lab[lead.labStatus]}>{lead.labStatus}</Badge>
										</DataCell>
										<DataCell>
											{lead.proposalId ? <RecordLink href={`/employee/crm/leads/${lead.lid}`} value={lead.proposalId} /> : <span className="text-slate-400">-</span>}
										</DataCell>
										<DataCell className="border-r-2 border-slate-300">
											<Badge tone={badgeClasses.proposal[lead.proposalStatus]}>{lead.proposalStatus}</Badge>
										</DataCell>
										<DataCell>
											<Badge tone={badgeClasses.status[lead.status]}>{lead.status}</Badge>
										</DataCell>
										<DataCell centered>
											<div className="flex items-center justify-center gap-1.5">
												<ActionLink href={`/employee/crm/leads/${lead.lid}`} label="View">
													<Eye className="h-3.5 w-3.5" />
												</ActionLink>
												{lead.status === "Open" ? (
													<ActionLink href={`/employee/crm/leads/${lead.lid}`} label="Edit">
														<Pencil className="h-3.5 w-3.5" />
													</ActionLink>
												) : null}
											</div>
										</DataCell>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 text-[12px] text-slate-500 md:flex-row md:items-center md:justify-between">
					<p>
						Showing {filteredLeads.length === 0 ? 0 : startIndex + 1} to {endIndex} of {filteredLeads.length} leads
					</p>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<label className="flex items-center gap-2">
							<span>Rows per page</span>
							<select
								value={rowsPerPage}
								onChange={(event) => {
									setRowsPerPage(Number(event.target.value) as (typeof ROWS_PER_PAGE_OPTIONS)[number]);
									setCurrentPage(1);
								}}
								className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
							>
								{ROWS_PER_PAGE_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</label>
						<div className="flex items-center gap-1">
							<PaginationButton label="Previous page" disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
								<ChevronLeft className="h-4 w-4" />
							</PaginationButton>
							{visiblePageNumbers.map((pageNumber) => (
								<button
									key={pageNumber}
									type="button"
									onClick={() => setCurrentPage(pageNumber)}
									className={joinClasses(
										"inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-[12px] font-medium transition",
										pageNumber === safePage
											? "border-[#36B44D] bg-[#36B44D] text-white shadow-[0_10px_18px_rgba(54,180,77,0.16)]"
											: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
									)}
								>
									{pageNumber}
								</button>
							))}
							<PaginationButton label="Next page" disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
								<ChevronRight className="h-4 w-4" />
							</PaginationButton>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function HeaderCell({ label, rowSpan, linked = false, centered = false }: Readonly<{ label: string; rowSpan?: number; linked?: boolean; centered?: boolean }>) {
	return (
		<th
			rowSpan={rowSpan}
			className={joinClasses(
				"border-b border-r border-slate-200 bg-slate-50 px-2.5 py-2.5 align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 last:border-r-0",
				label === "Status" && rowSpan === 2 ? "border-l-2 border-slate-300" : undefined,
				centered ? "text-center" : "text-left",
			)}
		>
			<div className={joinClasses("flex items-center gap-1.5", centered ? "justify-center" : "justify-start", linked ? "text-slate-700" : undefined)}>
				<span>{label}</span>
				<ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
			</div>
		</th>
	);
}

function GroupHeader({ label, colSpan }: Readonly<{ label: string; colSpan: number }>) {
	return (
		<th colSpan={colSpan} className="border-b border-r border-slate-200 bg-slate-50 px-2.5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 last:border-r-0">
			<div className="flex items-center justify-center gap-1.5">
				<span>{label}</span>
				<ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
			</div>
		</th>
	);
}

function DataCell({ children, centered = false, className }: Readonly<{ children: React.ReactNode; centered?: boolean; className?: string }>) {
	return <td className={joinClasses("border-b border-r border-slate-200 px-2.5 py-2.5 align-middle text-[12.5px] text-slate-700 whitespace-nowrap last:border-r-0", centered ? "text-center" : "text-left", className)}>{children}</td>;
}

function Badge({ children, tone }: Readonly<{ children: React.ReactNode; tone: string }>) {
	return <span className={joinClasses("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap ring-1 ring-inset", tone)}>{children}</span>;
}

function RecordLink({ href, value }: Readonly<{ href: string; value: string }>) {
	return (
		<Link href={href} className="font-semibold whitespace-nowrap text-[#36B44D] transition hover:text-[#2b963f] hover:underline">
			{value}
		</Link>
	);
}

function ActionLink({ href, label, children }: Readonly<{ href: string; label: string; children: React.ReactNode }>) {
	return (
		<Link
			href={href}
			aria-label={label}
			title={label}
			className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-[#36B44D]"
		>
			{children}
		</Link>
	);
}

function FilterSelect({ label, value, options, onChange, className }: Readonly<{ label: string; value: string; options: ReadonlyArray<string>; onChange: (value: string) => void; className?: string }>) {
	return (
		<label className={joinClasses("flex flex-col gap-1.5", className)}>
			<span className="text-[11px] font-semibold text-slate-500">{label}</span>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
			>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</label>
	);
}

function PaginationButton({ label, disabled, onClick, children }: Readonly<{ label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }>) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onClick}
			disabled={disabled}
			className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{children}
		</button>
	);
}

function buildPageNumbers(totalPages: number, currentPage: number) {
	const start = Math.max(1, currentPage - 1);
	const end = Math.min(totalPages, start + 2);
	const adjustedStart = Math.max(1, end - 2);
	const pages: number[] = [];

	for (let page = adjustedStart; page <= end; page += 1) {
		pages.push(page);
	}

	return pages;
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
