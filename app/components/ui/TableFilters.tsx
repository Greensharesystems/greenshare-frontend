
"use client";

import type { ChangeEvent, ReactNode } from "react";

import { parseDateStringToTimestamp } from "@/app/utils/dateFormat";

export type TableSortValue = "date-desc" | "date-asc" | "customer-asc" | "customer-desc";

export type TableFilterOption = Readonly<{
	label: string;
	value: string;
}>;

export type TableFilterControl =
	| Readonly<{
		key: string;
		type: "search";
		label: string;
		placeholder?: string;
	}>
	| Readonly<{
		key: string;
		type: "select";
		label: string;
		options: ReadonlyArray<TableFilterOption>;
	}>;

type TableFiltersProps = Readonly<{
	title?: ReactNode;
	controls: ReadonlyArray<TableFilterControl>;
	values: Readonly<Record<string, string>>;
	onChange: (key: string, value: string) => void;
	className?: string;
}>;

export const DEFAULT_TABLE_SORT_OPTIONS: ReadonlyArray<TableFilterOption> = [
	{ label: "Date: Newest first", value: "date-desc" },
	{ label: "Date: Oldest first", value: "date-asc" },
	{ label: "Customer Name: A-Z", value: "customer-asc" },
	{ label: "Customer Name: Z-A", value: "customer-desc" },
];

export const DATE_ONLY_TABLE_SORT_OPTIONS: ReadonlyArray<TableFilterOption> = [
	{ label: "Date: Newest first", value: "date-desc" },
	{ label: "Date: Oldest first", value: "date-asc" },
];

export default function TableFilters({
	title,
	controls,
	values,
	onChange,
	className,
}: TableFiltersProps) {
	return (
		<div className={joinClasses("flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4", className)}>
			{title ? <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</div> : null}
			<div className="flex flex-wrap items-end gap-3">
				{controls.map((control) => (
					<label key={control.key} className="flex min-w-[180px] flex-1 flex-col gap-1.5 md:min-w-[220px]">
						<span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{control.label}</span>
						{control.type === "search" ? (
							<input
								type="search"
								value={values[control.key] ?? ""}
								onChange={(event) => handleValueChange(event, control.key, onChange)}
								placeholder={control.placeholder}
								className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/15"
							/>
						) : (
							<select
								value={values[control.key] ?? ""}
								onChange={(event) => handleValueChange(event, control.key, onChange)}
								className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/15"
							>
								{control.options.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						)}
					</label>
				))}
			</div>
		</div>
	);
}

export function sortTableRows<Row>(
	rows: ReadonlyArray<Row>,
	sortValue: TableSortValue,
	selectors: Readonly<{
		date: (row: Row) => string;
		customerName: (row: Row) => string;
	}>,
) {
	const sortedRows = [...rows];

	sortedRows.sort((left, right) => {
		if (sortValue === "customer-asc" || sortValue === "customer-desc") {
			const customerComparison = compareText(selectors.customerName(left), selectors.customerName(right));
			return sortValue === "customer-asc" ? customerComparison : customerComparison * -1;
		}

		const dateComparison = compareDateValues(selectors.date(left), selectors.date(right));
		return sortValue === "date-asc" ? dateComparison : dateComparison * -1;
	});

	return sortedRows;
}

function handleValueChange(
	event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	key: string,
	onChange: (key: string, value: string) => void,
) {
	onChange(key, event.target.value);
}

function compareDateValues(left: string, right: string) {
	const leftTimestamp = parseDateStringToTimestamp(left);
	const rightTimestamp = parseDateStringToTimestamp(right);

	if (!Number.isNaN(leftTimestamp) && !Number.isNaN(rightTimestamp)) {
		return leftTimestamp - rightTimestamp;
	}

	return compareText(left, right);
}

function compareText(left: string, right: string) {
	return left.localeCompare(right, undefined, {
		sensitivity: "base",
		numeric: true,
	});
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
