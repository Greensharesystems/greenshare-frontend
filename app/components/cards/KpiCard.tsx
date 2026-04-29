import type { ReactNode } from "react";

type KpiCardProps = Readonly<{
	title?: string;
	value?: string;
	unit?: string;
	unitClassName?: string;
	inlineUnit?: boolean;
	description?: string;
	children?: ReactNode;
	className?: string;
	variant?: "default" | "centered-kpi";
}>;

export default function KpiCard({
	title,
	value,
	unit,
	unitClassName,
	inlineUnit = false,
	description,
	children,
	className,
	variant = "default",
}: KpiCardProps) {
	return (
		<section
			className={joinClasses(
				"flex h-52.5 w-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm",
				className,
			)}
		>
			{title ? <p className="text-sm font-medium text-slate-500">{title}</p> : null}
			{variant === "centered-kpi" ? (
				<>
					<div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
						{value ? (
							inlineUnit && unit ? (
								<div className="flex items-end gap-1.5 leading-none">
									<p className="text-[2.375rem] font-normal tracking-[-0.04em]" style={{ color: "#2D923E" }}>
										{value}
									</p>
									<p className={joinClasses("pb-0.5 text-sm font-medium", unitClassName)} style={unitClassName ? undefined : { color: "#257632" }}>
										{unit}
									</p>
								</div>
							) : (
								<p className="text-[2.375rem] font-normal tracking-[-0.04em]" style={{ color: "#2D923E" }}>
									{value}
								</p>
							)
						) : null}
						{unit && !inlineUnit ? (
							<p className={joinClasses("mt-0.5 text-sm font-medium", unitClassName)} style={unitClassName ? undefined : { color: "#257632" }}>
								{unit}
							</p>
						) : null}
						{children ? <div className="mt-3 min-h-0 text-center">{children}</div> : null}
					</div>
					{description ? <p className="mt-auto whitespace-pre-line text-center text-[11px] leading-4 text-slate-500">{description}</p> : null}
				</>
			) : (
				<>
					{value ? <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p> : null}
					{description ? <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p> : null}
					{children ? <div className="mt-auto min-h-0 pt-3">{children}</div> : null}
				</>
			)}
		</section>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
