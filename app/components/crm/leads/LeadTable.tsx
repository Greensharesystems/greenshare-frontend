"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil, Search, Trash2, X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import LabStatusDrawer from "@/components/crm/leads/LabStatusDrawer";
import LeadStatusDrawer from "@/components/crm/leads/LeadStatusDrawer";
import ProposalStatusDrawer from "@/components/crm/leads/ProposalStatusDrawer";
import WdsStatusDrawer from "@/components/crm/leads/WdsStatusDrawer";
import type { CrmLabStreamStatusRecord, CrmLeadStatusRecord, CrmProposalStatusRecord, CrmWdsStatusRecord } from "@/app/services/crm-leads.service";

export type LeadLifecycleStatus = "Open" | "Won" | "Lost" | "Other";
export type LabStatus = "Accept" | "Reject" | "Not Applicable" | "Other" | "Pending" | "Approved" | "Rejected";
export type ProposalStatus = "Pending" | "Sent" | "Draft" | "Not Sent" | "Accepted" | "Under Review" | "Other";
export type WasteClass = "Hazardous" | "Recyclable" | "Non-Hazardous" | "Others";

type Assignee = Readonly<{
	name: string;
	initials: string;
}>;

export type LeadRecord = Readonly<{
	date: string;
	leadGeneratedDate: string;
	lid: string;
	streamNo: string | null;
	source: string;
	assignedTo: Assignee;
	cid: string;
	customerName: string;
	wasteStream: string;
	wasteClass: WasteClass;
	otherWasteClass?: string | null;
	estimatedQuantity: number;
	unit: string;
	labStatus: LabStatus;
	labStatusDays: number;
	labUpdatedDate: string;
	proposalStatus: ProposalStatus;
	proposalStatusDays: number;
	proposalUpdatedDate: string;
	status: LeadLifecycleStatus;
	leadStatusDays: number;
	leadStatusUpdatedDate: string;
	wdsDateSubmitted: string | null;
	wdsStatus: string;
	wdsDateApproved: string | null;
	wdsStatusDays: number | null;
	wdsNo: string | null;
}>;

type BaseLeadRecord = Omit<LeadRecord, "leadGeneratedDate" | "labUpdatedDate" | "proposalUpdatedDate" | "leadStatusUpdatedDate" | "wdsDateSubmitted" | "wdsStatus" | "wdsDateApproved" | "wdsStatusDays" | "wdsNo">;

