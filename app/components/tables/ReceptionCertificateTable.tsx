"use client";

import { useEffect, useState } from "react";

import CertificateRecordsTable, { type CertificateTableColumn } from "@/app/components/tables/CertificateRecordsTable";
import { readAuthSession } from "@/app/hooks/useAuth";
import StatusBadge from "@/app/components/ui/StatusBadge";
import TableFilters, {
	DEFAULT_TABLE_SORT_OPTIONS,
	sortTableRows,
	type TableFilterOption,
	type TableSortValue,
} from "@/app/components/ui/TableFilters";
import TableActions from "@/app/components/ui/TableActions";
import { apiFetch, getApiUrl } from "@/app/utils/api";

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
	sortOptions?: ReadonlyArray<TableFilterOption>;
}>;

export default function ReceptionCertificateTable({
	permissions = { canRemove: false },
	sortOptions = DEFAULT_TABLE_SORT_OPTIONS,
}: ReceptionCertificateTableProps) {
	const [rows, setRows] = useState<ReceptionCertificateRow[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [sortValue, setSortValue] = useState<TableSortValue>("date-desc");

	async function loadReceptionCertificates() {
		setErrorMessage("");
		setIsLoading(true);

		try {
			const [certificatesResponse, circularityCertificatesResponse] = await Promise.all([
				apiFetch("/reception-certificates", {
					cache: "no-store",
				}),
				apiFetch("/circularity-certificates", {
					cache: "no-store",
				}),
			]);

			const certificatesPayload = (await certificatesResponse.json()) as Array<{
				id?: number;
				rcidDate?: string;
				rcid?: string;
				rnid?: string;
				linkedRnids?: string[];
				customerId?: string;
				producingCompanyName?: string;
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
				throw new Error(!Array.isArray(certificatesPayload) ? certificatesPayload.detail ?? "Unable to load reception certificates." : "Unable to load reception certificates.");
			}

			if (!circularityCertificatesResponse.ok || !Array.isArray(circularityCertificatesPayload)) {
				throw new Error(
					!Array.isArray(circularityCertificatesPayload)
						? circularityCertificatesPayload.detail ?? "Unable to load circularity certificates."
						: "Unable to load circularity certificates.",
				);
			}

			const circularityCertificateLinks: CircularityCertificateLinkRow[] = circularityCertificatesPayload.map((certificate) => ({
				ccid: String(certificate.ccid ?? ""),
				rcid: String(certificate.rcid ?? ""),
				linkedRcids: Array.isArray(certificate.linkedRcids)
					? certificate.linkedRcids.map((value) => String(value ?? ""))
					: [],
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

	function handleViewCircularityCertificate(circularityCertificateReference: string) {
		setErrorMessage("");
		const session = readAuthSession();

		if (!session?.accessToken) {
			setErrorMessage("Authentication is required to preview that circularity certificate.");
			return;
		}

		if (!circularityCertificateReference.trim()) {
			setErrorMessage("That circularity certificate is missing its PDF reference.");
			return;
		}

		const previewUrl = getApiUrl(
			`/circularity-certificates/${encodeURIComponent(circularityCertificateReference)}/pdf/view?access_token=${encodeURIComponent(session.accessToken)}`,
		);
		window.open(previewUrl, "_blank", "noopener,noreferrer");
	}

	async function handleRemoveReceptionCertificate(rcid: string) {
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

	function handleViewReceptionCertificate(row: ReceptionCertificateRow) {
		setErrorMessage("");
		const session = readAuthSession();
		const receptionCertificateReference = getReceptionCertificatePdfReference(row);

		if (!session?.accessToken) {
			setErrorMessage("Authentication is required to preview that reception certificate.");
			return;
		}

		if (!receptionCertificateReference) {
			setErrorMessage("That reception certificate is missing its PDF reference.");
			return;
		}

		const previewUrl = getApiUrl(
			`/reception-certificates/${encodeURIComponent(receptionCertificateReference)}/pdf/view?access_token=${encodeURIComponent(session.accessToken)}`,
		);
		window.open(previewUrl, "_blank", "noopener,noreferrer");
	}

	async function handleDownloadReceptionCertificate(row: ReceptionCertificateRow) {
		setErrorMessage("");
		const receptionCertificateReference = getReceptionCertificatePdfReference(row);

		if (!receptionCertificateReference) {
			setErrorMessage("That reception certificate is missing its PDF reference.");
			return;
		}

		try {
			const response = await apiFetch(`/reception-certificates/${encodeURIComponent(receptionCertificateReference)}/pdf/download`, {
				cache: "no-store",
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
				throw new Error(payload?.detail ?? "Unable to download that reception certificate right now.");
			}

			const pdfBlob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			const filename = extractDownloadFilename(response.headers.get("Content-Disposition"), row.rcid || "reception-certificate.pdf");

			link.href = downloadUrl;
			link.download = filename;
			link.style.display = "none";
			document.body.append(link);
			link.click();
			link.remove();
			window.setTimeout(() => {
				window.URL.revokeObjectURL(downloadUrl);
			}, 1000);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to download that reception certificate right now.");
		}
	}

	useEffect(() => {
		void loadReceptionCertificates();
	}, []);

	const columns = buildReceptionCertificateColumns({
		canRemove: permissions.canRemove,
		onView: handleViewReceptionCertificate,
		onViewCircularityCertificate: handleViewCircularityCertificate,
		onDownload: handleDownloadReceptionCertificate,
		onRemove: handleRemoveReceptionCertificate,
	});
	const visibleRows = sortTableRows(rows, sortValue, {
		date: (row) => row.rcidDate,
		customerName: (row) => row.producingCompanyName,
	});

	return (
		<CertificateRecordsTable
			columns={columns}
			rows={visibleRows}
			rowKey={(row) => row.rcid}
			isLoading={isLoading}
			errorMessage={errorMessage}
			loadingMessage="Loading reception certificates..."
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

function buildReceptionCertificateColumns({
	canRemove,
	onView,
	onViewCircularityCertificate,
	onDownload,
	onRemove,
}: {
	canRemove: boolean;
	onView: (row: ReceptionCertificateRow) => void;
	onViewCircularityCertificate: (circularityCertificateReference: string) => void;
	onDownload: (row: ReceptionCertificateRow) => void;
	onRemove: (rcid: string) => void;
}): ReadonlyArray<CertificateTableColumn<ReceptionCertificateRow>> {
	const baseColumns: Array<CertificateTableColumn<ReceptionCertificateRow>> = [
		{
			key: "rcidDate",
			label: "RCID Date",
			renderCell: (row) => row.rcidDate,
		},
		{
			key: "rcid",
			label: "RCID",
			cellClassName: "font-medium text-slate-900",
			renderCell: (row) => row.rcid,
		},
		{
			key: "linkedRnids",
			label: "Linked RNIDs",
			renderCell: (row) => formatLinkedIds(row.linkedRnids),
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
			renderCell: (row) => row.rcIssuedBy,
		},
		{
			key: "status",
			label: "Status",
			renderCell: (row) => <StatusBadge status={row.status} />,
		},
		{
			key: "circularityCertificate",
			label: "Circularity Certificate",
			renderCell: (row) => renderCircularityCertificateCell(row.circularityCertificateReference, onViewCircularityCertificate),
		},
		{
			key: "actions",
			label: "Actions",
			cellClassName: "whitespace-nowrap",
			renderCell: (row) => (
				<TableActions
					onView={() => onView(row)}
					onDownload={() => onDownload(row)}
					className="flex-nowrap"
				/>
			),
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
					onClick={() => onRemove(row.rcid)}
					className="min-h-6 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
				>
					Remove
				</button>
			),
		},
	];
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

function extractDownloadFilename(contentDisposition: string | null, fallbackRcid: string) {
	if (!contentDisposition) {
		return ensurePdfFilename(fallbackRcid);
	}

	const matchedFilename = /filename="?([^";]+)"?/i.exec(contentDisposition);
	if (!matchedFilename?.[1]) {
		return ensurePdfFilename(fallbackRcid);
	}

	return ensurePdfFilename(matchedFilename[1]);
}

function ensurePdfFilename(filename: string) {
	const normalizedFilename = filename.trim() || "reception-certificate";
	return normalizedFilename.toLowerCase().endsWith(".pdf") ? normalizedFilename : `${normalizedFilename}.pdf`;
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
