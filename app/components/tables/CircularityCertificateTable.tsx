"use client";

import { useEffect, useState } from "react";

import CertificateRecordsTable, { type CertificateTableColumn } from "@/app/components/tables/CertificateRecordsTable";
import type { CertificateTablePermissions } from "@/app/components/tables/ReceptionCertificateTable";
import { readAuthSession } from "@/app/hooks/useAuth";
import StatusBadge from "@/app/components/ui/StatusBadge";
import TableFilters, {
	DEFAULT_TABLE_SORT_OPTIONS,
	sortTableRows,
	type TableFilterOption,
	type TableSortValue,
} from "@/app/components/ui/TableFilters";
import TableActions from "@/app/components/ui/TableActions";
import { apiFetch, downloadPdfWithAuth, openPdfWithAuth } from "@/app/utils/api";

type CircularityCertificateRow = Readonly<{
	id: number;
	ccidDate: string;
	ccid: string;
	rcid: string;
	linkedRcids: ReadonlyArray<string>;
	cid: string;
	producingCompanyName: string;
	wasteStreamQuantity: string;
	secondaryProduct: string;
	secondaryLoop: string;
	ccIssuedBy: string;
	status: "Issued" | "Pending" | "Draft";
}>;

type CircularityCertificateTableProps = Readonly<{
	permissions?: CertificateTablePermissions;
	sortOptions?: ReadonlyArray<TableFilterOption>;
}>;

