"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { downloadCustomersCsv } from "@/app/services/customers.service";
import Button from "@/app/components/ui/Button";
import TableFilters, { DEFAULT_TABLE_SORT_OPTIONS, sortTableRows, type TableSortValue } from "@/app/components/ui/TableFilters";
import { apiFetch } from "@/app/utils/api";

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
	const [sortValue, setSortValue] = useState<TableSortValue>("date-desc");

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

	const visibleCustomers = sortTableRows(customers, sortValue, {
		date: (customer) => customer.customerIdDate,
		customerName: (customer) => customer.companyName,
	});

	return (
		<>
			<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<TableFilters
					title="Table Filters"
					controls={[
						{
							key: "sort",
							type: "select",
							label: "Sort by",
							options: DEFAULT_TABLE_SORT_OPTIONS,
						},
					]}
					values={{ sort: sortValue }}
					onChange={(_, value) => setSortValue(value as TableSortValue)}
					className="flex-1"
				/>
				{showEmployeeCsvExport ? (
					<div className="flex justify-start md:justify-end">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								void handleDownloadCsv();
							}}
							disabled={isLoading || isDownloadingCsv || visibleCustomers.length === 0}
							className="min-h-10 rounded-2xl px-4"
						>
							{isDownloadingCsv ? "Downloading..." : "Download CSV"}
						</Button>
					</div>
				) : null}
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
