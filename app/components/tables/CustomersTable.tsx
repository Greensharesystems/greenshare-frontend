"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, Pencil, Search, Trash2, X } from "lucide-react";

import { downloadCustomersCsv } from "@/app/services/customers.service";
import Button from "@/app/components/ui/Button";
import { apiFetch } from "@/app/utils/api";

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
] as const;

type CustomerRecord = Readonly<{
	customerIdDate: string;
	customerId: string;
	companyName: string;
	companyEmirate: string;
	area: string;
	officeAddress: string;
	website: string;
	companyEmail: string;
	sector: string;
	contactPersonName: string;
	contactPersonPosition: string;
	contactPersonDepartment: string;
	contactPersonEmail: string;
	contactPersonOfficePhone: string;
	contactPersonMobilePhone: string;
	lastActive: string;
}>;

type CustomersTableProps = Readonly<{
	showEmployeeCsvExport?: boolean;
	showRemoveAction?: boolean;
}>;

// Total data columns: 2 standalone + 7 customer-name + 6 focal-person + 1 last-active + 1 actions = 17
const TOTAL_COLUMNS = 17;

export default function CustomersTable({ showEmployeeCsvExport = false, showRemoveAction = true }: CustomersTableProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [customers, setCustomers] = useState<CustomerRecord[]>([]);
	const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [removingCustomerId, setRemovingCustomerId] = useState<string | null>(null);
	const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
	const [nameSearch, setNameSearch] = useState("");
	const [regDateFilter, setRegDateFilter] = useState("All");

	useEffect(() => {
		void loadCustomers();
	}, []);

	async function loadCustomers() {
		setIsLoading(true);
		setErrorMessage("");

		try {
			const response = await apiFetch("/customers", {
				cache: "no-store",
			});
			const payload = (await response.json()) as Array<CustomerRecord> & { detail?: string };

			if (!response.ok) {
				throw new Error((payload as { detail?: string }).detail ?? "Unable to load customers.");
			}

			setCustomers(Array.isArray(payload) ? payload : []);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to load customers.");
			setCustomers([]);
		} finally {
			setIsLoading(false);
		}
	}

	async function handleConfirmedRemove(customerId: string) {
		setConfirmRemoveId(null);
		setRemovingCustomerId(customerId);
		setErrorMessage("");

		try {
			const response = await apiFetch(`/customers/${encodeURIComponent(customerId)}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const payload = (await response.json()) as { detail?: string };
				throw new Error(payload.detail ?? "Unable to remove that customer.");
			}

			await loadCustomers();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to remove that customer.");
		} finally {
			setRemovingCustomerId(null);
		}
	}

	async function handleDownloadCsv() {
		setErrorMessage("");
		setIsDownloadingCsv(true);

		try {
			await downloadCustomersCsv(visibleCustomers.map((customer) => customer.customerId));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to download the customer dataset right now.");
		} finally {
			setIsDownloadingCsv(false);
		}
	}

	const regDateOptions = useMemo(() => {
		const seen = new Set<string>();
		for (const customer of customers) {
			const parts = /^(\d{2})-(\d{2})-(\d{4})$/.exec(customer.customerIdDate);
			if (parts) {
				const month = parseInt(parts[2], 10);
				const year = parseInt(parts[3], 10);
				seen.add(`${MONTH_NAMES[month - 1]} ${year}`);
			}
		}
		const sorted = Array.from(seen).sort((a, b) => {
			const [aMonth, aYear] = a.split(" ");
			const [bMonth, bYear] = b.split(" ");
			if (aYear !== bYear) return parseInt(aYear, 10) - parseInt(bYear, 10);
			return MONTH_NAMES.indexOf(aMonth as typeof MONTH_NAMES[number]) - MONTH_NAMES.indexOf(bMonth as typeof MONTH_NAMES[number]);
		});
		return ["All", ...sorted];
	}, [customers]);

	const visibleCustomers = useMemo(() => {
		const normalizedSearch = nameSearch.trim().toLowerCase();
		return customers.filter((customer) => {
			if (normalizedSearch) {
				const matchesCompany = customer.companyName.toLowerCase().includes(normalizedSearch);
				const matchesFocal = customer.contactPersonName.toLowerCase().includes(normalizedSearch);
				if (!matchesCompany && !matchesFocal) return false;
			}
			if (regDateFilter !== "All") {
				const parts = /^(\d{2})-(\d{2})-(\d{4})$/.exec(customer.customerIdDate);
				if (!parts) return false;
				const month = parseInt(parts[2], 10);
				const year = parseInt(parts[3], 10);
				const label = `${MONTH_NAMES[month - 1]} ${year}`;
				if (label !== regDateFilter) return false;
			}
			return true;
		});
	}, [customers, nameSearch, regDateFilter]);

	const confirmTarget = confirmRemoveId
		? customers.find((c) => c.customerId === confirmRemoveId)
		: null;

	return (
		<>
			{/* Confirmation modal */}
			{confirmRemoveId !== null ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
						<h2 className="mb-2 text-lg font-semibold text-slate-900">Remove Customer</h2>
						<p className="mb-5 text-sm text-slate-600">
							Are you sure you want to remove{" "}
							<span className="font-medium text-slate-900">{confirmTarget?.companyName ?? confirmRemoveId}</span>? This action cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="secondary" size="sm" onClick={() => setConfirmRemoveId(null)}>
								Cancel
							</Button>
							<Button variant="danger" size="sm" onClick={() => void handleConfirmedRemove(confirmRemoveId)}>
								Remove
							</Button>
						</div>
					</div>
				</div>
			) : null}

			{/* Filters */}
			<div className="flex flex-wrap items-end gap-3">
				<label className="flex w-44 flex-col gap-1.5">
					<span className="text-[11px] font-semibold text-slate-500">CID Date</span>
					<select
						value={regDateFilter}
						onChange={(event) => setRegDateFilter(event.target.value)}
						className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
					>
						{regDateOptions.map((option) => (
							<option key={option} value={option}>{option}</option>
						))}
					</select>
				</label>
				<label className="flex w-64 flex-col gap-1.5">
					<span className="text-[11px] font-semibold text-slate-500">Customer Name</span>
					<div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#36B44D] focus-within:ring-4 focus-within:ring-[#36B44D]/10">
						<Search className="h-3.5 w-3.5 text-slate-400" />
						<input
							type="search"
							value={nameSearch}
							onChange={(event) => setNameSearch(event.target.value)}
							placeholder="Search by company or focal person"
							className="w-full border-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
						/>
					</div>
				</label>
				<div className="flex items-end gap-2">
					{showEmployeeCsvExport ? (
						<Button
							variant="secondary"
							size="sm"
							className="min-h-9 rounded-xl px-3 text-[12px]"
							onClick={() => { void handleDownloadCsv(); }}
							disabled={isLoading || isDownloadingCsv || visibleCustomers.length === 0}
						>
							<Download className="h-3.5 w-3.5" />
							{isDownloadingCsv ? "Downloading..." : "Export"}
						</Button>
					) : null}
					<Button
						variant="secondary"
						size="sm"
						className="min-h-9 rounded-xl px-3 text-[12px]"
						onClick={() => { setNameSearch(""); setRegDateFilter("All"); }}
					>
						<X className="h-3.5 w-3.5" />
						Clear Filters
					</Button>
				</div>
			</div>

			{errorMessage ? (
				<p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<div className="w-full overflow-x-auto">
				<table className="min-w-full border-collapse text-left text-xs text-slate-700">
					<thead className="sticky top-0 z-10 bg-slate-50">
						{/* Row 1: standalone columns + group header spans */}
						<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
							<HeaderCell rowSpan={2} label="CID Date" />
							<HeaderCell rowSpan={2} label="Customer ID" />
							<GroupHeader label="Customer Name" colSpan={7} />
							<GroupHeader label="Focal Person" colSpan={6} />
							<HeaderCell rowSpan={2} label="Last Active" />
							<HeaderCell rowSpan={2} label="Actions" centered />
						</tr>
						{/* Row 2: sub-column headers */}
						<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
							<HeaderCell label="Company Name" />
							<HeaderCell label="Emirate" />
							<HeaderCell label="Area" />
							<HeaderCell label="Office Location" />
							<HeaderCell label="Website" />
							<HeaderCell label="Email" />
							<HeaderCell label="Sector" />
							<HeaderCell label="Name" />
							<HeaderCell label="Position" />
							<HeaderCell label="Department" />
							<HeaderCell label="Email" />
							<HeaderCell label="Office Phone" />
							<HeaderCell label="Mobile Phone" />
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
									Loading customers...
								</td>
							</tr>
						) : visibleCustomers.length === 0 ? (
							<tr>
								<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
									No customers added yet.
								</td>
							</tr>
						) : (
							visibleCustomers.map((customer) => (
								<tr key={customer.customerId} className="bg-white transition hover:bg-slate-50/80">
									<DataCell>{customer.customerIdDate}</DataCell>
									<DataCell className="font-medium text-slate-900">{customer.customerId}</DataCell>
									<DataCell>{customer.companyName}</DataCell>
									<DataCell>{customer.companyEmirate}</DataCell>
									<DataCell>{customer.area}</DataCell>
									<DataCell>{customer.officeAddress}</DataCell>
									<DataCell>{customer.website}</DataCell>
									<DataCell>{customer.companyEmail}</DataCell>
									<DataCell>{customer.sector}</DataCell>
									<DataCell>{customer.contactPersonName}</DataCell>
									<DataCell>{customer.contactPersonPosition}</DataCell>
									<DataCell>{customer.contactPersonDepartment}</DataCell>
									<DataCell>{customer.contactPersonEmail}</DataCell>
									<DataCell>{customer.contactPersonOfficePhone}</DataCell>
									<DataCell>{customer.contactPersonMobilePhone}</DataCell>
									<DataCell>{customer.lastActive}</DataCell>
									<DataCell centered>
										<div className="flex items-center justify-center gap-1.5">
											<ActionButton
												label="Edit"
												onClick={() => router.push(`${pathname}?mode=edit&customerId=${encodeURIComponent(customer.customerId)}`)}
											>
												<Pencil className="h-3.5 w-3.5" />
											</ActionButton>
											{showRemoveAction ? (
												<ActionButton
													label="Remove"
													danger
													onClick={() => setConfirmRemoveId(customer.customerId)}
													disabled={removingCustomerId === customer.customerId}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</ActionButton>
											) : null}
										</div>
									</DataCell>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</>
	);
}

function HeaderCell({
	label,
	rowSpan,
	centered = false,
}: Readonly<{ label: string; rowSpan?: number; centered?: boolean }>) {
	return (
		<th
			rowSpan={rowSpan}
			className={`border-b border-r border-slate-200 bg-slate-50 px-2 py-2 align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 last:border-r-0 whitespace-nowrap${centered ? " text-center" : " text-left"}`}
		>
			{label}
		</th>
	);
}

function GroupHeader({ label, colSpan }: Readonly<{ label: string; colSpan: number }>) {
	return (
		<th
			colSpan={colSpan}
			className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 last:border-r-0"
		>
			{label}
		</th>
	);
}

function DataCell({
	children,
	centered = false,
	className,
}: Readonly<{ children: React.ReactNode; centered?: boolean; className?: string }>) {
	return (
		<td
			className={`border-b border-r border-slate-200 px-2 py-2 align-middle text-[12px] whitespace-nowrap text-slate-700 last:border-r-0${centered ? " text-center" : ""}${className ? ` ${className}` : ""}`}
		>
			{children}
		</td>
	);
}

function ActionButton({
	children,
	label,
	danger = false,
	onClick,
	disabled = false,
}: Readonly<{
	children: React.ReactNode;
	label: string;
	danger?: boolean;
	onClick: () => void;
	disabled?: boolean;
}>) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			disabled={disabled}
			onClick={onClick}
			className={`inline-flex h-6 w-6 items-center justify-center rounded-lg transition disabled:opacity-40${
				danger
					? " text-rose-500 hover:bg-rose-50 hover:text-rose-700"
					: " text-slate-500 hover:bg-slate-100 hover:text-slate-800"
			}`}
		>
			{children}
		</button>
	);
}
