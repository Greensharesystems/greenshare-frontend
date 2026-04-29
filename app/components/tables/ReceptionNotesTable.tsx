"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { readAuthSession } from "@/app/hooks/useAuth";
import StatusBadge from "@/app/components/ui/StatusBadge";
import TableFilters, { DEFAULT_TABLE_SORT_OPTIONS, sortTableRows, type TableSortValue } from "@/app/components/ui/TableFilters";
import TableActions from "@/app/components/ui/TableActions";
import { apiFetch, getApiUrl } from "@/app/utils/api";

const columns: ReadonlyArray<{ key: string; label: ReactNode }> = [
	{ key: "rnidDate", label: "RNID Date" },
	{ key: "rnid", label: "RNID" },
	{
		key: "producingCompanyName",
		label: "Customer Name",
	},
	{ key: "wasteStreamName", label: "Waste Stream Name" },
	{ key: "wasteStreamQuantity", label: "Waste Stream Quantity" },
	{ key: "issuedBy", label: "Issued by" },
	{ key: "status", label: "Status" },
	{ key: "receptionCertificate", label: "Reception Certificate" },
	{ key: "actions", label: "Actions" },
	{ key: "remove", label: "Remove" },
];

type ReceptionNoteWasteStream = Readonly<{
	code: string;
	name: string;
	wasteClass: string;
	physicalState: string;
	quantity: string;
	quantityUnit: string;
	collectionEmirate: string;
	collectionLocation: string;
	receptionDate: string;
}>;

type ReceptionCertificateRow = Readonly<{
	rcid: string;
	rnid: string;
	linkedRnids: ReadonlyArray<string>;
}>;

type ReceptionNoteRow = Readonly<{
	id: number;
	rnidDate: string;
	rnid: string;
	receptionCertificateReference: string;
	customerId: string;
	producingCompanyEmirate: string;
	producingCompanyOfficeAddress: string;
	producingCompanyContactPerson: string;
	producingCompanyOfficePhone: string;
	producingCompanyEmail: string;
	transportingCompanyName: string;
	transportingCompanyContactPerson: string;
	transportingCompanyOfficePhone: string;
	transportingCompanyEmail: string;
	wasteStreams: ReadonlyArray<ReceptionNoteWasteStream>;
	vehiclePlateNo: string;
	driverName: string;
	producingCompanyName: string;
	wasteStreamName: string;
	wasteStreamQuantity: string;
	rnIssuedBy: string;
	status: "Issued" | "Pending" | "Draft";
}>;