type LeadTableProps = Readonly<{
	leads: LeadRecord[];
	linkBase?: string;
	onRemove?: (lid: string) => void;
	showExport?: boolean;
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

const ROWS_PER_PAGE_OPTIONS = [20, 10, 5] as const;
const DATA_COLUMN_COUNT = 23;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const LAB_STATUS_DAY_OFFSETS = [3, 2, 4, 1, 5, 2, 6, 1, 3, 4, 7, 1, 5, 2, 4, 6, 1, 2, 3, 4] as const;
const PROPOSAL_STATUS_DAY_OFFSETS = [8, 4, 6, 2, 7, 5, 8, 3, 6, 5, 7, 2, 6, 4, 5, 8, 2, 3, 4, 5] as const;
const LEAD_STATUS_DAY_OFFSETS = [13, 6, 9, 3, 10, 7, 11, 4, 8, 9, 12, 3, 10, 6, 7, 11, 3, 5, 6, 7] as const;

const badgeClasses = {
	lab: {
		Accept: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		"Not Applicable": "bg-slate-100 text-slate-600 ring-slate-200",
		Other: "bg-slate-100 text-slate-600 ring-slate-200",
		Pending: "bg-amber-50 text-amber-700 ring-amber-200",
		Reject: "bg-rose-50 text-rose-700 ring-rose-200",
		Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
	},
	proposal: {
		Pending: "bg-amber-50 text-amber-700 ring-amber-200",
		Sent: "bg-sky-50 text-sky-700 ring-sky-200",
		Draft: "bg-slate-100 text-slate-600 ring-slate-200",
		"Not Sent": "bg-slate-100 text-slate-600 ring-slate-200",
		Accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		Other: "bg-slate-100 text-slate-600 ring-slate-200",
		"Under Review": "bg-violet-50 text-violet-700 ring-violet-200",
	},
	status: {
		Other: "bg-slate-100 text-slate-600 ring-slate-200",
		Open: "bg-sky-50 text-sky-700 ring-sky-200",
		Won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		Lost: "bg-rose-50 text-rose-700 ring-rose-200",
	},
	class: {
		Hazardous: "bg-rose-50 text-rose-700 ring-rose-200",
		Recyclable: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		"Non-Hazardous": "bg-sky-50 text-sky-700 ring-sky-200",
		Others: "bg-slate-100 text-slate-600 ring-slate-200",
	},
} as const;

const baseLeadRows: BaseLeadRecord[] = [
	{
		date: "07-05-2026",
		lid: "LID-0001",
		streamNo: "SN-001",
		source: "Website",
		assignedTo: { initials: "AK", name: "Ahmed Khan" },
		cid: "CID-0001",
		customerName: "Green Loop Trading",
		wasteStream: "Solvent Foam",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 50,
		unit: "Tons",
		labStatus: "Approved",
		proposalStatus: "Sent",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "08-05-2026",
		lid: "LID-0002",
		streamNo: "SN-001",
		source: "Referral",
		assignedTo: { initials: "SA", name: "Sara Ali" },
		cid: "CID-0002",
		customerName: "Blue Star Industries",
		wasteStream: "Oily Sludge",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 120,
		unit: "Drums",
		labStatus: "Pending",
		proposalStatus: "Pending",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "09-05-2026",
		lid: "LID-0003",
		streamNo: "SN-001",
		source: "Sales Visit",
		assignedTo: { initials: "IG", name: "Imran Gill" },
		cid: "CID-0003",
		customerName: "Emirates Marine",
		wasteStream: "Scrap Plastic",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 18,
		unit: "Tons",
		labStatus: "Approved",
		proposalStatus: "Accepted",
		status: "Won",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "10-05-2026",
		lid: "LID-0004",
		streamNo: "SN-001",
		source: "WhatsApp",
		assignedTo: { initials: "LT", name: "Lab Team" },
		cid: "CID-0004",
		customerName: "Gulf Chemicals",
		wasteStream: "Chemical Residue",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 7,
		unit: "IBCs",
		labStatus: "Reject",
		proposalStatus: "Not Sent",
		status: "Lost",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "11-05-2026",
		lid: "LID-0005",
		streamNo: "SN-001",
		source: "Existing Client",
		assignedTo: { initials: "FT", name: "Finance Team" },
		cid: "CID-0005",
		customerName: "Desert Recycling",
		wasteStream: "Mixed Paper",
		wasteClass: "Non-Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 32,
		unit: "Tons",
		labStatus: "Approved",
		proposalStatus: "Under Review",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "12-05-2026",
		lid: "LID-0006",
		streamNo: "SN-001",
		source: "Website",
		assignedTo: { initials: "OM", name: "Omar Malik" },
		cid: "CID-0006",
		customerName: "Metro Polymers",
		wasteStream: "PET Flakes",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 24,
		unit: "Tons",
		labStatus: "Pending",
		proposalStatus: "Sent",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "13-05-2026",
		lid: "LID-0007",
		streamNo: "SN-001",
		source: "Referral",
		assignedTo: { initials: "NK", name: "Noor Khan" },
		cid: "CID-0007",
		customerName: "Arabian Logistics",
		wasteStream: "Packaging Cardboard",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 40,
		unit: "Bales",
		labStatus: "Approved",
		proposalStatus: "Accepted",
		status: "Won",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "14-05-2026",
		lid: "LID-0008",
		streamNo: "SN-001",
		source: "Sales Visit",
		assignedTo: { initials: "RA", name: "Rashid Ahmed" },
		cid: "CID-0008",
		customerName: "Gulf Food Works",
		wasteStream: "Organic Slurry",
		wasteClass: "Non-Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 15,
		unit: "Tanks",
		labStatus: "Reject",
		proposalStatus: "Pending",
		status: "Lost",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "15-05-2026",
		lid: "LID-0009",
		streamNo: "SN-001",
		source: "Website",
		assignedTo: { initials: "AK", name: "Ahmed Khan" },
		cid: "CID-0009",
		customerName: "Eco Source Manufacturing",
		wasteStream: "Ink Residue",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 22,
		unit: "Drums",
		labStatus: "Pending",
		proposalStatus: "Under Review",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "16-05-2026",
		lid: "LID-0010",
		streamNo: "SN-001",
		source: "Referral",
		assignedTo: { initials: "SA", name: "Sara Ali" },
		cid: "CID-0010",
		customerName: "Pearl Textile Works",
		wasteStream: "Fabric Offcuts",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 14,
		unit: "Bales",
		labStatus: "Approved",
		proposalStatus: "Sent",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "17-05-2026",
		lid: "LID-0011",
		streamNo: "SN-001",
		source: "Sales Visit",
		assignedTo: { initials: "IG", name: "Imran Gill" },
		cid: "CID-0011",
		customerName: "Union Steel Processing",
		wasteStream: "Metal Dust",
		wasteClass: "Non-Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 9,
		unit: "Bags",
		labStatus: "Approved",
		proposalStatus: "Accepted",
		status: "Won",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "18-05-2026",
		lid: "LID-0012",
		streamNo: "SN-001",
		source: "WhatsApp",
		assignedTo: { initials: "LT", name: "Lab Team" },
		cid: "CID-0012",
		customerName: "Nova Cleaning Services",
		wasteStream: "Detergent Sludge",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 11,
		unit: "IBCs",
		labStatus: "Reject",
		proposalStatus: "Not Sent",
		status: "Lost",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "19-05-2026",
		lid: "LID-0013",
		streamNo: "SN-001",
		source: "Existing Client",
		assignedTo: { initials: "FT", name: "Finance Team" },
		cid: "CID-0013",
		customerName: "Al Noor Packaging",
		wasteStream: "Corrugated Paper",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 27,
		unit: "Tons",
		labStatus: "Approved",
		proposalStatus: "Under Review",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "20-05-2026",
		lid: "LID-0014",
		streamNo: "SN-001",
		source: "Website",
		assignedTo: { initials: "OM", name: "Omar Malik" },
		cid: "CID-0014",
		customerName: "Marine Blue Holdings",
		wasteStream: "Spent Coolant",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 35,
		unit: "Drums",
		labStatus: "Pending",
		proposalStatus: "Pending",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "21-05-2026",
		lid: "LID-0015",
		streamNo: "SN-001",
		source: "Referral",
		assignedTo: { initials: "NK", name: "Noor Khan" },
		cid: "CID-0015",
		customerName: "Fresh Harvest Foods",
		wasteStream: "Organic Residue",
		wasteClass: "Non-Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 19,
		unit: "Bins",
		labStatus: "Approved",
		proposalStatus: "Sent",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "22-05-2026",
		lid: "LID-0016",
		streamNo: "SN-001",
		source: "Sales Visit",
		assignedTo: { initials: "RA", name: "Rashid Ahmed" },
		cid: "CID-0016",
		customerName: "Orbit Glass Industries",
		wasteStream: "Glass Cullet",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 41,
		unit: "Tons",
		labStatus: "Approved",
		proposalStatus: "Accepted",
		status: "Won",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "23-05-2026",
		lid: "LID-0017",
		streamNo: "SN-001",
		source: "Website",
		assignedTo: { initials: "AK", name: "Ahmed Khan" },
		cid: "CID-0017",
		customerName: "Capital Auto Works",
		wasteStream: "Used Filters",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 13,
		unit: "Boxes",
		labStatus: "Reject",
		proposalStatus: "Not Sent",
		status: "Lost",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "24-05-2026",
		lid: "LID-0018",
		streamNo: "SN-001",
		source: "Existing Client",
		assignedTo: { initials: "SA", name: "Sara Ali" },
		cid: "CID-0018",
		customerName: "Prime Retail Group",
		wasteStream: "Mixed Plastics",
		wasteClass: "Recyclable",
		otherWasteClass: null,
		estimatedQuantity: 29,
		unit: "Bales",
		labStatus: "Pending",
		proposalStatus: "Pending",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "25-05-2026",
		lid: "LID-0019",
		streamNo: "SN-001",
		source: "WhatsApp",
		assignedTo: { initials: "OM", name: "Omar Malik" },
		cid: "CID-0019",
		customerName: "Falcon Energy Services",
		wasteStream: "Oil Contaminated Rags",
		wasteClass: "Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 8,
		unit: "Bags",
		labStatus: "Pending",
		proposalStatus: "Under Review",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
	{
		date: "26-05-2026",
		lid: "LID-0020",
		streamNo: "SN-001",
		source: "Referral",
		assignedTo: { initials: "RA", name: "Rashid Ahmed" },
		cid: "CID-0020",
		customerName: "Sunrise Hospitality",
		wasteStream: "Used Cooking Oil",
		wasteClass: "Non-Hazardous",
		otherWasteClass: null,
		estimatedQuantity: 16,
		unit: "Drums",
		labStatus: "Approved",
		proposalStatus: "Sent",
		status: "Open",
		labStatusDays: 0,
		proposalStatusDays: 0,
		leadStatusDays: 0,
	},
];
export const initialLeadRows: LeadRecord[] = baseLeadRows.map((lead, index) => ({
	...lead,
	leadGeneratedDate: lead.date,
	labStatusDays: calculateDaysBetween(lead.date, addDaysToDisplayDate(lead.date, LAB_STATUS_DAY_OFFSETS[index] ?? 0)),
	labUpdatedDate: addDaysToDisplayDate(lead.date, LAB_STATUS_DAY_OFFSETS[index] ?? 0),
	proposalStatusDays: calculateDaysBetween(lead.date, addDaysToDisplayDate(lead.date, PROPOSAL_STATUS_DAY_OFFSETS[index] ?? 0)),
	proposalUpdatedDate: addDaysToDisplayDate(lead.date, PROPOSAL_STATUS_DAY_OFFSETS[index] ?? 0),
	leadStatusDays: calculateDaysBetween(lead.date, addDaysToDisplayDate(lead.date, LEAD_STATUS_DAY_OFFSETS[index] ?? 0)),
	leadStatusUpdatedDate: addDaysToDisplayDate(lead.date, LEAD_STATUS_DAY_OFFSETS[index] ?? 0),
	wdsDateSubmitted: null,
	wdsStatus: "N/A",
	wdsDateApproved: null,
	wdsStatusDays: null,
	wdsNo: null,
}));

type DrawerState =
	| { type: "lab"; lid: string; streamNo: string; wasteStreamName: string; initialData: CrmLabStreamStatusRecord | null }
	| { type: "proposal"; lid: string; initialData: CrmProposalStatusRecord | null }
	| { type: "lead"; lid: string; initialData: CrmLeadStatusRecord | null }
	| { type: "wds"; lid: string; initialData: CrmWdsStatusRecord | null }
	| null;

type GroupedRow = Readonly<{
	lead: LeadRecord;
	isGroupStart: boolean;
	isGroupEnd: boolean;
	isSingle: boolean;
}>;

function buildGroupedRows(rows: LeadRecord[]): GroupedRow[] {
	const result: GroupedRow[] = [];
	let i = 0;
	while (i < rows.length) {
		const current = rows[i]!;
		let groupEnd = i;
		while (groupEnd + 1 < rows.length && rows[groupEnd + 1]!.lid === current.lid) {
			groupEnd++;
		}
		const isSingle = groupEnd === i;
		for (let j = i; j <= groupEnd; j++) {
			result.push({
				lead: rows[j]!,
				isGroupStart: j === i,
				isGroupEnd: j === groupEnd,
				isSingle,
			});
		}
		i = groupEnd + 1;
	}
	return result;
}

export default function LeadTable({ leads, linkBase = "/employee/crm/leads", onRemove, showExport = false }: LeadTableProps) {
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
	const [rowsPerPage, setRowsPerPage] = useState<(typeof ROWS_PER_PAGE_OPTIONS)[number]>(20);
	const [currentPage, setCurrentPage] = useState(1);
	const [drawerState, setDrawerState] = useState<DrawerState>(null);
	const [localLeads, setLocalLeads] = useState<LeadRecord[]>(leads);

	// Keep localLeads in sync when the parent refreshes the leads prop
	useEffect(() => { setLocalLeads(leads); }, [leads]);

	const assignedToOptions = useMemo(() => {
		return ["All", ...Array.from(new Set(localLeads.map((lead) => lead.assignedTo.name)))];
	}, [localLeads]);

	const filteredLeads = useMemo(() => {
		const normalizedSearch = filters.search.trim().toLowerCase();

		return localLeads.filter((lead) => {
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
	}, [filters, localLeads]);

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
			"Lead Generated Date",
			"LID",
			"Stream No.",
			"Source",
			"Assigned To",
			"CID",
			"Customer Name",
			"Waste Stream",
			"Class",
			"Est. Qty",
			"Unit",
			"Lab Status",
			"Lab Status Days",
			"Proposal Status",
			"Proposal Status Days",
			"Status",
			"Lead Status Days",
		];

		const rows = filteredLeads.map((lead) => [
			lead.date,
			lead.leadGeneratedDate,
			lead.lid,
			lead.streamNo ?? "-",
			lead.source,
			lead.assignedTo.name,
			lead.cid,
			lead.customerName,
			lead.wasteStream,
			getWasteClassLabel(lead),
			String(lead.estimatedQuantity),
			lead.unit,
			lead.labStatus,
			formatDays(lead.labStatusDays),
			lead.proposalStatus,
			formatDays(lead.proposalStatusDays),
			lead.status,
			formatDays(lead.leadStatusDays),
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
		<>
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-end gap-3">
					<label className="flex w-64 flex-col gap-1.5">
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
					<FilterSelect className="w-38" label="Assigned To" value={filters.assignedTo} onChange={(value) => updateFilter("assignedTo", value)} options={assignedToOptions} />
					<FilterSelect className="w-36" label="Lab Status" value={filters.labStatus} onChange={(value) => updateFilter("labStatus", value)} options={["All", "Pending", "Accept", "Reject", "Not Applicable", "Other"]} />
					<FilterSelect className="w-40" label="Proposal Status" value={filters.proposalStatus} onChange={(value) => updateFilter("proposalStatus", value)} options={["All", "Pending", "Sent", "Under Review", "Not Sent", "Other"]} />
					<FilterSelect className="w-32" label="Lead Status" value={filters.status} onChange={(value) => updateFilter("status", value)} options={["All", "Open", "Won", "Lost", "Other"]} />
					<div className="ml-auto flex items-end gap-2">
						{showExport ? (
							<Button variant="secondary" size="sm" className="min-h-9 rounded-xl px-3 text-[12px]" onClick={exportVisibleRows}>
								<Download className="h-3.5 w-3.5" />
								Export
							</Button>
						) : null}
						<Button variant="secondary" size="sm" className="min-h-9 rounded-xl px-3 text-[12px]" onClick={clearFilters}>
							<X className="h-3.5 w-3.5" />
							Clear Filters
						</Button>
					</div>
		</div>

				<div className="w-full overflow-x-auto">
					<table className="min-w-362.5 border-collapse text-left text-[12px] text-slate-700">
						<colgroup>
							<col className="w-21" />
							<col className="w-23" />
							<col className="w-20" />
							<col className="w-25.5" />
							<col className="w-34.5" />
							<col className="w-23" />
							<col className="w-36.5" />
							<col className="w-31" />
							<col className="w-24.5" />
							<col className="w-19.5" />
							<col className="w-16" />
							<col className="w-22" />
							<col className="w-[4.5rem]" />
							<col className="w-27.5" />
							<col className="w-22" />
							<col className="w-[4.5rem]" />
							<col className="w-[4.5rem]" />
							<col className="w-22" />
							<col className="w-21" />
							<col className="w-22" />
							<col className="w-[4.5rem]" />
							<col className="w-21" />
							<col className="w-20" />
						</colgroup>
						<thead className="sticky top-0 z-10 bg-slate-50">
							<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
								<HeaderCell rowSpan={2} label="Date" />
								<HeaderCell rowSpan={2} label="LID" linked />
								<HeaderCell rowSpan={2} label="Stream No." noWrap />
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
								<GroupHeader label="Lead Status" colSpan={2} />
								<GroupHeader label="WDS Status" colSpan={5} />
								<HeaderCell rowSpan={2} label="Actions" centered />
							</tr>
							<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
								<HeaderCell label="Status" />
								<HeaderCell label="Days" centered />
								<HeaderCell label="Status" />
								<HeaderCell label="Days" centered />
								<HeaderCell label="Status" />
								<HeaderCell label="Days" centered />
								<HeaderCell label="WDS No." noWrap />
								<HeaderCell label="Date Submitted" />
								<HeaderCell label="Status" />
								<HeaderCell label="Date Approved" />
								<HeaderCell label="Days" centered />
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
								buildGroupedRows(paginatedLeads).map(({ lead, isGroupStart, isGroupEnd, isSingle }) => {
									const inGroup = !isSingle;
									const groupTop = inGroup && isGroupStart;
									const groupBottom = inGroup && isGroupEnd;
									const groupBorderFirst = joinClasses(
										inGroup ? "border-l-2 border-l-slate-900" : undefined,
										groupTop ? "border-t-2 border-t-slate-900" : undefined,
										groupBottom ? "border-b-2 border-b-slate-900" : undefined,
									);
									const groupBorderLast = joinClasses(
										inGroup ? "border-r-2 border-r-slate-900" : undefined,
										groupTop ? "border-t-2 border-t-slate-900" : undefined,
										groupBottom ? "border-b-2 border-b-slate-900" : undefined,
									);
									const groupBorderMid = joinClasses(
										groupTop ? "border-t-2 border-t-slate-900" : undefined,
										groupBottom ? "border-b-2 border-b-slate-900" : undefined,
									);
									return (
									<tr key={`${lead.lid}-${lead.streamNo ?? "x"}`} className={joinClasses("bg-white transition hover:bg-slate-50/80", inGroup ? "bg-slate-50/30" : undefined)}>
										<DataCell className={groupBorderFirst}>{isGroupStart || isSingle ? lead.date : ""}</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? <RecordLink href={`${linkBase}/${lead.lid}`} value={lead.lid} /> : null}
										</DataCell>
										<DataCell className={groupBorderMid}>
											{lead.streamNo ? (
												<span className="text-[11px] font-mono font-medium text-slate-500">{lead.streamNo}</span>
											) : (
												<span className="text-slate-400">—</span>
											)}
										</DataCell>
										<DataCell className={groupBorderMid}>{isGroupStart || isSingle ? lead.source : ""}</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? (
												<div className="flex items-center gap-2 whitespace-nowrap">
													<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white">{lead.assignedTo.initials}</span>
													<span className="truncate">{lead.assignedTo.name}</span>
												</div>
											) : null}
										</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? <RecordLink href={`${linkBase}/${lead.lid}`} value={lead.cid} /> : null}
										</DataCell>
										<DataCell className={joinClasses("max-w-36.5 truncate", groupBorderMid)}>{isGroupStart || isSingle ? lead.customerName : ""}</DataCell>
										<DataCell className={joinClasses("max-w-31 truncate", groupBorderMid)}>{lead.wasteStream}</DataCell>
										<DataCell className={groupBorderMid}>
											<Badge tone={badgeClasses.class[lead.wasteClass]}>{getWasteClassLabel(lead)}</Badge>
										</DataCell>
										<DataCell className={groupBorderMid}>{lead.estimatedQuantity}</DataCell>
										<DataCell className={groupBorderMid}>{lead.unit}</DataCell>
										<DataCell className={groupBorderMid}>
											<button type="button" title="Update Lab Status" onClick={() => setDrawerState({ type: "lab", lid: lead.lid, streamNo: lead.streamNo ?? "SN-001", wasteStreamName: lead.wasteStream, initialData: null })}>
												<Badge tone={badgeClasses.lab[lead.labStatus]}>{lead.labStatus}</Badge>
											</button>
										</DataCell>
										<DataCell centered className={joinClasses("text-[11px] font-medium text-slate-500", groupBorderMid)}>{formatDays(lead.labStatusDays)}</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? (
												<button type="button" title="Update Proposal Status" onClick={() => setDrawerState({ type: "proposal", lid: lead.lid, initialData: null })}>
													<Badge tone={badgeClasses.proposal[lead.proposalStatus]}>{lead.proposalStatus}</Badge>
												</button>
											) : null}
										</DataCell>
										<DataCell centered className={joinClasses("text-[11px] font-medium text-slate-500", groupBorderMid)}>{isGroupStart || isSingle ? formatDays(lead.proposalStatusDays) : ""}</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? (
												<button type="button" title="Update Lead Status" onClick={() => setDrawerState({ type: "lead", lid: lead.lid, initialData: null })}>
													<Badge tone={badgeClasses.status[lead.status]}>{lead.status}</Badge>
												</button>
											) : null}
										</DataCell>
										<DataCell centered className={joinClasses("text-[11px] font-medium text-slate-500", groupBorderMid)}>{isGroupStart || isSingle ? formatDays(lead.leadStatusDays) : ""}</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? (
												<button type="button" className="cursor-pointer text-left" title="Update WDS Status" onClick={() => setDrawerState({ type: "wds", lid: lead.lid, initialData: null })}>
													<span className="text-slate-500 text-[12px]">{lead.wdsNo ?? "N/A"}</span>
												</button>
											) : null}
										</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? (
												<button type="button" className="cursor-pointer text-left" title="Update WDS Status" onClick={() => setDrawerState({ type: "wds", lid: lead.lid, initialData: null })}>
													<span className="text-slate-500 text-[12px]">{lead.wdsDateSubmitted ?? "-"}</span>
												</button>
											) : null}
										</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? (
												<button type="button" title="Update WDS Status" onClick={() => setDrawerState({ type: "wds", lid: lead.lid, initialData: null })}>
													<Badge tone={wdsBadgeTone(lead.wdsStatus)}>{lead.wdsStatus}</Badge>
												</button>
											) : null}
										</DataCell>
										<DataCell className={groupBorderMid}>
											{isGroupStart || isSingle ? (
												<button type="button" className="cursor-pointer text-left" title="Update WDS Status" onClick={() => setDrawerState({ type: "wds", lid: lead.lid, initialData: null })}>
													<span className="text-slate-500 text-[12px]">{lead.wdsDateApproved ?? "-"}</span>
												</button>
											) : null}
										</DataCell>
										<DataCell centered className={joinClasses("text-[11px] font-medium text-slate-500", groupBorderMid)}>
											{isGroupStart || isSingle ? (
												<button type="button" title="Update WDS Status" onClick={() => setDrawerState({ type: "wds", lid: lead.lid, initialData: null })}>
													{lead.wdsStatusDays !== null ? formatDays(lead.wdsStatusDays) : "-"}
												</button>
											) : null}
										</DataCell>
										<DataCell centered className={groupBorderLast}>
											<div className="flex items-center justify-center gap-1.5">
											<ActionLink href={`${linkBase}/${lead.lid}`} label="View">
												<Eye className="h-3.5 w-3.5" />
											</ActionLink>
											{lead.status === "Open" ? (
												<ActionLink href={`${linkBase}/${lead.lid}`} label="Edit">
													<Pencil className="h-3.5 w-3.5" />
												</ActionLink>
											) : null}
											{onRemove ? (
												<ActionButton onClick={() => onRemove(lead.lid)} label="Remove">
													<Trash2 className="h-3.5 w-3.5" />
												</ActionButton>
												) : null}
											</div>
										</DataCell>
									</tr>
									);
								})
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
						</div>
					</div>
				</div>
		</div>

		{drawerState?.type === "lab" ? (
			<LabStatusDrawer
				open
				onClose={() => setDrawerState(null)}
				lid={drawerState.lid}
				streamNo={drawerState.streamNo}
				wasteStreamName={drawerState.wasteStreamName}
				initialData={drawerState.initialData}
				onSaved={(record) => {
					setLocalLeads((current) =>
						current.map((lead) =>
							lead.lid === record.lid && lead.streamNo === record.streamNo
								? { ...lead, labStatus: record.decision as LeadRecord["labStatus"] }
								: lead,
						),
					);
				}}
			/>
		) : null}

		{drawerState?.type === "proposal" ? (
			<ProposalStatusDrawer
				open
				onClose={() => setDrawerState(null)}
				lid={drawerState.lid}
				initialData={drawerState.initialData}
				onSaved={(record) => {
					setLocalLeads((current) =>
						current.map((lead) =>
							lead.lid === record.lid
								? { ...lead, proposalStatus: record.status as LeadRecord["proposalStatus"] }
								: lead,
						),
					);
				}}
			/>
		) : null}

		{drawerState?.type === "lead" ? (
			<LeadStatusDrawer
				open
				onClose={() => setDrawerState(null)}
				lid={drawerState.lid}
				initialData={drawerState.initialData}
				onSaved={(record) => {
					setLocalLeads((current) =>
						current.map((lead) =>
							lead.lid === record.lid
								? { ...lead, status: record.status as LeadRecord["status"] }
								: lead,
						),
					);
				}}
			/>
		) : null}

		{drawerState?.type === "wds" ? (
			<WdsStatusDrawer
				open
				onClose={() => setDrawerState(null)}
				lid={drawerState.lid}
				initialData={drawerState.initialData}
				onSaved={(record) => {
					setLocalLeads((current) =>
						current.map((lead) =>
							lead.lid === record.lid
								? {
										...lead,
										wdsNo: record.wdsNo,
										wdsDateSubmitted: record.dateSubmitted,
										wdsStatus: record.status,
										wdsDateApproved: record.dateApproved,
										wdsStatusDays: record.days,
								  }
								: lead,
						),
					);
				}}
			/>
		) : null}
	</>
	);
}

