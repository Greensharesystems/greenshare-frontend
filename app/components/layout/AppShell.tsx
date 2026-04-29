import type { ReactNode } from "react";

type AppShellProps = Readonly<{
	children: ReactNode;
	header?: ReactNode;
	sidebar?: ReactNode;
	className?: string;
	headerClassName?: string;
	sidebarClassName?: string;
	contentClassName?: string;
}>;

const SIDEBAR_WIDTH = 100;
const SHELL_GAP = 6;
const HEADER_HEIGHT = 54;
const SIDEBAR_TOP_GAP = 10;
const CONTENT_LEFT_OFFSET = SIDEBAR_WIDTH + SHELL_GAP;

export default function AppShell({
	children,
	header,
	sidebar,
	className,
	headerClassName,
	sidebarClassName,
	contentClassName,
}: AppShellProps) {
	return (
		<div className={joinClasses("min-h-screen bg-[#f6f8f4]", className)}>
			<aside
				className={joinClasses("fixed bottom-0 left-0 z-30 overflow-hidden border-r border-t border-slate-200 bg-white", sidebarClassName)}
				style={{
					width: `${SIDEBAR_WIDTH}px`,
					top: `${HEADER_HEIGHT + SIDEBAR_TOP_GAP}px`,
				}}
			>
				{sidebar}
			</aside>

			<header
				className={joinClasses("fixed top-0 left-0 right-0 z-20 overflow-hidden border-b border-slate-200 bg-white", headerClassName)}
				style={{
					height: `${HEADER_HEIGHT}px`,
				}}
			>
				{header}
			</header>

			<main
				className={joinClasses("min-h-screen", contentClassName)}
				style={{
					paddingLeft: `${CONTENT_LEFT_OFFSET}px`,
					paddingTop: `${HEADER_HEIGHT}px`,
				}}
			>
				{children}
			</main>
		</div>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
