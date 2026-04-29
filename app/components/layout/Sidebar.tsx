import type { ReactNode } from "react";

type SidebarProps = Readonly<{
	brand?: ReactNode;
	navigation?: ReactNode;
	footer?: ReactNode;
	children?: ReactNode;
	className?: string;
}>;

export default function Sidebar({
	brand,
	navigation,
	footer,
	children,
	className,
}: SidebarProps) {
	return (
		<div className={joinClasses("flex h-full w-full flex-col items-center bg-white px-2 pb-4 pt-3", className)}>
			{brand ? <div className="flex min-h-12 w-full items-center justify-center px-1">{brand}</div> : null}
			<div className={joinClasses("flex w-full flex-1 flex-col items-center", brand ? "mt-4" : "mt-0")}>
				{navigation ?? children}
			</div>
			{footer ? <div className="flex w-full items-center justify-center px-2 pb-2">{footer}</div> : null}
		</div>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
