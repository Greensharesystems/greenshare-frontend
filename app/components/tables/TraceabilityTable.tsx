"use client";

import { useEffect, useState } from "react";

import { readAuthSession } from "@/app/hooks/useAuth";
import StatusBadge from "@/app/components/ui/StatusBadge";
import TableFilters, { DATE_ONLY_TABLE_SORT_OPTIONS, sortTableRows, type TableSortValue } from "@/app/components/ui/TableFilters";
import { apiFetch, getApiUrl } from "@/app/utils/api";

const columns = [
	"RNID Date",
	"RNID",
	"RNID Status",
	"RCID Date",
	"RCID",
	"RCID Status",
	"CCID Date",
	"CCID",
	"CCID Status",
];

type TraceabilityStatus = "Issued" | "Pending";

type TraceabilityRow = Readonly<{
	rnidDate: string;
	rnid: string;
	rnidReference: string;
	rnidStatus: TraceabilityStatus;
	rcidDate: string;
	rcid: string;
	rcidReference: string;
	rcidStatus: TraceabilityStatus;
	ccidDate: string;
	ccid: string;
	ccidReference: string;
	ccidStatus: TraceabilityStatus;
}>;

type ReceptionNoteRow = Readonly<{
	id?: number;
	rnid?: string;
	rnidDate?: string;
	status?: string;
}>;

type ReceptionCertificateRow = Readonly<{
	id?: number;
	rcidDate?: string;
	rcid?: string;
	rnid?: string;
	linkedRnids?: ReadonlyArray<string>;
	status?: string;
}>;

type CircularityCertificateRow = Readonly<{
	id?: number;
	ccidDate?: string;
	ccid?: string;
	rcid?: string;
	linkedRcids?: ReadonlyArray<string>;
	status?: string;
}>;