function formatDays(days: number) {
	return `${days} Days`;
}

function wdsBadgeTone(status: string) {
	if (status === "Approved") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
	if (status === "Open") return "bg-sky-50 text-sky-700 ring-sky-200";
	return "bg-slate-100 text-slate-600 ring-slate-200";
}

function getWasteClassLabel(lead: LeadRecord) {
	return lead.wasteClass === "Others" ? lead.otherWasteClass?.trim() || "Others" : lead.wasteClass;
}

function calculateDaysBetween(startDate: string, endDate: string) {
	const startValue = parseDisplayDate(startDate);
	const endValue = parseDisplayDate(endDate);

	if (!startValue || !endValue) {
		return 0;
	}

	return Math.max(0, Math.floor((endValue.getTime() - startValue.getTime()) / DAY_IN_MS));
}

function addDaysToDisplayDate(value: string, days: number) {
	const parsedValue = parseDisplayDate(value);

	if (!parsedValue) {
		return value;
	}

	const shiftedValue = new Date(parsedValue.getTime() + (Math.max(0, days) * DAY_IN_MS));
 
	return formatDisplayDate(shiftedValue);
}

function parseDisplayDate(value: string) {
	const [dayText, monthText, yearText] = value.split("-");
	const day = Number(dayText);
	const month = Number(monthText);
	const year = Number(yearText);

	if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
		return null;
	}

	return new Date(Date.UTC(year, month - 1, day));
}

