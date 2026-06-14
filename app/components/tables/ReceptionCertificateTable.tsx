"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Loader2, Pencil, Search, Trash2, X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { readAuthSession } from "@/app/hooks/useAuth";
import { apiFetch, downloadPdfWithAuth, openPdfWithAuth } from "@/app/utils/api";

export type CertificateTablePermissions = Readonly<{
	canRemove: boolean;
}>;

type ReceptionCertificateRow = Readonly<{
	id: number;
	rcidDate: string;
	rcid: string;
	rnid: string;
	linkedRnids: ReadonlyArray<string>;
	circularityCertificateReference: string;
	customerId: string;
	producingCompanyName: string;
	referringCompany: string;
	projectName: string;
	wasteStreamName: string;
	wasteStreamClass: string;
	wasteStreamQuantity: string;
	rcIssuedBy: string;
	status: "Issued" | "Pending" | "Draft";
}>;

type CircularityCertificateLinkRow = Readonly<{
	ccid: string;
	rcid: string;
	linkedRcids: ReadonlyArray<string>;
}>;

type ReceptionCertificateTableProps = Readonly<{
	permissions?: CertificateTablePermissions;
}>;

const TOTAL_COLUMNS = 13;
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export default function ReceptionCertificateTable({}: ReceptionCertificateTableProps) {
	const router = useRouter();
	const session = readAuthSession();
	const role = session?.role?.toLowerCase() ?? "customer";

	const [rows, setRows] = useState<ReceptionCertificateRow[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
	const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
	const [confirmRemoveRcid, setConfirmRemoveRcid] = useState<string | null>(null);

	const [rcidDateFilter, setRcidDateFilter] = useState("All");
	const [rcidSearch, setRcidSearch] = useState("");
	const [nameSearch, setNameSearch] = useState("");
	const [pageSize, setPageSize] = useState<number>(10);
	const [currentPage, setCurrentPage] = useState(0);

	const rcidDateOptions = useMemo(() => {
		const optionMap = new Map<string, number>();
		for (const row of rows) {
			const opt = toMonthYearOption(row.rcidDate);
			if (opt && !optionMap.has(opt)) {
				const parts = row.rcidDate.split("-");
				if (parts.length === 3) {
					const sortKey = parseInt(parts[2] ?? "0", 10) * 12 + parseInt(parts[1] ?? "0", 10);
					optionMap.set(opt, sortKey);
				}
			}
		}
		const sorted = [...optionMap.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([opt]) => opt);
		return ["All", ...sorted];
	}, [rows]);

	const filteredRows = useMemo(() => {
		return rows.filter((row) => {
			if (rcidDateFilter !== "All") {
				if (toMonthYearOption(row.rcidDate) !== rcidDateFilter) return false;
			}
			if (rcidSearch.trim()) {
				if (!row.rcid.toLowerCase().includes(rcidSearch.toLowerCase().trim())) return false;
			}
			if (nameSearch.trim()) {
				const search = nameSearch.toLowerCase().trim();
				const matchesName =
					row.producingCompanyName.toLowerCase().includes(search) ||
					row.referringCompany.toLowerCase().includes(search) ||
					row.projectName.toLowerCase().includes(search);
				if (!matchesName) return false;
			}
			return true;
		});
	}, [rows, rcidDateFilter, rcidSearch, nameSearch]);

	const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(currentPage, totalPages - 1);
	const pageStart = safePage * pageSize;
	const pageEnd = Math.min(pageStart + pageSize, filteredRows.length);
	const visibleRows = filteredRows.slice(pageStart, pageEnd);

	function resetPage() {
		setCurrentPage(0);
	}

	async function loadReceptionCertificates() {
		setErrorMessage("");
		setIsLoading(true);

		try {
			const [certificatesResponse, circularityCertificatesResponse] = await Promise.all([
				apiFetch("/reception-certificates", { cache: "no-store" }),
				apiFetch("/circularity-certificates", { cache: "no-store" }),
			]);

			const certificatesPayload = (await certificatesResponse.json()) as Array<{
				id?: number;
				rcidDate?: string;
				rcid?: string;
				rnid?: string;
				linkedRnids?: string[];
				customerId?: string;
				producingCompanyName?: string;
				referringCompany?: string | null;
				projectName?: string | null;
				wasteStreamName?: string | null;
				wasteStreamClass?: string | null;
				wasteStreamQuantity?: string;
				rcIssuedBy?: string;
				status?: string;
			}> | { detail?: string };

			const circularityCertificatesPayload = (await circularityCertificatesResponse.json()) as Array<{
				ccid?: string;
				rcid?: string;
				linkedRcids?: string[];
			}> | { detail?: string };

			if (!certificatesResponse.ok || !Array.isArray(certificatesPayload)) {
				throw new Error(!Array.isArray(certificatesPayload) ? (certificatesPayload.detail ?? "Unable to load reception certificates.") : "Unable to load reception certificates.");
			}

			if (!circularityCertificatesResponse.ok || !Array.isArray(circularityCertificatesPayload)) {
				throw new Error(
					!Array.isArray(circularityCertificatesPayload)
						? (circularityCertificatesPayload.detail ?? "Unable to load circularity certificates.")
						: "Unable to load circularity certificates.",
				);
			}

			const circularityCertificateLinks: CircularityCertificateLinkRow[] = circularityCertificatesPayload.map((certificate) => ({
				ccid: String(certificate.ccid ?? ""),
				rcid: String(certificate.rcid ?? ""),
				linkedRcids: Array.isArray(certificate.linkedRcids) ? certificate.linkedRcids.map((value) => String(value ?? "")) : [],
			}));

			setRows(certificatesPayload.map((certificate) => ({
				id: Number(certificate.id ?? 0),
				rcidDate: String(certificate.rcidDate ?? ""),
				rcid: String(certificate.rcid ?? ""),
				rnid: String(certificate.rnid ?? ""),
				linkedRnids: Array.isArray(certificate.linkedRnids) ? certificate.linkedRnids.map((value) => String(value ?? "")) : [],
				circularityCertificateReference: getLinkedCircularityCertificateReference(String(certificate.rcid ?? ""), circularityCertificateLinks),
				customerId: String(certificate.customerId ?? ""),
				producingCompanyName: String(certificate.producingCompanyName ?? ""),
				referringCompany: String(certificate.referringCompany ?? ""),
				projectName: String(certificate.projectName ?? ""),
				wasteStreamName: String(certificate.wasteStreamName ?? ""),
				wasteStreamClass: String(certificate.wasteStreamClass ?? ""),
				wasteStreamQuantity: String(certificate.wasteStreamQuantity ?? ""),
				rcIssuedBy: String(certificate.rcIssuedBy ?? ""),
				status: normalizeStatus(String(certificate.status ?? "Issued")),
			})));
		} catch (error) {
			setRows([]);
			setErrorMessage(error instanceof Error ? error.message : "Unable to load reception certificates.");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleConfirmedRemove(rcid: string) {
		setConfirmRemoveRcid(null);
		setErrorMessage("");

		try {
			const response = await apiFetch(`/reception-certificates/${encodeURIComponent(rcid)}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const payload = (await response.json()) as { detail?: string };
				throw new Error(payload.detail ?? "Unable to remove that reception certificate right now.");
			}

			setRows((current) => current.filter((row) => row.rcid !== rcid));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to remove that reception certificate right now.");
		}
	}

	async function handleViewReceptionCertificate(row: ReceptionCertificateRow) {
		const ref = getReceptionCertificatePdfReference(row);
		setErrorMessage("");

		if (!session?.accessToken) {
			setErrorMessage("Authentication is required to preview that reception certificate.");
			return;
		}

		if (!ref) {
			setErrorMessage("That reception certificate is missing its PDF reference.");
			return;
		}

		try {
			setActiveActionKey(`view:${ref}`);
			await openPdfWithAuth({
				pdfType: "reception-certificate",
				documentId: ref,
				path: `/reception-certificates/${encodeURIComponent(ref)}/pdf/view`,
				fallbackErrorMessage: "Unable to preview that reception certificate right now.",
			});
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to preview that reception certificate right now.");
		} finally {
			setActiveActionKey((current) => (current === `view:${ref}` ? null : current));
		}
	}

	async function handleDownloadReceptionCertificate(row: ReceptionCertificateRow) {
		const ref = getReceptionCertificatePdfReference(row);
		setErrorMessage("");

		if (!ref) {
			setErrorMessage("That reception certificate is missing its PDF reference.");
			return;
		}

		try {
			setActiveActionKey(`download:${ref}`);
			await downloadPdfWithAuth({
				pdfType: "reception-certificate",
				documentId: ref,
				path: `/reception-certificates/${encodeURIComponent(ref)}/pdf/download`,
				fallbackErrorMessage: "Unable to download that reception certificate right now.",
				fallbackFilename: row.rcid || "reception-certificate.pdf",
			});
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to download that reception certificate right now.");
		} finally {
			setActiveActionKey((current) => (current === `download:${ref}` ? null : current));
		}
	}

	async function handleViewCircularityCertificate(ccRef: string) {
		setErrorMessage("");

		if (!ccRef.trim()) {
			setErrorMessage("That circularity certificate is missing its PDF reference.");
			return;
		}

		if (!session?.accessToken) {
			setErrorMessage("Authentication is required to preview that circularity certificate.");
			return;
		}

		try {
			await openPdfWithAuth({
				pdfType: "circularity-certificate",
				documentId: ccRef,
				path: `/circularity-certificates/${encodeURIComponent(ccRef)}/pdf/view`,
				fallbackErrorMessage: "Unable to preview that circularity certificate right now.",
			});
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to preview that circularity certificate right now.");
		}
	}

	function handleEditReceptionCertificate(row: ReceptionCertificateRow) {
		const rcid = row.rcid.trim();
		if (!rcid) return;
		const basePath = role === "admin" ? "/admin/traceability/reception-certificate" : "/employee/reception-certificate";
		router.push(`${basePath}/${encodeURIComponent(rcid)}/edit`);
	}

	function handleDownloadCsv() {
		setIsDownloadingCsv(true);
		try {
			const headers = [
				"RCID Date", "RCID", "Linked RNIDs", "Producing Company", "Referring Company",
				"Project Name", "Waste Stream Name", "Waste Stream Class", "Waste Stream Qty",
				"RC Status", "Issued By", "Circularity Certificate Status",
			];
			const csvData = filteredRows.map((row) => [
				row.rcidDate,
				row.rcid,
				formatLinkedIds(row.linkedRnids),
				row.producingCompanyName,
				row.referringCompany,
				row.projectName,
				row.wasteStreamName,
				row.wasteStreamClass,
				row.wasteStreamQuantity,
				row.status,
				row.rcIssuedBy,
				row.circularityCertificateReference ? "Issued" : "Pending",
			]);
			const csvContent = [headers, ...csvData]
				.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
				.join("\n");
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "reception-certificates.csv";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} finally {
			setIsDownloadingCsv(false);
		}
	}

	useEffect(() => {
		void loadReceptionCertificates();
	}, []);

	const confirmTarget = confirmRemoveRcid ? rows.find((r) => r.rcid === confirmRemoveRcid) : null;

	return (
		<>
			{confirmRemoveRcid !== null ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
						<h2 className="mb-2 text-lg font-semibold text-slate-900">Remove Reception Certificate</h2>
						<p className="mb-5 text-sm text-slate-600">
							Are you sure you want to remove{" "}
							<span className="font-medium text-slate-900">{confirmTarget?.rcid ?? confirmRemoveRcid}</span>? This action cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="secondary" size="sm" onClick={() => setConfirmRemoveRcid(null)}>
								Cancel
							</Button>
							<Button variant="danger" size="sm" onClick={() => void handleConfirmedRemove(confirmRemoveRcid)}>
								Remove
							</Button>
						</div>
					</div>
				</div>
			) : null}

			<div className="flex w-full flex-col gap-4">
				<div className="flex flex-wrap items-end gap-3">
					<label className="flex w-44 flex-col gap-1.5">
						<span className="text-[11px] font-semibold text-slate-500">RCID Date</span>
						<select
							value={rcidDateFilter}
							onChange={(e) => { setRcidDateFilter(e.target.value); resetPage(); }}
							className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
						>
							{rcidDateOptions.map((opt) => (
								<option key={opt} value={opt}>{opt}</option>
							))}
						</select>
					</label>

					<label className="flex w-52 flex-col gap-1.5">
						<span className="text-[11px] font-semibold text-slate-500">RCID</span>
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
							<input
								type="text"
								value={rcidSearch}
								onChange={(e) => { setRcidSearch(e.target.value); resetPage(); }}
								placeholder="Search RCID..."
								className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
							/>
						</div>
					</label>

					<label className="flex w-52 flex-col gap-1.5">
						<span className="text-[11px] font-semibold text-slate-500">Customer Name</span>
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
							<input
								type="text"
								value={nameSearch}
								onChange={(e) => { setNameSearch(e.target.value); resetPage(); }}
								placeholder="Search name..."
								className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
							/>
						</div>
					</label>

					<div className="ml-auto flex items-end gap-2">
						<Button
							variant="secondary"
							size="sm"
							className="min-h-9 rounded-xl px-3 text-[12px]"
							onClick={handleDownloadCsv}
							disabled={isLoading || isDownloadingCsv || filteredRows.length === 0}
						>
							<Download className="h-3.5 w-3.5" />
							{isDownloadingCsv ? "Downloading..." : "Export"}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							className="min-h-9 rounded-xl px-3 text-[12px]"
							onClick={() => { setRcidDateFilter("All"); setRcidSearch(""); setNameSearch(""); setCurrentPage(0); }}
						>
							<X className="h-3.5 w-3.5" />
							Clear Filters
						</Button>
					</div>
				</div>

				{errorMessage ? (
					<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
				) : null}

				<div className="w-full overflow-x-auto">
					<table className="min-w-full border-collapse text-left text-xs text-slate-700">
						<thead className="sticky top-0 z-10 bg-slate-50">
							<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
								<HeaderCell rowSpan={2} label="RCID Date" />
								<HeaderCell rowSpan={2} label="RCID" />
								<HeaderCell rowSpan={2} label="Linked RNIDs" />
								<GroupHeader label="Customer Name" colSpan={3} />
								<GroupHeader label="Waste Stream Details" colSpan={3} />
								<HeaderCell rowSpan={2} label="RC Status" />
								<HeaderCell rowSpan={2} label="Issued By" />
								<HeaderCell rowSpan={2} label={<><span className="block">Circularity</span><span className="block">Certificate</span></>} />
								<HeaderCell rowSpan={2} label="Actions" centered />
							</tr>
							<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
								<HeaderCell label="Producing Company" />
								<HeaderCell label="Referring Company" />
								<HeaderCell label="Project Name" />
								<HeaderCell label="Name" />
								<HeaderCell label="Class" />
								<HeaderCell label="Qty" />
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr>
									<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
										Loading reception certificates...
									</td>
								</tr>
							) : visibleRows.length === 0 ? (
								<tr>
									<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
										No data available.
									</td>
								</tr>
							) : visibleRows.map((row) => {
								const ref = getReceptionCertificatePdfReference(row);
								const isViewBusy = activeActionKey === `view:${ref}`;
								const isDownloadBusy = activeActionKey === `download:${ref}`;
								return (
									<tr key={row.rcid} className="bg-white transition hover:bg-slate-50/80">
										<DataCell>{row.rcidDate || "N/A"}</DataCell>
										<DataCell className="font-medium text-slate-900">{row.rcid || "N/A"}</DataCell>
										<DataCell>{formatLinkedIds(row.linkedRnids)}</DataCell>
										<DataCell>{row.producingCompanyName || "N/A"}</DataCell>
										<DataCell>{row.referringCompany || "—"}</DataCell>
										<DataCell>{row.projectName || "—"}</DataCell>
										<DataCell>{row.wasteStreamName || "—"}</DataCell>
										<DataCell>{row.wasteStreamClass || "—"}</DataCell>
										<DataCell>{row.wasteStreamQuantity || "—"}</DataCell>
										<DataCell>
											<StatusBadge status={row.status === "Issued" ? "Issued" : "Pending"} />
										</DataCell>
										<DataCell>{row.rcIssuedBy || "N/A"}</DataCell>
										<DataCell>
											{renderCircularityCertificateCell(row.circularityCertificateReference, handleViewCircularityCertificate)}
										</DataCell>
										<DataCell centered>
											<div className="flex items-center justify-center gap-1">
												<ActionButton
													label={isViewBusy ? "Loading PDF preview..." : "View"}
													onClick={() => void handleViewReceptionCertificate(row)}
													disabled={isLoading || isViewBusy}
												>
													{isViewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
												</ActionButton>
												<ActionButton
													label={isDownloadBusy ? "Downloading PDF..." : "Download"}
													onClick={() => void handleDownloadReceptionCertificate(row)}
													disabled={isLoading || isDownloadBusy}
												>
													{isDownloadBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
												</ActionButton>
												{(role === "admin" || role === "employee") ? (
													<ActionButton
														label="Edit"
														onClick={() => handleEditReceptionCertificate(row)}
														disabled={isLoading}
													>
														<Pencil className="h-3.5 w-3.5" />
													</ActionButton>
												) : null}
												{role === "admin" ? (
													<ActionButton
														label="Remove"
														danger
														onClick={() => setConfirmRemoveRcid(row.rcid)}
														disabled={isLoading}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</ActionButton>
												) : null}
											</div>
										</DataCell>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
					<div className="flex items-center gap-2">
						<span className="text-[12px] text-slate-500">Rows per page:</span>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<button
								key={size}
								type="button"
								onClick={() => { setPageSize(size); setCurrentPage(0); }}
								className={`h-7 min-w-7 rounded-lg border px-2 text-[12px] font-medium transition ${
									pageSize === size
										? "border-[#36B44D] bg-[#36B44D]/10 text-[#36B44D]"
										: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
								}`}
							>
								{size}
							</button>
						))}
					</div>

					<div className="flex items-center gap-3">
						{filteredRows.length > 0 ? (
							<span className="text-[12px] text-slate-500">
								Showing {pageStart + 1}–{pageEnd} of {filteredRows.length}
							</span>
						) : null}
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
								disabled={safePage === 0}
								className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
							>
								‹
							</button>
							<button
								type="button"
								onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
								disabled={safePage >= totalPages - 1}
								className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
							>
								›
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}


function toMonthYearOption(dateStr: string): string {
	if (!dateStr) return "";
	const parts = dateStr.split("-");
	if (parts.length !== 3) return "";
	const [day, month, year] = parts;
	const date = new Date(`${year ?? ""}-${month ?? ""}-${day ?? ""}`);
	if (isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}




function normalizeStatus(status: string): ReceptionCertificateRow["status"] {
	if (status === "Draft") {
		return status;
	}

	return "Issued";
}

function formatLinkedIds(values: ReadonlyArray<string>) {
	return values.filter(Boolean).join(", ") || "-";
}

function getLinkedCircularityCertificateReference(
	rcid: string,
	certificates: ReadonlyArray<CircularityCertificateLinkRow>,
) {
	const normalizedRcid = rcid.trim();

	if (!normalizedRcid) {
		return "";
	}

	const linkedCertificate = certificates.find((certificate) =>
		getLinkedRcids(certificate).includes(normalizedRcid),
	);

	return linkedCertificate?.ccid?.trim() ?? "";
}

function getLinkedRcids(certificate: CircularityCertificateLinkRow) {
	if (Array.isArray(certificate.linkedRcids) && certificate.linkedRcids.length > 0) {
		return certificate.linkedRcids.map((value) => String(value ?? "").trim()).filter(Boolean);
	}

	return String(certificate.rcid ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

function renderCircularityCertificateCell(
	circularityCertificateReference: string,
	onView: (circularityCertificateReference: string) => void,
) {
	if (!circularityCertificateReference) {
		return <StatusBadge status="Pending" />;
	}

	return (
		<button
			type="button"
			onClick={() => onView(circularityCertificateReference)}
			className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-emerald-300 hover:bg-emerald-100"
		>
			{circularityCertificateReference}
		</button>
	);
}

function getReceptionCertificatePdfReference(row: ReceptionCertificateRow) {
	if (row.rcid.trim()) {
		return row.rcid.trim();
	}

	if (Number.isInteger(row.id) && row.id > 0) {
		return String(row.id);
	}

	return "";
}

function HeaderCell({
	label,
	rowSpan,
	centered = false,
}: Readonly<{ label: React.ReactNode; rowSpan?: number; centered?: boolean }>) {
	return (
		<th
			rowSpan={rowSpan}
			className={`border-b border-r border-slate-200 bg-slate-50 px-2 py-2 align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 whitespace-nowrap last:border-r-0${
				centered ? " text-center" : " text-left"
			}`}
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
			className={`border-b border-r border-slate-200 px-2 py-2 align-middle text-[12px] whitespace-nowrap text-slate-700 last:border-r-0${
				centered ? " text-center" : ""
			}${className ? ` ${className}` : ""}`}
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

