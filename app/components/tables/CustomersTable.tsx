"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, Search, X } from "lucide-react";

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
const columns = [
	"Customer ID Date",
	"Customer ID (CID)",
	"Company Name",
	"Emirate",
	"Name",
	"Position",
	"Email",
	"Office Phone",
	"Mobile Phone",
	"Last Active",
	"Actions",
] as const;

export default function CustomersTable({ showEmployeeCsvExport = false, showRemoveAction = true }: CustomersTableProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [customers, setCustomers] = useState<CustomerRecord[]>([]);
	const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [removingCustomerId, setRemovingCustomerId] = useState<string | null>(null);
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

	async function handleRemoveCustomer(customerId: string) {
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
			if (normalizedSearch && !customer.companyName.toLowerCase().includes(normalizedSearch)) {
				return false;
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

	return (
		<>
			<div className="flex flex-wrap items-end gap-3">
				<label className="flex w-64 flex-col gap-1.5">
					<span className="text-[11px] font-semibold text-slate-500">Customer Name</span>
					<div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#36B44D] focus-within:ring-4 focus-within:ring-[#36B44D]/10">
						<Search className="h-3.5 w-3.5 text-slate-400" />
						<input
							type="search"
							value={nameSearch}
							onChange={(event) => setNameSearch(event.target.value)}
							placeholder="Search by customer name"
							className="w-full border-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
						/>
					</div>
				</label>
				<label className="flex w-44 flex-col gap-1.5">
					<span className="text-[11px] font-semibold text-slate-500">Registration Date</span>
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
				{showEmployeeCsvExport ? (
					<div className="flex items-end gap-2">
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
				) : (
					<div className="flex items-end gap-2">
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
				)}
			</div>
			{errorMessage ? (
				<p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<div className="w-full overflow-x-auto">
				<table className="min-w-full border-collapse text-left text-xs text-slate-700">
					<thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-[0.16em] text-slate-500">
						<tr>
							{columns.map((column) => (
								<th key={column} className="px-3 py-2.5 font-semibold">
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									Loading customers...
								</td>
							</tr>
						) : visibleCustomers.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									No customers added yet.
								</td>
							</tr>
						) : (
							visibleCustomers.map((customer) => (
								<tr key={customer.customerId} className="border-b border-slate-200 last:border-b-0">
									<td className="px-3 py-2.5 text-slate-600">{customer.customerIdDate}</td>
									<td className="px-3 py-2.5 font-medium text-slate-900">{customer.customerId}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.companyName}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.companyEmirate}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.contactPersonName}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.contactPersonPosition}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.contactPersonEmail}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.contactPersonOfficePhone}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.contactPersonMobilePhone}</td>
									<td className="px-3 py-2.5 text-slate-600">{customer.lastActive}</td>
									<td className="px-3 py-2.5">
										<div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
											<Button
												variant="secondary"
												size="sm"
												className="min-h-6 shrink-0 rounded-lg px-2 py-0.5 text-[11px]"
												onClick={() => router.push(`${pathname}?mode=edit&customerId=${encodeURIComponent(customer.customerId)}`)}
											>
												Edit
											</Button>
											{showRemoveAction ? (
												<Button variant="danger" size="sm" className="min-h-6 shrink-0 rounded-lg px-2 py-0.5 text-[11px]" onClick={() => void handleRemoveCustomer(customer.customerId)} disabled={removingCustomerId === customer.customerId}>
													{removingCustomerId === customer.customerId ? "Removing..." : "Remove"}
												</Button>
											) : null}
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</>
	);
}
