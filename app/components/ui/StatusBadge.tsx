const STATUS_STYLES = {
	new: "border border-emerald-200 bg-emerald-50 text-emerald-700",
	assigned: "border border-sky-200 bg-sky-50 text-sky-700",
	"lab-analysis": "border border-cyan-200 bg-cyan-50 text-cyan-700",
	"operational-costing": "border border-indigo-200 bg-indigo-50 text-indigo-700",
	"logistics-costing": "border border-violet-200 bg-violet-50 text-violet-700",
	"financial-review": "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
	proposal: "border border-purple-200 bg-purple-50 text-purple-700",
	won: "border border-emerald-200 bg-emerald-50 text-emerald-700",
	lost: "border border-rose-200 bg-rose-50 text-rose-700",
	"on-hold": "border border-stone-200 bg-stone-100 text-stone-700",
	cancelled: "border border-rose-200 bg-rose-50 text-rose-700",
	draft: "border border-slate-200 bg-slate-100 text-slate-600",
	submitted: "border border-sky-200 bg-sky-50 text-sky-700",
	"under-review": "border border-blue-200 bg-blue-50 text-blue-700",
	"in-progress": "border border-cyan-200 bg-cyan-50 text-cyan-700",
	"revision-requested": "border border-orange-200 bg-orange-50 text-orange-700",
	approved: "border border-emerald-200 bg-emerald-50 text-emerald-700",
	sent: "border border-sky-200 bg-sky-50 text-sky-700",
	accepted: "border border-emerald-200 bg-emerald-50 text-emerald-700",
	rejected: "border border-rose-200 bg-rose-50 text-rose-700",
	returned: "border border-amber-200 bg-amber-50 text-amber-700",
	created: "border border-slate-200 bg-slate-100 text-slate-700",
	"documents-pending": "border border-amber-200 bg-amber-50 text-amber-700",
	scheduled: "border border-amber-200 bg-amber-50 text-amber-700",
	"in-transit": "border border-blue-200 bg-blue-50 text-blue-700",
	collected: "border border-teal-200 bg-teal-50 text-teal-700",
	weighed: "border border-lime-200 bg-lime-50 text-lime-700",
	"lab-verified": "border border-cyan-200 bg-cyan-50 text-cyan-700",
	"moved-to-rn": "border border-violet-200 bg-violet-50 text-violet-700",
	completed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
	expired: "border border-stone-200 bg-stone-100 text-stone-700",
	issued: "border border-emerald-200 bg-emerald-50 text-emerald-700",
	pending: "border border-amber-200 bg-amber-50 text-amber-700",
	"in-review": "border border-blue-200 bg-blue-50 text-blue-700",
	processing: "border border-indigo-200 bg-indigo-50 text-indigo-700",
} as const;

type KnownStatusKey = keyof typeof STATUS_STYLES;

type StatusBadgeProps = Readonly<{
	status: string;
	className?: string;
}>;

const DEFAULT_BADGE_CLASSES = "border border-slate-200 bg-slate-100 text-slate-700";

export default function StatusBadge({ status, className }: StatusBadgeProps) {
	const normalizedStatus = normalizeStatus(status);
	const statusKey = toStatusKey(normalizedStatus);
	const badgeClasses = STATUS_STYLES[statusKey] ?? DEFAULT_BADGE_CLASSES;

	return (
		<span
			className={joinClasses(
				"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
				badgeClasses,
				className,
			)}
		>
			{statusKey === "issued" ? <IssuedIcon /> : null}
			{statusKey === "pending" ? <PendingIcon /> : null}
			<span>{normalizedStatus}</span>
		</span>
	);
}

function normalizeStatus(status: StatusBadgeProps["status"]): string {
	const sanitized = String(status)
		.trim()
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.toLowerCase();

	if (!sanitized) {
		return "Draft";
	}

	if (sanitized === "technical assessment") {
		return "Lab Analysis";
	}

	if (sanitized === "commercial review") {
		return "Financial Review";
	}

	if (sanitized === "documents pending") {
		return "Documents Pending";
	}

	if (sanitized === "in transit") {
		return "In Transit";
	}

	if (sanitized === "moved to rn") {
		return "Moved to RN";
	}

	if (sanitized === "on hold") {
		return "On Hold";
	}

	return sanitized.replace(/\b\w/g, (character) => character.toUpperCase());
}

function toStatusKey(status: string): KnownStatusKey {
	const key = status.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") as KnownStatusKey;

	if (key in STATUS_STYLES) {
		return key;
	}

	return "draft";
}

function IssuedIcon() {
	return (
		<svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.2]">
			<path d="M3.5 8.25 6.5 11 12.5 5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function PendingIcon() {
	return (
		<svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]">
			<circle cx="8" cy="8" r="5.25" className="opacity-25" />
			<path d="M8 2.75A5.25 5.25 0 0 1 13.25 8" strokeLinecap="round" className="opacity-100" />
		</svg>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