export default function TraceabilityTable() {
	const [rows, setRows] = useState<ReadonlyArray<TraceabilityRow>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");
	const [sortValue, setSortValue] = useState<TableSortValue>("date-desc");

	function openDocumentPreview(kind: "reception-note" | "reception-certificate" | "circularity-certificate", reference: string) {
		setErrorMessage("");
		const session = readAuthSession();

		if (!session?.accessToken) {
			setErrorMessage("Authentication is required to preview that document.");
			return;
		}

		const normalizedReference = reference.trim();
		if (!normalizedReference) {
			setErrorMessage("That document is missing its PDF reference.");
			return;
		}

		const path =
			kind === "reception-note"
				? `/reception-notes/${encodeURIComponent(normalizedReference)}/pdf/view?access_token=${encodeURIComponent(session.accessToken)}`
				: kind === "reception-certificate"
					? `/reception-certificates/${encodeURIComponent(normalizedReference)}/pdf/view?access_token=${encodeURIComponent(session.accessToken)}`
					: `/circularity-certificates/${encodeURIComponent(normalizedReference)}/pdf/view?access_token=${encodeURIComponent(session.accessToken)}`;

		window.open(getApiUrl(path), "_blank", "noopener,noreferrer");
	}

	useEffect(() => {
		let isMounted = true;

		async function loadTraceability() {
			setIsLoading(true);
			setErrorMessage("");

			try {
				const [notesResponse, certificatesResponse, circularityResponse] = await Promise.all([
					apiFetch("/reception-notes", { cache: "no-store" }),
					apiFetch("/reception-certificates", { cache: "no-store" }),
					apiFetch("/circularity-certificates", { cache: "no-store" }),
				]);

				const notesPayload = (await notesResponse.json()) as ReceptionNoteRow[] | { detail?: string };
				const certificatesPayload = (await certificatesResponse.json()) as ReceptionCertificateRow[] | { detail?: string };
				const circularityPayload = (await circularityResponse.json()) as CircularityCertificateRow[] | { detail?: string };

				if (!notesResponse.ok || !Array.isArray(notesPayload)) {
					throw new Error(!Array.isArray(notesPayload) ? notesPayload.detail ?? "Unable to load traceability data." : "Unable to load traceability data.");
				}

				if (!certificatesResponse.ok || !Array.isArray(certificatesPayload)) {
					throw new Error(!Array.isArray(certificatesPayload) ? certificatesPayload.detail ?? "Unable to load traceability data." : "Unable to load traceability data.");
				}

				if (!circularityResponse.ok || !Array.isArray(circularityPayload)) {
					throw new Error(!Array.isArray(circularityPayload) ? circularityPayload.detail ?? "Unable to load traceability data." : "Unable to load traceability data.");
				}

				if (!isMounted) {
					return;
				}

				setRows(buildTraceabilityRows(notesPayload, certificatesPayload, circularityPayload));
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setRows([]);
				setErrorMessage(error instanceof Error ? error.message : "Unable to load traceability data.");
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		void loadTraceability();

		return () => {
			isMounted = false;
		};
	}, []);

	const visibleRows = sortTableRows(rows, sortValue, {
		date: (row) => row.rnidDate,
		customerName: () => "",
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
						options: DATE_ONLY_TABLE_SORT_OPTIONS,
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
									Loading traceability data...
								</td>
							</tr>
						) : visibleRows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									No data available.
								</td>
							</tr>
						) : visibleRows.map((row) => (
							<tr key={row.rnid || `${row.rnidDate}-${row.rcid}-${row.ccid}`} className="border-b border-slate-200 last:border-b-0">
								<td className="px-3 py-2.5 text-slate-600">{row.rnidDate || "-"}</td>
								<td className="px-3 py-2.5 font-medium text-slate-900">{row.rnid || "-"}</td>
								<td className="px-3 py-2.5 text-slate-600"><StatusBadge status={row.rnidStatus} /></td>
								<td className="px-3 py-2.5 text-slate-600">{row.rcidDate || "-"}</td>
								<td className="px-3 py-2.5 text-slate-600">{renderLinkedIdentifierCell(row.rcid, row.rcidReference, "reception-certificate", openDocumentPreview)}</td>
								<td className="px-3 py-2.5 text-slate-600"><StatusBadge status={row.rcidStatus} /></td>
								<td className="px-3 py-2.5 text-slate-600">{row.ccidDate || "-"}</td>
								<td className="px-3 py-2.5 text-slate-600">{renderLinkedIdentifierCell(row.ccid, row.ccidReference, "circularity-certificate", openDocumentPreview)}</td>
								<td className="px-3 py-2.5 text-slate-600"><StatusBadge status={row.ccidStatus} /></td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}


function buildTraceabilityRows(
	receptionNotes: ReceptionNoteRow[],
	receptionCertificates: ReceptionCertificateRow[],
	circularityCertificates: CircularityCertificateRow[],
): ReadonlyArray<TraceabilityRow> {
	return receptionNotes.map((note) => {
		const linkedReceptionCertificate = receptionCertificates.find((certificate) =>
			getLinkedRnids(certificate).includes(String(note.rnid ?? "")),
		);
		const linkedCircularityCertificate = linkedReceptionCertificate
			? circularityCertificates.find((certificate) => getLinkedRcids(certificate).includes(String(linkedReceptionCertificate.rcid ?? "")))
			: null;

		return {
			rnidDate: String(note.rnidDate ?? ""),
			rnid: String(note.rnid ?? ""),
			rnidReference: getReceptionNotePdfReference(note),
			rnidStatus: normalizeTraceabilityStatus(note.status, Boolean(note.rnid)),
			rcidDate: String(linkedReceptionCertificate?.rcidDate ?? ""),
			rcid: String(linkedReceptionCertificate?.rcid ?? ""),
			rcidReference: getReceptionCertificatePdfReference(linkedReceptionCertificate),
			rcidStatus: linkedReceptionCertificate?.rcid ? normalizeTraceabilityStatus(linkedReceptionCertificate.status, true) : "Pending",
			ccidDate: String(linkedCircularityCertificate?.ccidDate ?? ""),
			ccid: String(linkedCircularityCertificate?.ccid ?? ""),
			ccidReference: getCircularityCertificatePdfReference(linkedCircularityCertificate),
			ccidStatus: linkedCircularityCertificate?.ccid ? normalizeTraceabilityStatus(linkedCircularityCertificate.status, true) : "Pending",
		};
	});
}


function getLinkedRnids(certificate: ReceptionCertificateRow) {
	if (Array.isArray(certificate.linkedRnids) && certificate.linkedRnids.length > 0) {
		return certificate.linkedRnids.map((value) => String(value ?? "").trim()).filter(Boolean);
	}

	return String(certificate.rnid ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}


function getLinkedRcids(certificate: CircularityCertificateRow) {
	if (Array.isArray(certificate.linkedRcids) && certificate.linkedRcids.length > 0) {
		return certificate.linkedRcids.map((value) => String(value ?? "").trim()).filter(Boolean);
	}

	return String(certificate.rcid ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}


function renderLinkedIdentifierCell(
	label: string,
	reference: string,
	kind: "reception-note" | "reception-certificate" | "circularity-certificate",
	onOpen: (kind: "reception-note" | "reception-certificate" | "circularity-certificate", reference: string) => void,
) {
	if (!label.trim() || !reference.trim()) {
		return <StatusBadge status="Pending" />;
	}

	return (
		<button
			type="button"
			onClick={() => onOpen(kind, reference)}
			className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-emerald-300 hover:bg-emerald-100"
		>
			{label}
		</button>
	);
}

function normalizeTraceabilityStatus(status: string | undefined, hasLinkedDocument: boolean): TraceabilityStatus {
	if (!hasLinkedDocument) {
		return "Pending";
	}

	return String(status ?? "Issued").trim().toLowerCase() === "issued" ? "Issued" : "Pending";
}

function getReceptionNotePdfReference(note: ReceptionNoteRow) {
	if (Number.isInteger(note.id) && Number(note.id) > 0) {
		return String(note.id);
	}

	return String(note.rnid ?? "").trim();
}

function getReceptionCertificatePdfReference(certificate: ReceptionCertificateRow | undefined) {
	if (!certificate) {
		return "";
	}

	if (String(certificate.rcid ?? "").trim()) {
		return String(certificate.rcid ?? "").trim();
	}

	if (Number.isInteger(certificate.id) && Number(certificate.id) > 0) {
		return String(certificate.id);
	}

	return "";
}

function getCircularityCertificatePdfReference(certificate: CircularityCertificateRow | undefined) {
	if (!certificate) {
		return "";
	}

	if (String(certificate.ccid ?? "").trim()) {
		return String(certificate.ccid ?? "").trim();
	}

	if (Number.isInteger(certificate.id) && Number(certificate.id) > 0) {
		return String(certificate.id);
	}

	return "";
}
