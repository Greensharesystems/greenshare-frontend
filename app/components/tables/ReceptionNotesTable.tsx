"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Pencil, Search, Trash2, X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { readAuthSession } from "@/app/hooks/useAuth";
import { apiFetch, downloadPdfWithAuth, openPdfWithAuth } from "@/app/utils/api";

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
producingCompanyName: string;
referringCompany: string;
projectName: string;
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
wasteStreamName: string;
wasteStreamQuantity: string;
rnIssuedBy: string;
status: "Issued" | "Pending" | "Draft";
}>;

const TOTAL_COLUMNS = 12;
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export default function ReceptionNotesTable() {
const router = useRouter();
const session = readAuthSession();
const role = session?.role ?? "customer";

const [rows, setRows] = useState<ReceptionNoteRow[]>([]);
const [errorMessage, setErrorMessage] = useState("");
const [isLoading, setIsLoading] = useState(true);
const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
const [confirmRemoveRnid, setConfirmRemoveRnid] = useState<string | null>(null);

const [rnidDateFilter, setRnidDateFilter] = useState("All");
const [rnidSearch, setRnidSearch] = useState("");
const [nameSearch, setNameSearch] = useState("");
const [pageSize, setPageSize] = useState<number>(10);
const [currentPage, setCurrentPage] = useState(0);

const rnidDateOptions = useMemo(() => {
const optionMap = new Map<string, number>();
for (const row of rows) {
const opt = toMonthYearOption(row.rnidDate);
if (opt && !optionMap.has(opt)) {
const parts = row.rnidDate.split("-");
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
if (rnidDateFilter !== "All") {
if (toMonthYearOption(row.rnidDate) !== rnidDateFilter) return false;
}
if (rnidSearch.trim()) {
if (!row.rnid.toLowerCase().includes(rnidSearch.toLowerCase().trim())) return false;
}
if (nameSearch.trim()) {
const search = nameSearch.toLowerCase().trim();
const matchesName =
row.producingCompanyName.toLowerCase().includes(search) ||
row.referringCompany.toLowerCase().includes(search);
if (!matchesName) return false;
}
return true;
});
}, [rows, rnidDateFilter, rnidSearch, nameSearch]);

const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
const safePage = Math.min(currentPage, totalPages - 1);
const pageStart = safePage * pageSize;
const pageEnd = Math.min(pageStart + pageSize, filteredRows.length);
const pagedRows = filteredRows.slice(pageStart, pageEnd);

async function loadReceptionNotes() {
setErrorMessage("");
setIsLoading(true);

try {
const [notesResponse, certificatesResponse] = await Promise.all([
apiFetch("/reception-notes", { cache: "no-store" }),
apiFetch("/reception-certificates", { cache: "no-store" }),
]);

const notesPayload = (await notesResponse.json()) as Array<{
id?: number;
rnidDate?: string;
rnid?: string;
customerId?: string;
producingCompanyName?: string;
referringCompany?: string | null;
projectName?: string | null;
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
throw new Error(!Array.isArray(notesPayload) ? (notesPayload.detail ?? "Unable to load reception notes.") : "Unable to load reception notes.");
}

if (!certificatesResponse.ok || !Array.isArray(certificatesPayload)) {
throw new Error(
!Array.isArray(certificatesPayload)
? (certificatesPayload.detail ?? "Unable to load reception certificates.")
: "Unable to load reception certificates.",
);
}

const receptionCertificates: ReceptionCertificateRow[] = certificatesPayload.map((cert) => ({
rcid: String(cert.rcid ?? ""),
rnid: String(cert.rnid ?? ""),
linkedRnids: Array.isArray(cert.linkedRnids) ? cert.linkedRnids.map((v) => String(v ?? "")) : [],
}));

setRows(
notesPayload.map((note) => ({
id: Number(note.id ?? 0),
rnidDate: String(note.rnidDate ?? ""),
rnid: String(note.rnid ?? ""),
receptionCertificateReference: getLinkedReceptionCertificateReference(String(note.rnid ?? ""), receptionCertificates),
customerId: String(note.customerId ?? ""),
producingCompanyName: String(note.producingCompanyName ?? ""),
referringCompany: String(note.referringCompany ?? ""),
projectName: String(note.projectName ?? ""),
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

async function handleConfirmedRemove(rnid: string) {
setConfirmRemoveRnid(null);
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

async function handleViewReceptionNote(row: ReceptionNoteRow) {
const normalizedRnid = row.rnid.trim();
setErrorMessage("");

if (!normalizedRnid) {
setErrorMessage("A valid reception note ID is required.");
return;
}

if (!session?.accessToken) {
setErrorMessage("Authentication is required to preview that reception note.");
return;
}

try {
setActiveActionKey(`view:${normalizedRnid}`);
await openPdfWithAuth({
pdfType: "reception-note",
documentId: normalizedRnid,
path: `/reception-notes/${encodeURIComponent(normalizedRnid)}/pdf/view`,
fallbackErrorMessage: "Unable to preview that reception note right now.",
});
} catch (error) {
setErrorMessage(error instanceof Error ? error.message : "Unable to preview that reception note right now.");
} finally {
setActiveActionKey((current) => (current === `view:${normalizedRnid}` ? null : current));
}
}

async function handleDownloadReceptionNote(row: ReceptionNoteRow) {
const normalizedRnid = row.rnid.trim();
setErrorMessage("");

if (!normalizedRnid) {
setErrorMessage("A valid reception note ID is required.");
return;
}

try {
setActiveActionKey(`download:${normalizedRnid}`);
await downloadPdfWithAuth({
pdfType: "reception-note",
documentId: normalizedRnid,
path: `/reception-notes/${encodeURIComponent(normalizedRnid)}/pdf/download`,
fallbackErrorMessage: "Unable to download that reception note right now.",
fallbackFilename: normalizedRnid || "reception-note.pdf",
});
} catch (error) {
setErrorMessage(error instanceof Error ? error.message : "Unable to download that reception note right now.");
} finally {
setActiveActionKey((current) => (current === `download:${normalizedRnid}` ? null : current));
}
}

async function handleViewReceptionCertificate(receptionCertificateReference: string) {
setErrorMessage("");

if (!receptionCertificateReference.trim()) {
setErrorMessage("That reception certificate is missing its PDF reference.");
return;
}

if (!session?.accessToken) {
setErrorMessage("Authentication is required to preview that reception certificate.");
return;
}

try {
await openPdfWithAuth({
pdfType: "reception-certificate",
documentId: receptionCertificateReference,
path: `/reception-certificates/${encodeURIComponent(receptionCertificateReference)}/pdf/view`,
fallbackErrorMessage: "Unable to preview that reception certificate right now.",
});
} catch (error) {
setErrorMessage(error instanceof Error ? error.message : "Unable to preview that reception certificate right now.");
}
}

function handleEditReceptionNote(row: ReceptionNoteRow) {
const normalizedRnid = row.rnid.trim();
if (!normalizedRnid) return;
const basePath = role === "admin" ? "/admin/traceability/reception-notes" : "/employee/reception-notes";
router.push(`${basePath}/${encodeURIComponent(normalizedRnid)}/edit`);
}

function handleDownloadCsv() {
setIsDownloadingCsv(true);
try {
const headers = [
"RNID Date", "RNID", "Producing Company", "Referring Company", "Project Name",
"Waste Stream Name", "Class", "Quantity Unit", "RN Status", "Issued By",
"Reception Certificate Status",
];
const csvData = filteredRows.map((row) => [
row.rnidDate,
row.rnid,
row.producingCompanyName,
row.referringCompany,
row.projectName,
getPrimaryWasteStreamName(row),
getPrimaryWasteStreamClass(row),
getPrimaryWasteStreamQuantityUnit(row),
row.status === "Issued" ? "Issued" : "Pending",
row.rnIssuedBy,
row.receptionCertificateReference ? "Issued" : "Pending",
]);
const csvContent = [headers, ...csvData]
.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
.join("\n");
const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "reception-notes.csv";
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
} finally {
setIsDownloadingCsv(false);
}
}

useEffect(() => {
void loadReceptionNotes();
}, []);

const confirmTarget = confirmRemoveRnid ? rows.find((r) => r.rnid === confirmRemoveRnid) : null;

return (
<>
{confirmRemoveRnid !== null ? (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
<div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
<h2 className="mb-2 text-lg font-semibold text-slate-900">Remove Reception Note</h2>
<p className="mb-5 text-sm text-slate-600">
Are you sure you want to remove{" "}
<span className="font-medium text-slate-900">{confirmTarget?.rnid ?? confirmRemoveRnid}</span>? This action cannot be undone.
</p>
<div className="flex justify-end gap-3">
<Button variant="secondary" size="sm" onClick={() => setConfirmRemoveRnid(null)}>
Cancel
</Button>
<Button variant="danger" size="sm" onClick={() => void handleConfirmedRemove(confirmRemoveRnid)}>
Remove
</Button>
</div>
</div>
</div>
) : null}

<div className="flex w-full flex-col gap-4">
<div className="flex flex-wrap items-end gap-3">
<label className="flex w-44 flex-col gap-1.5">
<span className="text-[11px] font-semibold text-slate-500">RNID Date</span>
<select
value={rnidDateFilter}
onChange={(e) => { setRnidDateFilter(e.target.value); setCurrentPage(0); }}
className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/10"
>
{rnidDateOptions.map((opt) => (
<option key={opt} value={opt}>{opt}</option>
))}
</select>
</label>
<label className="flex w-48 flex-col gap-1.5">
<span className="text-[11px] font-semibold text-slate-500">RNID</span>
<div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#36B44D] focus-within:ring-4 focus-within:ring-[#36B44D]/10">
<Search className="h-3.5 w-3.5 text-slate-400" />
<input
type="search"
value={rnidSearch}
onChange={(e) => { setRnidSearch(e.target.value); setCurrentPage(0); }}
placeholder="Search by RNID"
className="w-full border-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
/>
</div>
</label>
<label className="flex w-56 flex-col gap-1.5">
<span className="text-[11px] font-semibold text-slate-500">Customer Name</span>
<div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#36B44D] focus-within:ring-4 focus-within:ring-[#36B44D]/10">
<Search className="h-3.5 w-3.5 text-slate-400" />
<input
type="search"
value={nameSearch}
onChange={(e) => { setNameSearch(e.target.value); setCurrentPage(0); }}
placeholder="Search by company name"
className="w-full border-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
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
onClick={() => { setRnidDateFilter("All"); setRnidSearch(""); setNameSearch(""); setCurrentPage(0); }}
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
							<HeaderCell rowSpan={2} label="RNID Date" />
							<HeaderCell rowSpan={2} label="RNID" />
							<GroupHeader label="Customer Name" colSpan={3} />
							<GroupHeader label="Waste Stream Details" colSpan={3} />
							<HeaderCell rowSpan={2} label="RN Status" />
							<HeaderCell rowSpan={2} label="Issued By" />
							<HeaderCell rowSpan={2} label="Reception Certificate" />
							<HeaderCell rowSpan={2} label="Actions" centered />
						</tr>
						<tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
							<HeaderCell label="Producing Company" />
							<HeaderCell label="Referring Company" />
							<HeaderCell label="Project Name" />
							<HeaderCell label="Name" />
							<HeaderCell label="Class" />
							<HeaderCell label="Qty Unit" />
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
									Loading reception notes...
								</td>
							</tr>
						) : filteredRows.length === 0 ? (
							<tr>
								<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
									No data available.
								</td>
							</tr>
						) : pagedRows.map((row) => {
							const normalizedRnid = row.rnid.trim();
							const isRowBusy = activeActionKey === `view:${normalizedRnid}` || activeActionKey === `download:${normalizedRnid}`;
							return (
								<tr key={row.rnid} className="bg-white transition hover:bg-slate-50/80">
									<DataCell>{row.rnidDate || "N/A"}</DataCell>
									<DataCell className="font-medium text-slate-900">{row.rnid || "N/A"}</DataCell>
									<DataCell>{row.producingCompanyName || "N/A"}</DataCell>
									<DataCell>{row.referringCompany || "N/A"}</DataCell>
									<DataCell>{row.projectName || "N/A"}</DataCell>
									<DataCell>{getPrimaryWasteStreamName(row) || "N/A"}</DataCell>
									<DataCell>{getPrimaryWasteStreamClass(row) || "N/A"}</DataCell>
									<DataCell>{getPrimaryWasteStreamQuantityUnit(row) || "N/A"}</DataCell>
									<DataCell>
										<StatusBadge status={row.status === "Issued" ? "Issued" : "Pending"} />
									</DataCell>
									<DataCell>{row.rnIssuedBy || "N/A"}</DataCell>
									<DataCell>
										{renderReceptionCertificateCell(row.receptionCertificateReference, handleViewReceptionCertificate)}
									</DataCell>
									<DataCell centered>
										<div className="flex items-center justify-center gap-1">
											<ActionButton
												label={activeActionKey === `view:${normalizedRnid}` ? "Generating PDF..." : "View"}
												onClick={() => void handleViewReceptionNote(row)}
												disabled={isLoading || isRowBusy}
											>
												<Eye className="h-3.5 w-3.5" />
											</ActionButton>
											<ActionButton
												label={activeActionKey === `download:${normalizedRnid}` ? "Generating PDF..." : "Download"}
												onClick={() => void handleDownloadReceptionNote(row)}
												disabled={isLoading || isRowBusy}
											>
												<Download className="h-3.5 w-3.5" />
											</ActionButton>
											{(role === "admin" || role === "employee") ? (
												<ActionButton
													label="Edit"
													onClick={() => handleEditReceptionNote(row)}
													disabled={isLoading}
												>
													<Pencil className="h-3.5 w-3.5" />
												</ActionButton>
											) : null}
											{role === "admin" ? (
												<ActionButton
													label="Remove"
													danger
													onClick={() => setConfirmRemoveRnid(normalizedRnid)}
													disabled={isLoading || isRowBusy}
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
							Showing {pageStart + 1}–{pageEnd} of {filteredRows.length} reception notes
						</span>
					) : null}
					<div className="flex gap-1">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
							disabled={safePage === 0}
							className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							&#8249;
						</button>
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
							disabled={safePage >= totalPages - 1}
							className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							&#8250;
						</button>
					</div>
				</div>
			</div>
</div>
</>
);
}

function normalizeStatus(status: string): ReceptionNoteRow["status"] {
if (status === "Draft") return "Draft";
if (status === "Pending") return "Pending";
return "Issued";
}

function getPrimaryWasteStream(row: ReceptionNoteRow): ReceptionNoteWasteStream | null {
return row.wasteStreams[0] ?? null;
}

function getPrimaryWasteStreamName(row: ReceptionNoteRow): string {
return getPrimaryWasteStream(row)?.name || row.wasteStreamName || "";
}

function getPrimaryWasteStreamClass(row: ReceptionNoteRow): string {
return getPrimaryWasteStream(row)?.wasteClass || "";
}

function getPrimaryWasteStreamQuantityUnit(row: ReceptionNoteRow): string {
const ws = getPrimaryWasteStream(row);
if (ws) {
const qty = ws.quantity.trim();
const unit = ws.quantityUnit.trim();
if (qty && unit) return `${qty} ${unit}`;
if (qty) return qty;
}
return row.wasteStreamQuantity.trim();
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

function getLinkedReceptionCertificateReference(rnid: string, certificates: ReadonlyArray<ReceptionCertificateRow>): string {
const normalizedRnid = rnid.trim();
if (!normalizedRnid) return "";

const linked = certificates.find((cert) => getLinkedRnids(cert).includes(normalizedRnid));
return linked?.rcid?.trim() ?? "";
}

function getLinkedRnids(certificate: ReceptionCertificateRow): string[] {
if (Array.isArray(certificate.linkedRnids) && certificate.linkedRnids.length > 0) {
return certificate.linkedRnids.map((v) => String(v ?? "").trim()).filter(Boolean);
}
return String(certificate.rnid ?? "").split(",").map((v) => v.trim()).filter(Boolean);
}

function renderReceptionCertificateCell(
reference: string,
onView: (reference: string) => void,
) {
if (!reference) {
return <StatusBadge status="Pending" />;
}

return (
<button
type="button"
onClick={() => onView(reference)}
className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-emerald-300 hover:bg-emerald-100"
>
{reference}
</button>
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