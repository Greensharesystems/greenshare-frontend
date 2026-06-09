"use client";

import type { StreamCodeRecord } from "@/app/services/stream-codes.service";


type StreamCodeTableProps = Readonly<{
	streamCodes: StreamCodeRecord[];
	onEdit: (record: StreamCodeRecord) => void;
	onRemove: (record: StreamCodeRecord) => void;
}>;


export default function StreamCodeTable({ streamCodes, onEdit, onRemove }: StreamCodeTableProps) {
	return (
		<div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
			<div className="overflow-x-auto">
				<table className="min-w-[980px] w-full border-collapse text-left">
					<thead>
						<tr className="bg-slate-50">
							<HeaderCell label="Stream Code" />
							<HeaderCell label="Category" />
							<HeaderCell label="Stream Name" />
							<HeaderCell label="Description" />
							<HeaderCell label="Status" />
							<HeaderCell label="Created Date" />
							<HeaderCell label="Actions" centered />
						</tr>
					</thead>
					<tbody>
						{streamCodes.length === 0 ? (
							<tr>
								<td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
									No Stream Codes found.
								</td>
							</tr>
						) : (
							streamCodes.map((record) => (
								<tr key={record.id} className="bg-white transition hover:bg-slate-50/80">
									<DataCell>
										<span className="font-semibold text-[#36B44D]">{record.streamCode}</span>
									</DataCell>
									<DataCell>{record.category}</DataCell>
									<DataCell>{record.streamName}</DataCell>
									<DataCell className="max-w-80 whitespace-normal text-slate-600">{record.description || "-"}</DataCell>
									<DataCell>
										<StatusBadge status={record.status} />
									</DataCell>
									<DataCell>{formatDate(record.createdAt)}</DataCell>
									<DataCell centered>
										<div className="flex items-center justify-center gap-2">
											<button
												type="button"
												onClick={() => onEdit(record)}
												className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#36B44D] hover:bg-emerald-50 hover:text-[#2f9f45]"
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => onRemove(record)}
												className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
											>
												Remove
											</button>
										</div>
									</DataCell>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}


function HeaderCell({ label, centered = false }: Readonly<{ label: string; centered?: boolean }>) {
	return (
		<th className={["border-b border-r border-slate-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 last:border-r-0", centered ? "text-center" : "text-left"].join(" ")}>
			{label}
		</th>
	);
}


function DataCell({ children, centered = false, className }: Readonly<{ children: React.ReactNode; centered?: boolean; className?: string }>) {
	return <td className={["border-b border-r border-slate-200 px-4 py-3 align-middle text-[13px] text-slate-700 last:border-r-0", centered ? "text-center" : "text-left", className].filter(Boolean).join(" ")}>{children}</td>;
}


function StatusBadge({ status }: Readonly<{ status: StreamCodeRecord["status"] }>) {
	const tone = status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200";
	return <span className={["inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset", tone].join(" ")}>{status}</span>;
}


function formatDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	return `${day}-${month}-${year}`;
}
