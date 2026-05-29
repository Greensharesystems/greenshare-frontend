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

const visibleRows = useMemo(() => {
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
const csvData = visibleRows.map((row) => [
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
onChange={(e) => setRnidDateFilter(e.target.value)}
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
onChange={(e) => setRnidSearch(e.target.value)}
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
onChange={(e) => setNameSearch(e.target.value)}
placeholder="Search by company name"
className="w-full border-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
/>
</div>
</label>
<div className="flex items-end gap-2">
<Button
variant="secondary"
size="sm"
className="min-h-9 rounded-xl px-3 text-[12px]"
onClick={handleDownloadCsv}
disabled={isLoading || isDownloadingCsv || visibleRows.length === 0}
>
<Download className="h-3.5 w-3.5" />
{isDownloadingCsv ? "Downloading..." : "Export"}
</Button>
<Button
variant="secondary"
size="sm"
className="min-h-9 rounded-xl px-3 text-[12px]"
onClick={() => { setRnidDateFilter("All"); setRnidSearch(""); setNameSearch(""); }}
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
<thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-[0.16em] text-slate-500">
<tr>
<th rowSpan={2} className="px-3 py-2.5 font-semibold align-middle">RNID Date</th>
<th rowSpan={2} className="px-3 py-2.5 font-semibold align-middle">RNID</th>
<th colSpan={3} className="border-b border-slate-200 px-3 py-2 text-center font-semibold">Customer Name</th>
<th colSpan={3} className="border-b border-slate-200 px-3 py-2 text-center font-semibold">Waste Stream Details</th>
<th rowSpan={2} className="px-3 py-2.5 font-semibold align-middle">RN Status</th>
<th rowSpan={2} className="px-3 py-2.5 font-semibold align-middle">Issued By</th>
<th rowSpan={2} className="px-3 py-2.5 font-semibold align-middle whitespace-nowrap">Reception Certificate</th>
<th rowSpan={2} className="px-3 py-2.5 font-semibold align-middle">Actions</th>
</tr>
<tr>
<th className="px-3 py-2 font-semibold">Producing Company</th>
<th className="px-3 py-2 font-semibold">Referring Company</th>
<th className="px-3 py-2 font-semibold">Project Name</th>
<th className="px-3 py-2 font-semibold">Name</th>
<th className="px-3 py-2 font-semibold">Class</th>
<th className="px-3 py-2 font-semibold whitespace-nowrap">Quantity Unit</th>
</tr>
</thead>
<tbody>
{isLoading ? (
<tr>
<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
Loading reception notes...
</td>
</tr>
) : visibleRows.length === 0 ? (
<tr>
<td colSpan={TOTAL_COLUMNS} className="px-3 py-6 text-center text-slate-500">
No data available.
</td>
</tr>
) : visibleRows.map((row) => {
const normalizedRnid = row.rnid.trim();
const isRowBusy = activeActionKey === `view:${normalizedRnid}` || activeActionKey === `download:${normalizedRnid}`;
return (
<tr key={row.rnid} className="border-b border-slate-200 last:border-b-0">
<td className="px-3 py-2.5 text-slate-600">{row.rnidDate || "N/A"}</td>
<td className="px-3 py-2.5 font-medium text-slate-900">{row.rnid || "N/A"}</td>
<td className="px-3 py-2.5 text-slate-600">{row.producingCompanyName || "N/A"}</td>
<td className="px-3 py-2.5 text-slate-600">{row.referringCompany || "N/A"}</td>
<td className="px-3 py-2.5 text-slate-600">{row.projectName || "N/A"}</td>
<td className="px-3 py-2.5 text-slate-600">{getPrimaryWasteStreamName(row) || "N/A"}</td>
<td className="px-3 py-2.5 text-slate-600">{getPrimaryWasteStreamClass(row) || "N/A"}</td>
<td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{getPrimaryWasteStreamQuantityUnit(row) || "N/A"}</td>
<td className="px-3 py-2.5">
<StatusBadge status={row.status === "Issued" ? "Issued" : "Pending"} />
</td>
<td className="px-3 py-2.5 text-slate-600">{row.rnIssuedBy || "N/A"}</td>
<td className="px-3 py-2.5">
{renderReceptionCertificateCell(row.receptionCertificateReference, handleViewReceptionCertificate)}
</td>
<td className="px-3 py-2.5">
<div className="flex items-center gap-1.5">
<button
type="button"
title={activeActionKey === `view:${normalizedRnid}` ? "Generating PDF..." : "View"}
disabled={isLoading || isRowBusy}
onClick={() => void handleViewReceptionNote(row)}
className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
>
<Eye className="h-3.5 w-3.5" />
</button>
<button
type="button"
title={activeActionKey === `download:${normalizedRnid}` ? "Generating PDF..." : "Download"}
disabled={isLoading || isRowBusy}
onClick={() => void handleDownloadReceptionNote(row)}
className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
>
<Download className="h-3.5 w-3.5" />
</button>
{(role === "admin" || role === "employee") ? (
<button
type="button"
title="Edit"
disabled={isLoading}
onClick={() => handleEditReceptionNote(row)}
className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
>
<Pencil className="h-3.5 w-3.5" />
</button>
) : null}
{role === "admin" ? (
<button
type="button"
title="Remove"
disabled={isLoading || isRowBusy}
onClick={() => setConfirmRemoveRnid(normalizedRnid)}
className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
>
<Trash2 className="h-3.5 w-3.5" />
</button>
) : null}
</div>
</td>
</tr>
);
})}
</tbody>
</table>
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
