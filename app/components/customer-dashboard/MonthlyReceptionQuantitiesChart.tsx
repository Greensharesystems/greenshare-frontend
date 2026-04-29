"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { GREENSHARE_PALETTE, GREENSHARE_SERIES } from "@/app/components/customer-dashboard/greensharePalette";


type MonthlyReceptionQuantitiesChartProps = Readonly<{
	months?: ReadonlyArray<string>;
	values?: ReadonlyArray<number>;
	loading?: boolean;
	error?: string;
	className?: string;
}>;

type TooltipState = Readonly<{
	month: string;
	monthIndex: number;
	value: number;
	color: string;
	x: number;
	y: number;
}>;

type TooltipSize = Readonly<{
	width: number;
	height: number;
}>;

type WrapperSize = Readonly<{
	width: number;
	height: number;
}>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const CHART_WIDTH = 760;
const CHART_HEIGHT = 210;
const CHART_PADDING = { top: 14, right: 0, bottom: 24, left: 22 };
const TOOLTIP_EDGE_PADDING = 8;
const TOOLTIP_OFFSET_X = 8;
const TOOLTIP_OFFSET_Y = 6;
const DEFAULT_TOOLTIP_SIZE: TooltipSize = { width: 280, height: 38 };


export default function MonthlyReceptionQuantitiesChart({
	months = [],
	values = [],
	loading = false,
	error = "",
	className,
}: MonthlyReceptionQuantitiesChartProps) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [tooltipSize, setTooltipSize] = useState<TooltipSize>({ width: 0, height: 0 });
	const [wrapperSize, setWrapperSize] = useState<WrapperSize>({ width: 0, height: 0 });
	const monthlyValues = useMemo(() => {
		const normalizedEntries = new Map<string, number>();

		months.forEach((month, index) => {
			normalizedEntries.set(normalizeMonth(month), sanitizeValue(values[index] ?? 0));
		});

		return MONTHS.map((month) => normalizedEntries.get(month) ?? 0);
	}, [months, values]);
	const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
	const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
	const chartMax = getNiceAxisMax(Math.max(...monthlyValues, 0));
	const yAxisTicks = buildYAxisTicks(chartMax, 5);
	const monthSlotWidth = plotWidth / MONTHS.length;
	const barWidth = Math.min(34, Math.max(18, monthSlotWidth * 0.56));

	useLayoutEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) {
			return;
		}

		const updateWrapperSize = () => {
			const nextWidth = wrapper.clientWidth;
			const nextHeight = wrapper.clientHeight;

			setWrapperSize((currentSize) => {
				if (currentSize.width === nextWidth && currentSize.height === nextHeight) {
					return currentSize;
				}

				return { width: nextWidth, height: nextHeight };
			});
		};

		updateWrapperSize();

		const resizeObserver = new ResizeObserver(() => {
			updateWrapperSize();
		});

		resizeObserver.observe(wrapper);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	useLayoutEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			const nextWidth = tooltipRef.current?.offsetWidth ?? 0;
			const nextHeight = tooltipRef.current?.offsetHeight ?? 0;

			setTooltipSize((currentSize) => {
				if (currentSize.width === nextWidth && currentSize.height === nextHeight) {
					return currentSize;
				}

				return { width: nextWidth, height: nextHeight };
			});
		});

		return () => {
			window.cancelAnimationFrame(frameId);
		};
	}, [tooltip]);

	if (loading) {
		return <ChartMessage className={className} tone="neutral" message="Loading monthly reception quantities..." />;
	}

	if (error) {
		return <ChartMessage className={className} tone="error" message={error} />;
	}

	if (months.length === 0 || values.length === 0) {
		return <ChartMessage className={className} tone="neutral" message="No monthly reception data available yet." />;
	}

	return (
		<div className={joinClasses("flex h-full min-h-0 flex-col", className)}>
			<div ref={wrapperRef} className="relative min-h-0 flex-1 overflow-visible">
				<div className="h-full w-full overflow-hidden">
					<svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-full w-full">
					{yAxisTicks.map((tickValue) => {
						const y = getYPosition(tickValue, chartMax, plotHeight);

						return (
							<g key={tickValue} transform={`translate(0 ${y})`}>
								<line
									x1={CHART_PADDING.left}
									y1={CHART_PADDING.top}
									x2={CHART_WIDTH - CHART_PADDING.right}
									y2={CHART_PADDING.top}
									stroke={GREENSHARE_PALETTE.highlight}
									strokeWidth="1"
									opacity={tickValue === 0 ? 0.34 : 0.18}
								/>
								<text
									x={CHART_PADDING.left - 8}
									y={CHART_PADDING.top + 4}
									textAnchor="end"
									className="fill-slate-500 text-[12px]"
								>
									{formatValue(tickValue)}
								</text>
							</g>
						);
					})}

					<line
						x1={CHART_PADDING.left}
						y1={CHART_PADDING.top}
						x2={CHART_PADDING.left}
						y2={CHART_HEIGHT - CHART_PADDING.bottom}
						stroke={GREENSHARE_PALETTE.secondary}
						opacity="0.32"
						strokeWidth="1.4"
					/>
					<line
						x1={CHART_PADDING.left}
						y1={CHART_HEIGHT - CHART_PADDING.bottom}
						x2={CHART_WIDTH - CHART_PADDING.right}
						y2={CHART_HEIGHT - CHART_PADDING.bottom}
						stroke={GREENSHARE_PALETTE.secondary}
						strokeWidth="1.4"
						opacity="0.32"
					/>

					{MONTHS.map((month, index) => {
						const value = monthlyValues[index];
						const barHeight = getBarHeight(value, chartMax, plotHeight);
						const barX = CHART_PADDING.left + monthSlotWidth * index + (monthSlotWidth - barWidth) / 2;
						const barY = CHART_PADDING.top + plotHeight - barHeight;
						const barColor = GREENSHARE_SERIES[index % GREENSHARE_SERIES.length];
						const isActive = activeIndex === index;

						return (
							<g key={`${month}-${index}`}>
								<rect
									x={barX}
									y={barY}
									width={barWidth}
									height={Math.max(barHeight, 2)}
									rx={10}
									fill={barColor}
									opacity={isActive ? 1 : value > 0 ? 0.92 : 0.26}
									onMouseEnter={(event) => {
										const cursorPosition = getPointerPosition(event, wrapperRef);
										setActiveIndex(index);
										setTooltip({
											month,
											monthIndex: index,
											value,
											color: barColor,
											x: cursorPosition?.x ?? scaleSvgXToWrapper(barX + barWidth / 2, wrapperSize.width),
											y: cursorPosition?.y ?? scaleSvgYToWrapper(barY, wrapperSize.height),
										});
									}}
									onFocus={() => {
										setActiveIndex(index);
										setTooltip({
											month,
											monthIndex: index,
											value,
											color: barColor,
											x: scaleSvgXToWrapper(barX + barWidth / 2, wrapperSize.width),
											y: scaleSvgYToWrapper(barY, wrapperSize.height),
										});
									}}
									onMouseLeave={() => {
										setActiveIndex(null);
										setTooltip(null);
									}}
									onBlur={() => {
										setActiveIndex(null);
										setTooltip(null);
									}}
									tabIndex={0}
								>
									<title>{`${month}: ${formatValue(value)} Kgs`}</title>
								</rect>
								<text
									x={barX + barWidth / 2}
									y={CHART_HEIGHT - 3}
									textAnchor="middle"
									className="fill-slate-500 text-[11px]"
								>
									{month}
								</text>
							</g>
						);
					})}
					</svg>
				</div>
				{tooltip ? (
					<div
						ref={tooltipRef}
						className="pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] shadow-lg"
						style={getTooltipStyle(tooltip, tooltipSize, wrapperSize)}
					>
						<div className="flex items-center gap-1.5 text-slate-700">
							<span className="h-2 w-2 rounded-full" style={{ backgroundColor: tooltip.color }} />
							<p>{tooltip.month}</p>
							<span className="text-slate-400">•</span>
							<p className="font-medium" style={{ color: tooltip.color }}>
								{formatValue(tooltip.value)} Kgs
							</p>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}


function ChartMessage({ className, tone, message }: Readonly<{ className?: string; tone: "neutral" | "error"; message: string }>) {
	return (
		<div className={joinClasses("flex h-full items-center justify-center px-4 text-center text-sm", tone === "error" ? "text-rose-700" : "text-slate-600", className)}>
			<p>{message}</p>
		</div>
	);
}


function getBarHeight(value: number, maxValue: number, plotHeight: number) {
	if (maxValue <= 0) {
		return 0;
	}

	return (value / maxValue) * plotHeight;
}


function getYPosition(value: number, maxValue: number, plotHeight: number) {
	if (maxValue <= 0) {
		return plotHeight;
	}

	return plotHeight - (value / maxValue) * plotHeight;
}


function sanitizeValue(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}

	return value;
}


function formatValue(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
	}).format(value);
}


