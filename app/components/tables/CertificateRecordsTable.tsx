"use client";

import type { ReactNode } from "react";


export type CertificateTableColumn<Row> = Readonly<{
	key: string;
	label: ReactNode;
	renderCell: (row: Row) => ReactNode;
	headerClassName?: string;
	cellClassName?: string;
}>;

type CertificateRecordsTableProps<Row> = Readonly<{
	columns: ReadonlyArray<CertificateTableColumn<Row>>;
	rows: ReadonlyArray<Row>;
	rowKey: (row: Row) => string;
	isLoading: boolean;
	errorMessage: string;
	loadingMessage: string;
	emptyMessage: string;
	topContent?: ReactNode;
}>;

export default function CertificateRecordsTable<Row>({
	columns,
	rows,
	rowKey,
	isLoading,
	errorMessage,
	loadingMessage,
	emptyMessage,
	topContent,
}: CertificateRecordsTableProps<Row>) {
	return (
		<div className="flex w-full flex-col gap-4">
			{topContent}
			{errorMessage ? (
				<p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<div className="w-full overflow-x-auto">
				<table className="min-w-full border-collapse text-left text-xs text-slate-700">
					<thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-[0.16em] text-slate-500">
						<tr>
							{columns.map((column) => (
								<th
									key={column.key}
									className={joinClasses("px-3 py-2.5 font-semibold", column.headerClassName)}
								>
									{column.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									{loadingMessage}
								</td>
							</tr>
						) : rows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									{emptyMessage}
								</td>
							</tr>
						) : rows.map((row) => (
							<tr key={rowKey(row)} className="border-b border-slate-200 last:border-b-0">
								{columns.map((column) => (
									<td key={column.key} className={joinClasses("px-3 py-2.5 text-slate-600", column.cellClassName)}>
										{column.renderCell(row)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}


function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}