function formatDisplayDate(value: Date) {
	const day = String(value.getUTCDate()).padStart(2, "0");
	const month = String(value.getUTCMonth() + 1).padStart(2, "0");
	const year = value.getUTCFullYear();

	return `${day}-${month}-${year}`;
}

function HeaderCell({ label, rowSpan, linked = false, centered = false, noWrap = false }: Readonly<{ label: string; rowSpan?: number; linked?: boolean; centered?: boolean; noWrap?: boolean }>) {
	return (
		<th
			rowSpan={rowSpan}
			className={joinClasses(
				"border-b border-r border-slate-200 bg-slate-50 px-2 py-2 align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 last:border-r-0",
				centered ? "text-center" : "text-left",
			)}
		>
			<div className={joinClasses("flex items-center", centered ? "justify-center" : "justify-start", linked ? "text-slate-700" : undefined)}>
				<span className={noWrap ? "whitespace-nowrap" : undefined}>{label}</span>
			</div>
		</th>
	);
}

function GroupHeader({ label, colSpan }: Readonly<{ label: string; colSpan: number }>) {
	return (
		<th colSpan={colSpan} className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 last:border-r-0">
			<div className="flex items-center justify-center">
				<span>{label}</span>
			</div>
		</th>
	);
}

function DataCell({ children, centered = false, className }: Readonly<{ children: React.ReactNode; centered?: boolean; className?: string }>) {
	return <td className={joinClasses("border-b border-r border-slate-200 px-2 py-2 align-middle text-[12px] whitespace-nowrap text-slate-700 last:border-r-0", centered ? "text-center" : "text-left", className)}>{children}</td>;
}

function Badge({ children, tone }: Readonly<{ children: React.ReactNode; tone: string }>) {
	return <span className={joinClasses("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ring-1 ring-inset", tone)}>{children}</span>;
}

function RecordLink({ href, value }: Readonly<{ href: string; value: string }>) {
	return (
		<Link href={href} className="font-medium whitespace-nowrap text-[#36B44D] transition hover:text-[#2b963f] hover:underline">
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
			className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-[#36B44D]"
		>
			{children}
		</Link>
	);
}

function ActionButton({ onClick, label, children }: Readonly<{ onClick: () => void; label: string; children: React.ReactNode }>) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
		>
			{children}
		</button>
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