function buildYAxisTicks(maxValue: number, tickCount: number) {
	if (tickCount <= 1) {
		return [maxValue];
	}

	return Array.from({ length: tickCount }, (_, index) => (maxValue / (tickCount - 1)) * index);
}


function normalizeMonth(month: string) {
	const normalized = month.trim().slice(0, 3).toLowerCase();
	const matchedMonth = MONTHS.find((entry) => entry.toLowerCase() === normalized);

	return matchedMonth ?? month;
}


function getNiceAxisMax(value: number) {
	if (value <= 0) {
		return 1;
	}

	const roughStep = value / 4;
	const magnitude = 10 ** Math.floor(Math.log10(roughStep));
	const normalizedStep = roughStep / magnitude;
	const niceStep = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;

	return Math.ceil(value / (niceStep * magnitude)) * niceStep * magnitude;
}


function getTooltipStyle(tooltip: TooltipState, tooltipSize: TooltipSize, wrapperSize: WrapperSize) {
	const resolvedTooltipSize = {
		width: tooltipSize.width > 0 ? tooltipSize.width : DEFAULT_TOOLTIP_SIZE.width,
		height: tooltipSize.height > 0 ? tooltipSize.height : DEFAULT_TOOLTIP_SIZE.height,
	};
	const resolvedWrapperSize = {
		width: wrapperSize.width > 0 ? wrapperSize.width : CHART_WIDTH,
		height: wrapperSize.height > 0 ? wrapperSize.height : CHART_HEIGHT,
	};
	const renderBelow = tooltip.y <= resolvedWrapperSize.height / 2;
	const renderLeft = tooltip.monthIndex >= 9;
	const rawLeft = renderLeft
		? tooltip.x - resolvedTooltipSize.width - TOOLTIP_OFFSET_X
		: tooltip.x + TOOLTIP_OFFSET_X;
	const rawTop = renderBelow
		? tooltip.y + TOOLTIP_OFFSET_Y
		: tooltip.y - resolvedTooltipSize.height - TOOLTIP_OFFSET_Y;
	const left = clamp(rawLeft, TOOLTIP_EDGE_PADDING, resolvedWrapperSize.width - resolvedTooltipSize.width - TOOLTIP_EDGE_PADDING);
	const top = clamp(rawTop, TOOLTIP_EDGE_PADDING, resolvedWrapperSize.height - resolvedTooltipSize.height - TOOLTIP_EDGE_PADDING);

	return {
		left: `${left}px`,
		top: `${top}px`,
	} as const;
}


function getPointerPosition(
	event: React.MouseEvent<SVGRectElement, MouseEvent>,
	wrapperRef: React.RefObject<HTMLDivElement | null>,
) {
	const wrapper = wrapperRef.current;

	if (!wrapper) {
		return null;
	}

	const rect = wrapper.getBoundingClientRect();

	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
}


function scaleSvgXToWrapper(x: number, wrapperWidth: number) {
	const resolvedWrapperWidth = wrapperWidth > 0 ? wrapperWidth : CHART_WIDTH;
	return (x / CHART_WIDTH) * resolvedWrapperWidth;
}


function scaleSvgYToWrapper(y: number, wrapperHeight: number) {
	const resolvedWrapperHeight = wrapperHeight > 0 ? wrapperHeight : CHART_HEIGHT;
	return (y / CHART_HEIGHT) * resolvedWrapperHeight;
}


function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}


function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
