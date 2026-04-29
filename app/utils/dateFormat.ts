const DISPLAY_DATE_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const SLASH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MONTH_NAME_DATE_PATTERN = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/;
const MONTH_INDEX_BY_NAME: Record<string, number> = {
	jan: 0,
	january: 0,
	feb: 1,
	february: 1,
	mar: 2,
	march: 2,
	apr: 3,
	april: 3,
	may: 4,
	jun: 5,
	june: 5,
	jul: 6,
	july: 6,
	aug: 7,
	august: 7,
	sep: 8,
	sept: 8,
	september: 8,
	oct: 9,
	october: 9,
	nov: 10,
	november: 10,
	dec: 11,
	december: 11,
};

export function formatDateForDisplay(value: Date): string {
	return [padDateSegment(value.getDate()), padDateSegment(value.getMonth() + 1), String(value.getFullYear())].join("-");
}

export function parseDateString(value: string | null | undefined): Date | null {
	const trimmedValue = String(value ?? "").trim();

	if (!trimmedValue) {
		return null;
	}

	const displayMatch = DISPLAY_DATE_PATTERN.exec(trimmedValue);
	if (displayMatch) {
		return createValidDate(Number(displayMatch[3]), Number(displayMatch[2]), Number(displayMatch[1]));
	}

	const isoMatch = ISO_DATE_PATTERN.exec(trimmedValue);
	if (isoMatch) {
		return createValidDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
	}

	const slashMatch = SLASH_DATE_PATTERN.exec(trimmedValue);
	if (slashMatch) {
		return createValidDate(Number(slashMatch[3]), Number(slashMatch[2]), Number(slashMatch[1]));
	}

	const monthNameMatch = MONTH_NAME_DATE_PATTERN.exec(trimmedValue);
	if (monthNameMatch) {
		const monthIndex = MONTH_INDEX_BY_NAME[monthNameMatch[2].toLowerCase()];
		if (monthIndex !== undefined) {
			return createValidDate(Number(monthNameMatch[3]), monthIndex + 1, Number(monthNameMatch[1]));
		}
	}

	return null;
}

export function normalizeDateString(value: string | null | undefined): string {
	const parsedValue = parseDateString(value);
	return parsedValue ? formatDateForDisplay(parsedValue) : "";
}

export function parseDateStringToTimestamp(value: string | null | undefined): number {
	const parsedValue = parseDateString(value);
	return parsedValue ? parsedValue.getTime() : Number.NaN;
}

function createValidDate(year: number, month: number, day: number): Date | null {
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
		return null;
	}

	const candidate = new Date(year, month - 1, day);

	if (
		candidate.getFullYear() !== year
		|| candidate.getMonth() !== month - 1
		|| candidate.getDate() !== day
	) {
		return null;
	}

	return candidate;
}

function padDateSegment(value: number): string {
	return String(value).padStart(2, "0");
}