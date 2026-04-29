"use client";

import { useEffect, useRef, useState } from "react";

import Button from "@/app/components/ui/Button";

export type TableActionVariant = "primary" | "secondary" | "danger";

export type TableAction = Readonly<{
	label: string;
	onClick: () => void;
	variant?: TableActionVariant;
	disabled?: boolean;
}>;

type TableActionsProps = Readonly<{
	actions?: TableAction[];
	viewLabel?: string;
	downloadLabel?: string;
	onView?: () => void;
	onDownload?: () => void;
	viewDisabled?: boolean;
	downloadDisabled?: boolean;
	className?: string;
	buttonClassName?: string;
	maxVisibleActions?: number;
	overflowLabel?: string;
}>;

export default function TableActions({
	actions,
	viewLabel = "View",
	downloadLabel = "Download",
	onView,
	onDownload,
	viewDisabled = false,
	downloadDisabled = false,
	className,
	buttonClassName,
	maxVisibleActions,
	overflowLabel = "More",
}: TableActionsProps) {
	const [isOverflowOpen, setIsOverflowOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const resolvedActions = getResolvedActions({
		actions,
		viewLabel,
		downloadLabel,
		onView,
		onDownload,
		viewDisabled,
		downloadDisabled,
	});

	useEffect(() => {
		if (!isOverflowOpen) {
			return;
		}

		function handlePointerDown(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOverflowOpen(false);
			}
		}

		document.addEventListener("mousedown", handlePointerDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
		};
	}, [isOverflowOpen]);

	if (resolvedActions.length === 0) {
		return null;
	}

	const shouldUseOverflow = typeof maxVisibleActions === "number" && maxVisibleActions > 0 && resolvedActions.length > maxVisibleActions;
	const visibleActions = shouldUseOverflow ? resolvedActions.slice(0, maxVisibleActions) : resolvedActions;
	const overflowActions = shouldUseOverflow ? resolvedActions.slice(maxVisibleActions) : [];

	return (
		<div ref={containerRef} className={joinClasses("inline-flex flex-nowrap items-center gap-1 whitespace-nowrap", className)}>
			{visibleActions.map((action) => (
				<Button
					key={action.label}
					variant={action.variant ?? "secondary"}
					size="sm"
					className={joinClasses("min-h-6 rounded-lg px-1.5 py-0.5 text-[11px] whitespace-nowrap", buttonClassName)}
					onClick={action.onClick}
					disabled={action.disabled}
				>
					{action.label}
				</Button>
			))}
			{overflowActions.length > 0 ? (
				<div className="relative">
					<Button
						variant="secondary"
						size="sm"
						className={joinClasses("min-h-6 rounded-lg px-1.5 py-0.5 text-[11px] whitespace-nowrap", buttonClassName)}
						onClick={() => setIsOverflowOpen((current) => !current)}
					>
						{overflowLabel}
					</Button>
					{isOverflowOpen ? (
						<div className="absolute right-0 top-full z-20 mt-2 flex min-w-36 flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
							{overflowActions.map((action) => (
								<button
									key={action.label}
									type="button"
									onClick={() => {
										action.onClick();
										setIsOverflowOpen(false);
									}}
									disabled={action.disabled}
									className={joinClasses(
										"rounded-xl px-3 py-2 text-left text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
										getOverflowActionClasses(action.variant ?? "secondary"),
									)}
								>
									{action.label}
								</button>
							))}
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}

function getResolvedActions({
	actions,
	viewLabel,
	downloadLabel,
	onView,
	onDownload,
	viewDisabled,
	downloadDisabled,
}: {
	actions?: TableAction[];
	viewLabel: string;
	downloadLabel: string;
	onView?: () => void;
	onDownload?: () => void;
	viewDisabled: boolean;
	downloadDisabled: boolean;
}) {
	if (actions && actions.length > 0) {
		return actions;
	}

	const fallbackActions: TableAction[] = [];

	if (onView) {
		fallbackActions.push({
			label: viewLabel,
			onClick: onView,
			variant: "secondary",
			disabled: viewDisabled,
		});
	}

	if (onDownload) {
		fallbackActions.push({
			label: downloadLabel,
			onClick: onDownload,
			variant: "secondary",
			disabled: downloadDisabled,
		});
	}

	return fallbackActions;
}

function getOverflowActionClasses(variant: TableActionVariant) {
	if (variant === "primary") {
		return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
	}

	if (variant === "danger") {
		return "bg-rose-50 text-rose-700 hover:bg-rose-100";
	}

	return "bg-white text-slate-700 hover:bg-slate-100";
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
