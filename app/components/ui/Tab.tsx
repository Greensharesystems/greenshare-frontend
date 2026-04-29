"use client";

import type { ReactNode } from "react";

export type TabItem = Readonly<{
	label: string;
	value: string;
	content?: ReactNode;
	disabled?: boolean;
	badge?: string | number;
}>;

type TabProps = Readonly<{
	tabs: readonly TabItem[];
	activeValue: string;
	onChange: (value: string) => void;
	className?: string;
	listClassName?: string;
	panelClassName?: string;
}>;

export default function Tab({
	tabs,
	activeValue,
	onChange,
	className,
	listClassName,
	panelClassName,
}: TabProps) {
	const activeTab = tabs.find((tab) => tab.value === activeValue) ?? tabs[0];

	return (
		<section
			className={joinClasses(
				"rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)]",
				className,
			)}
		>
			<div
				role="tablist"
				aria-label="Tabs"
				className={joinClasses(
					"flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2",
					listClassName,
				)}
			>
				{tabs.map((tab) => {
					const isActive = tab.value === activeTab?.value;

					return (
						<button
							key={tab.value}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={`panel-${tab.value}`}
							disabled={tab.disabled}
							onClick={() => onChange(tab.value)}
							className={joinClasses(
								"inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
								isActive
									? "border-[#36B44D] bg-white text-slate-950 shadow-[0_10px_24px_rgba(54,180,77,0.14)] focus:ring-[#36B44D]/20"
									: "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 focus:ring-slate-200",
							)}
						>
							<span>{tab.label}</span>
							{tab.badge !== undefined ? (
								<span
									className={joinClasses(
										"inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold",
										isActive ? "bg-[#36B44D] text-white" : "bg-slate-200 text-slate-700",
									)}
								>
									{tab.badge}
								</span>
							) : null}
						</button>
					);
				})}
			</div>

			<div
				id={`panel-${activeTab?.value}`}
				role="tabpanel"
				className={joinClasses(
					"mt-3 rounded-3xl border border-slate-200 bg-white p-5 text-slate-700",
					panelClassName,
				)}
			>
				{activeTab?.content}
			</div>
		</section>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