export default function CircularityCertificateTable({
	permissions = { canRemove: false },
	sortOptions = DEFAULT_TABLE_SORT_OPTIONS,
}: CircularityCertificateTableProps) {
	const [rows, setRows] = useState<CircularityCertificateRow[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
	const [sortValue, setSortValue] = useState<TableSortValue>("date-desc");

	async function loadCircularityCertificates() {
		setErrorMessage("");
		setIsLoading(true);

		try {
			const response = await apiFetch("/circularity-certificates", {
				cache: "no-store",
			});
			const payload = (await response.json()) as Array<{
				id?: number;
				ccidDate?: string;
				ccid?: string;
				rcid?: string;
				linkedRcids?: string[];
				cid?: string;
				producingCompanyName?: string;
				wasteStreamQuantity?: string;
				secondaryProduct?: string;
				secondaryLoop?: string;
				issuedBy?: string;
				status?: string;
			}> | { detail?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) ? payload.detail ?? "Unable to load circularity certificates." : "Unable to load circularity certificates.");
			}

			setRows(payload.map((certificate) => ({
				id: Number(certificate.id ?? 0),
				ccidDate: String(certificate.ccidDate ?? ""),
				ccid: String(certificate.ccid ?? ""),
				rcid: String(certificate.rcid ?? ""),
				linkedRcids: Array.isArray(certificate.linkedRcids) ? certificate.linkedRcids.map((value) => String(value ?? "")) : [],
				cid: String(certificate.cid ?? ""),
				producingCompanyName: String(certificate.producingCompanyName ?? ""),
				wasteStreamQuantity: String(certificate.wasteStreamQuantity ?? ""),
				secondaryProduct: String(certificate.secondaryProduct ?? ""),
				secondaryLoop: String(certificate.secondaryLoop ?? ""),
				ccIssuedBy: String(certificate.issuedBy ?? ""),
				status: normalizeStatus(String(certificate.status ?? "Issued")),
			})));
		} catch (error) {
			setRows([]);
			setErrorMessage(error instanceof Error ? error.message : "Unable to load circularity certificates.");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleViewCircularityCertificate(row: CircularityCertificateRow) {
		clearCircularityCertificateError();
		const session = readAuthSession();
		const circularityCertificateReference = getCircularityCertificatePdfReference(row);

		if (!session?.accessToken) {
			setCircularityCertificateError("Authentication is required to preview that circularity certificate.");
			return;
		}

		if (!circularityCertificateReference) {
			setCircularityCertificateError("That circularity certificate is missing its PDF reference.");
			return;
		}

		try {
			setActiveActionKey(`view:${circularityCertificateReference}`);
			await openPdfWithAuth({
				pdfType: "circularity-certificate",
				documentId: circularityCertificateReference,
				path: `/circularity-certificates/${encodeURIComponent(circularityCertificateReference)}/pdf/view`,
				fallbackErrorMessage: "Unable to preview that circularity certificate right now.",
			});
			clearCircularityCertificateError();
		} catch (error) {
			setCircularityCertificateError(error instanceof Error ? error.message : "Unable to preview that circularity certificate right now.");
		} finally {
			setActiveActionKey((current) => (current === `view:${circularityCertificateReference}` ? null : current));
		}
	}

	async function handleDownloadCircularityCertificate(row: CircularityCertificateRow) {
		clearCircularityCertificateError();
		const circularityCertificateReference = getCircularityCertificatePdfReference(row);

		if (!circularityCertificateReference) {
			setCircularityCertificateError("That circularity certificate is missing its PDF reference.");
			return;
		}

		try {
			const pdfPath = `/circularity-certificates/${encodeURIComponent(circularityCertificateReference)}/pdf/download`;
			setActiveActionKey(`download:${circularityCertificateReference}`);

			await downloadPdfWithAuth({
				pdfType: "circularity-certificate",
				documentId: circularityCertificateReference,
				path: pdfPath,
				fallbackErrorMessage: "Unable to download that circularity certificate right now.",
				fallbackFilename: row.ccid || "circularity-certificate.pdf",
			});
			clearCircularityCertificateError();
		} catch (error) {
			setCircularityCertificateError(error instanceof Error ? error.message : "Unable to download that circularity certificate right now.");
		} finally {
			setActiveActionKey((current) => (current === `download:${circularityCertificateReference}` ? null : current));
		}
	}

	async function handleRemoveCircularityCertificate(ccid: string) {
		clearCircularityCertificateError();

		try {
			const response = await apiFetch(`/circularity-certificates/${encodeURIComponent(ccid)}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const payload = (await response.json()) as { detail?: string };
				throw new Error(payload.detail ?? "Unable to remove that circularity certificate right now.");
			}

			setRows((current) => current.filter((row) => row.ccid !== ccid));
		} catch (error) {
			setCircularityCertificateError(error instanceof Error ? error.message : "Unable to remove that circularity certificate right now.");
		}
	}

	function clearCircularityCertificateError() {
		setErrorMessage("");
	}

	function setCircularityCertificateError(message: string) {
		setErrorMessage(message);
	}

	useEffect(() => {
		void loadCircularityCertificates();
	}, []);

	const columns = buildCircularityCertificateColumns({
		canRemove: permissions.canRemove,
		activeActionKey,
		onView: handleViewCircularityCertificate,
		onDownload: handleDownloadCircularityCertificate,
		onRemove: handleRemoveCircularityCertificate,
	});
	const visibleRows = sortTableRows(rows, sortValue, {
		date: (row) => row.ccidDate,
		customerName: (row) => row.producingCompanyName,
	});

	return (
		<CertificateRecordsTable
			columns={columns}
			rows={visibleRows}
			rowKey={(row) => row.ccid}
			isLoading={isLoading}
			errorMessage={errorMessage}
			loadingMessage="Loading circularity certificates..."
			emptyMessage="No data available."
			topContent={(
				<TableFilters
					title="Table Filters"
					controls={[
						{
							key: "sort",
							type: "select",
							label: "Sort by",
							options: sortOptions,
						},
					]}
					values={{ sort: sortValue }}
					onChange={(_, value) => setSortValue(value as TableSortValue)}
				/>
			)}
		/>
	);
}


function buildCircularityCertificateColumns({
	canRemove,
	activeActionKey,
	onView,
	onDownload,
	onRemove,
}: {
	canRemove: boolean;
	activeActionKey: string | null;
	onView: (row: CircularityCertificateRow) => void;
	onDownload: (row: CircularityCertificateRow) => void;
	onRemove: (ccid: string) => void;
}): ReadonlyArray<CertificateTableColumn<CircularityCertificateRow>> {
	const baseColumns: Array<CertificateTableColumn<CircularityCertificateRow>> = [
		{
			key: "ccidDate",
			label: "CCID Date",
			renderCell: (row) => row.ccidDate,
		},
		{
			key: "ccid",
			label: "CCID",
			cellClassName: "font-medium text-slate-900",
			renderCell: (row) => row.ccid,
		},
		{
			key: "linkedRcids",
			label: "Linked RCIDs",
			renderCell: (row) => formatLinkedIds(row.linkedRcids),
		},
		{
			key: "producingCompanyName",
			label: "Customer Name",
			renderCell: (row) => row.producingCompanyName,
		},
		{
			key: "wasteStreamQuantity",
			label: "Waste Stream Quantity",
			renderCell: (row) => row.wasteStreamQuantity,
		},
		{
			key: "issuedBy",
			label: "Issued by",
			renderCell: (row) => row.ccIssuedBy,
		},
		{
			key: "status",
			label: "Status",
			renderCell: (row) => <StatusBadge status={row.status} />,
		},
		{
			key: "actions",
			label: "Actions",
			cellClassName: "whitespace-nowrap",
			renderCell: (row) => {
				const circularityCertificateReference = getCircularityCertificatePdfReference(row);
				const isRowBusy = activeActionKey === `view:${circularityCertificateReference}` || activeActionKey === `download:${circularityCertificateReference}`;
				return (
					<TableActions
						onView={() => onView(row)}
						onDownload={() => onDownload(row)}
						viewLabel={activeActionKey === `view:${circularityCertificateReference}` ? "Generating PDF..." : "View"}
						downloadLabel={activeActionKey === `download:${circularityCertificateReference}` ? "Generating PDF..." : "Download"}
						viewDisabled={isRowBusy}
						downloadDisabled={isRowBusy}
						className="flex-nowrap"
					/>
				);
			},
		},
	];

	if (!canRemove) {
		return baseColumns;
	}

	return [
		...baseColumns,
		{
			key: "remove",
			label: "Remove",
			renderCell: (row) => (
				<button
					type="button"
					onClick={() => onRemove(row.ccid)}
						className="min-h-6 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
						disabled={activeActionKey === `view:${row.ccid.trim()}` || activeActionKey === `download:${row.ccid.trim()}`}
				>
					Remove
				</button>
			),
		},
	];
}

function normalizeStatus(status: string): CircularityCertificateRow["status"] {
	if (status === "Draft") {
		return status;
	}

	return "Issued";
}

function formatLinkedIds(values: ReadonlyArray<string>) {
	return values.filter(Boolean).join(", ") || "-";
}

function getCircularityCertificatePdfReference(row: CircularityCertificateRow) {
	if (row.ccid.trim()) {
		return row.ccid.trim();
	}

	if (Number.isInteger(row.id) && row.id > 0) {
		return String(row.id);
	}

	return "";
}
