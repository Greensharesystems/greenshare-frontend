import Image from "next/image";
import type { ReactNode } from "react";

type HeaderProps = Readonly<{
	title?: string;
	subtitle?: string;
	actions?: ReactNode;
	profile?: ReactNode;
	children?: ReactNode;
	className?: string;
}>;

export default function Header({
	title,
	subtitle,
	actions,
	profile,
	children,
	className,
}: HeaderProps) {
	return (
		<div
			className={joinClasses(
				"flex h-full w-full items-center justify-between bg-white px-6",
				className,
			)}
		>
			<div className="flex min-w-0 items-center gap-4">
				<Image
					src="/greensharelogo.png"
					alt="Greenshare"
					width={176}
					height={44}
					priority
					className="h-auto w-34 shrink-0"
				/>
				<div className="min-w-0">
					{title ? <h1 className="truncate text-xl font-semibold text-slate-950">{title}</h1> : null}
					{subtitle ? <p className="truncate text-sm text-slate-500">{subtitle}</p> : null}
					{children}
				</div>
			</div>

			<div className="ml-4 flex shrink-0 items-center gap-3">
				{actions}
				{profile ?? (
					<div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#36B44D] text-xs font-semibold text-white">
							A
						</div>
						<div className="hidden text-left sm:block">
							<p className="text-xs font-semibold text-slate-900">Profile</p>
							<p className="text-xs text-slate-500">Administrator</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