export default function ReceptionNotesTable() {
	const [rows, setRows] = useState<ReceptionNoteRow[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [sortValue, setSortValue] = useState<TableSortValue>("date-desc");

	async function loadReceptionNotes() {
		setErrorMessage("");
		setIsLoading(true);

		try {
			const [notesResponse, certificatesResponse] = await Promise.all([
				apiFetch("/reception-notes", {
					cache: "no-store",
				}),
				apiFetch("/reception-certificates", {
					cache: "no-store",
				}),
			]);

			const notesPayload = (await notesResponse.json()) as Array<{
				id?: number;
				rnidDate?: string;
				rnid?: string;
				customerId?: string;
				producingCompanyName?: string;
				producingCompanyEmirate?: string;
				producingCompanyOfficeAddress?: string;
				producingCompanyContactPerson?: string;
				producingCompanyOfficePhone?: string;
				producingCompanyEmail?: string;
				transportingCompanyName?: string;
				transportingCompanyContactPerson?: string;
				transportingCompanyOfficePhone?: string;
				transportingCompanyEmail?: string;
				wasteStreams?: ReceptionNoteWasteStream[];
				vehiclePlateNo?: string;
				driverName?: string;
				wasteStreamName?: string;
				wasteStreamQuantity?: string;
				rnIssuedBy?: string;
				status?: string;
			}> | { detail?: string };
			const certificatesPayload = (await certificatesResponse.json()) as Array<{
				rcid?: string;
				rnid?: string;
				linkedRnids?: string[];
			}> | { detail?: string };

			if (!notesResponse.ok || !Array.isArray(notesPayload)) {
				throw new Error(!Array.isArray(notesPayload) ? notesPayload.detail ?? "Unable to load reception notes." : "Unable to load reception notes.");
			}

			if (!certificatesResponse.ok || !Array.isArray(certificatesPayload)) {
				throw new Error(
					!Array.isArray(certificatesPayload)
						? certificatesPayload.detail ?? "Unable to load reception certificates."
						: "Unable to load reception certificates.",
				);
			}

			const receptionCertificates: ReceptionCertificateRow[] = certificatesPayload.map((certificate) => ({
				rcid: String(certificate.rcid ?? ""),
				rnid: String(certificate.rnid ?? ""),
				linkedRnids: Array.isArray(certificate.linkedRnids)
					? certificate.linkedRnids.map((value) => String(value ?? ""))
					: [],
			}));

			setRows(
				notesPayload.map((note) => ({
					id: Number(note.id ?? 0),
					rnidDate: String(note.rnidDate ?? ""),
					rnid: String(note.rnid ?? ""),
					receptionCertificateReference: getLinkedReceptionCertificateReference(String(note.rnid ?? ""), receptionCertificates),
					customerId: String(note.customerId ?? ""),
					producingCompanyName: String(note.producingCompanyName ?? ""),
					producingCompanyEmirate: String(note.producingCompanyEmirate ?? ""),
					producingCompanyOfficeAddress: String(note.producingCompanyOfficeAddress ?? ""),
					producingCompanyContactPerson: String(note.producingCompanyContactPerson ?? ""),
					producingCompanyOfficePhone: String(note.producingCompanyOfficePhone ?? ""),
					producingCompanyEmail: String(note.producingCompanyEmail ?? ""),
					transportingCompanyName: String(note.transportingCompanyName ?? ""),
					transportingCompanyContactPerson: String(note.transportingCompanyContactPerson ?? ""),
					transportingCompanyOfficePhone: String(note.transportingCompanyOfficePhone ?? ""),
					transportingCompanyEmail: String(note.transportingCompanyEmail ?? ""),
					wasteStreams: Array.isArray(note.wasteStreams)
						? note.wasteStreams.map((stream) => ({
							code: String(stream.code ?? ""),
							name: String(stream.name ?? ""),
							wasteClass: String(stream.wasteClass ?? ""),
							physicalState: String(stream.physicalState ?? ""),
							quantity: String(stream.quantity ?? ""),
							quantityUnit: String(stream.quantityUnit ?? ""),
							collectionEmirate: String((stream as { collectionEmirate?: string }).collectionEmirate ?? ""),
							collectionLocation: String(stream.collectionLocation ?? ""),
							receptionDate: String(stream.receptionDate ?? ""),
						}))
						: [],
					vehiclePlateNo: String(note.vehiclePlateNo ?? ""),
					driverName: String(note.driverName ?? ""),
					wasteStreamName: String(note.wasteStreamName ?? ""),
					wasteStreamQuantity: String(note.wasteStreamQuantity ?? ""),
					rnIssuedBy: String(note.rnIssuedBy ?? ""),
					status: normalizeStatus(String(note.status ?? "Issued")),
				})),
			);
		} catch (error) {
			setRows([]);
			setErrorMessage(error instanceof Error ? error.message : "Unable to load reception notes.");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleRemoveReceptionNote(rnid: string) {
		setErrorMessage("");

		try {
			const response = await apiFetch(`/reception-notes/${encodeURIComponent(rnid)}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const payload = (await response.json()) as { detail?: string };
				throw new Error(payload.detail ?? "Unable to remove that reception note right now.");
			}

			setRows((current) => current.filter((row) => row.rnid !== rnid));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to remove that reception note right now.");
		}
	}

	function handleViewReceptionNote(row: ReceptionNoteRow) {
		setErrorMessage("");
		const session = readAuthSession();

		if (!session?.accessToken) {
			setErrorMessage("Authentication is required to preview that reception note.");
			return;
		}

		const previewUrl = getApiUrl(
			`/reception-notes/${row.id}/pdf/view?access_token=${encodeURIComponent(session.accessToken)}`,
		);
		window.open(previewUrl, "_blank", "noopener,noreferrer");
	}

	async function handleDownloadReceptionNote(row: ReceptionNoteRow) {
		setErrorMessage("");

		try {
			const response = await apiFetch(`/reception-notes/${row.id}/pdf/download`, {
				cache: "no-store",
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
				throw new Error(payload?.detail ?? "Unable to download that reception note right now.");
			}

			const pdfBlob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			const filename = extractDownloadFilename(response.headers.get("Content-Disposition"), row.rnid || "reception-note.pdf");

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
			setErrorMessage(error instanceof Error ? error.message : "Unable to download that reception note right now.");
		}
	}

	function handleViewReceptionCertificate(receptionCertificateReference: string) {
		setErrorMessage("");
		const session = readAuthSession();

		if (!session?.accessToken) {
			setErrorMessage("Authentication is required to preview that reception certificate.");
			return;
		}

		if (!receptionCertificateReference.trim()) {
			setErrorMessage("That reception certificate is missing its PDF reference.");
			return;
		}

		const previewUrl = getApiUrl(
			`/reception-certificates/${encodeURIComponent(receptionCertificateReference)}/pdf/view?access_token=${encodeURIComponent(session.accessToken)}`,
		);
		window.open(previewUrl, "_blank", "noopener,noreferrer");
	}

	useEffect(() => {
		void loadReceptionNotes();
	}, []);

	const visibleRows = sortTableRows(rows, sortValue, {
		date: (row) => row.rnidDate,
		customerName: (row) => row.producingCompanyName,
	});

	return (
		<div className="flex w-full flex-col gap-4">
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
			/>
			{errorMessage ? (
				<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<div className="w-full overflow-x-auto">
				<table className="min-w-full border-collapse text-left text-xs text-slate-700">
					<thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-[0.16em] text-slate-500">
						<tr>
							{columns.map((column) => (
								<th key={column.key} className="px-3 py-2.5 font-semibold">
									{column.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									Loading reception notes...
								</td>
							</tr>
						) : visibleRows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									No data available.
								</td>
							</tr>
						) : visibleRows.map((row) => (
							<tr key={row.rnid} className="border-b border-slate-200 last:border-b-0">
								<td className="px-3 py-2.5 text-slate-600">{row.rnidDate}</td>
								<td className="px-3 py-2.5 font-medium text-slate-900">{row.rnid}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.producingCompanyName}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.wasteStreamName}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.wasteStreamQuantity}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.rnIssuedBy}</td>
								<td className="px-3 py-2.5">
									<StatusBadge status={row.status} />
								</td>
								<td className="px-3 py-2.5">{renderReceptionCertificateCell(row.receptionCertificateReference, handleViewReceptionCertificate)}</td>
								<td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
									<TableActions
										onView={() => handleViewReceptionNote(row)}
										onDownload={() => handleDownloadReceptionNote(row)}
										className="flex-nowrap"
									/>
								</td>
								<td className="px-3 py-2.5 text-slate-600">
									<button
										type="button"
										onClick={() => handleRemoveReceptionNote(row.rnid)}
										className="min-h-6 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
									>
										Remove
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function normalizeStatus(status: string): ReceptionNoteRow["status"] {
	if (status === "Draft") {
		return status;
	}

	return "Issued";
}

function getLinkedReceptionCertificateReference(rnid: string, certificates: ReadonlyArray<ReceptionCertificateRow>) {
	const normalizedRnid = rnid.trim();

	if (!normalizedRnid) {
		return "";
	}

	const linkedCertificate = certificates.find((certificate) =>
		getLinkedRnids(certificate).includes(normalizedRnid),
	);

	return linkedCertificate?.rcid?.trim() ?? "";
}

function getLinkedRnids(certificate: ReceptionCertificateRow) {
	if (Array.isArray(certificate.linkedRnids) && certificate.linkedRnids.length > 0) {
		return certificate.linkedRnids.map((value) => String(value ?? "").trim()).filter(Boolean);
	}

	return String(certificate.rnid ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

function renderReceptionCertificateCell(
	receptionCertificateReference: string,
	onView: (receptionCertificateReference: string) => void,
) {
	if (!receptionCertificateReference) {
		return <StatusBadge status="Pending" />;
	}

	return (
		<button
			type="button"
			onClick={() => onView(receptionCertificateReference)}
			className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-emerald-300 hover:bg-emerald-100"
		>
			{receptionCertificateReference}
		</button>
	);
}


function extractDownloadFilename(contentDisposition: string | null, fallbackRnid: string) {
	if (!contentDisposition) {
		return ensurePdfFilename(fallbackRnid);
	}

	const matchedFilename = /filename="?([^";]+)"?/i.exec(contentDisposition);
	if (!matchedFilename?.[1]) {
		return ensurePdfFilename(fallbackRnid);
	}

	return ensurePdfFilename(matchedFilename[1]);
}

function ensurePdfFilename(filename: string) {
	const normalizedFilename = filename.trim() || "reception-note";
	return normalizedFilename.toLowerCase().endsWith(".pdf") ? normalizedFilename : `${normalizedFilename}.pdf`;
}
