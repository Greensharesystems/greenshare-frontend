import type { ReactNode } from "react";

type WidgetShellProps = Readonly<{
	title?: string;
	description?: string;
	children?: ReactNode;
	size?: "sm" | "md";
	className?: string;
	contentClassName?: string;
}>;

export default function WidgetShell({
	title,
	description,
	children,
	size = "md",
	className,
	contentClassName,
}: WidgetShellProps) {
	return (
		<section
			className={joinClasses(
				"flex h-52.5 w-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm",
				size === "sm" ? "" : "",
				className,
			)}
		>
			{title ? <p className="text-sm font-medium text-slate-500">{title}</p> : null}
			{description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
			{children ? <div className={joinClasses("mt-3 min-h-0 flex-1 overflow-hidden", contentClassName)}>{children}</div> : null}
		</section>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
