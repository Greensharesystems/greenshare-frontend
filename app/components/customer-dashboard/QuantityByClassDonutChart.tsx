"use client";

import { useMemo, useRef, useState } from "react";

import { GREENSHARE_PALETTE } from "@/app/components/customer-dashboard/greensharePalette";

type QuantityByClassDonutChartProps = Readonly<{
	hazardousQuantity?: number;
	nonHazardousQuantity?: number;
	loading?: boolean;
	error?: string;
	className?: string;
}>;

type ChartSegment = Readonly<{
	id: "hazardous" | "non_hazardous";
	label: string;
	value: number;
	color: string;
	highlightColor: string;
}>;

type TooltipState = Readonly<{
	x: number;
	y: number;
	segment: ChartSegment;
	percent: number;
}>;

const CHART_SIZE = 120;
const STROKE_WIDTH = 16;
const ACTIVE_STROKE_WIDTH = 18;
const DONUT_RADIUS = (CHART_SIZE - ACTIVE_STROKE_WIDTH) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export default function QuantityByClassDonutChart({
	hazardousQuantity = 0,
	nonHazardousQuantity = 0,
	loading = false,
	error = "",
	className,
}: QuantityByClassDonutChartProps) {
	const [activeSegmentId, setActiveSegmentId] = useState<ChartSegment["id"] | null>(null);
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);
	const donutContainerRef = useRef<HTMLDivElement>(null);

	const segments = useMemo<ReadonlyArray<ChartSegment>>(
		() => [
			{
				id: "hazardous",
				label: "Hazardous",
				value: sanitizeChartValue(hazardousQuantity),
				color: GREENSHARE_PALETTE.primary,
				highlightColor: GREENSHARE_PALETTE.secondary,
			},
			{
				id: "non_hazardous",
				label: "Non-Hazardous",
				value: sanitizeChartValue(nonHazardousQuantity),
				color: GREENSHARE_PALETTE.accent,
				highlightColor: GREENSHARE_PALETTE.highlight,
			},
		],
		[hazardousQuantity, nonHazardousQuantity],
	);

	const totalQuantity = segments.reduce((sum, segment) => sum + segment.value, 0);

	if (loading) {
		return <ChartMessage className={className} tone="neutral" message="Loading class split..." />;
	}

	if (error) {
		return <ChartMessage className={className} tone="error" message={error} />;
	}

	if (totalQuantity <= 0) {
		return <ChartMessage className={className} tone="neutral" message="No processed quantities available yet." />;
	}

	let accumulatedOffset = 0;

	return (
		<div className={joinClasses("flex h-full min-h-0 flex-col", className)}>
			<div className="flex min-h-0 flex-1 items-center gap-3 overflow-hidden">
				<div ref={donutContainerRef} className="relative flex h-full max-h-30 w-30 shrink-0 items-center justify-center self-center">
					<svg viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`} className="h-full w-full -rotate-90">
						<circle
							cx={CHART_SIZE / 2}
							cy={CHART_SIZE / 2}
							r={DONUT_RADIUS}
							fill="transparent"
							stroke={GREENSHARE_PALETTE.tertiary}
							strokeWidth={STROKE_WIDTH}
							opacity="0.14"
						/>
						{segments.map((segment) => {
							const segmentLength = (segment.value / totalQuantity) * DONUT_CIRCUMFERENCE;
							const strokeDasharray = `${segmentLength} ${DONUT_CIRCUMFERENCE - segmentLength}`;
							const strokeDashoffset = -accumulatedOffset;
							accumulatedOffset += segmentLength;
							const isActive = activeSegmentId === segment.id;
							const percent = (segment.value / totalQuantity) * 100;

							return (
								<circle
									key={segment.id}
									cx={CHART_SIZE / 2}
									cy={CHART_SIZE / 2}
									r={DONUT_RADIUS}
									fill="transparent"
									stroke={isActive ? segment.highlightColor : segment.color}
									strokeWidth={isActive ? ACTIVE_STROKE_WIDTH : STROKE_WIDTH}
									strokeDasharray={strokeDasharray}
									strokeDashoffset={strokeDashoffset}
									strokeLinecap="round"
									className="cursor-pointer transition-all duration-200 ease-out"
									role="img"
									aria-label={`${segment.label}: ${percent.toFixed(1)}%, ${formatKgs(segment.value)} Kgs`}
									tabIndex={0}
									onMouseEnter={(event) => {
										setActiveSegmentId(segment.id);
										updateTooltipPosition(event.clientX, event.clientY, segment, percent, donutContainerRef, setTooltip);
									}}
									onMouseMove={(event) => {
										updateTooltipPosition(event.clientX, event.clientY, segment, percent, donutContainerRef, setTooltip);
									}}
									onMouseLeave={() => {
										setActiveSegmentId(null);
										setTooltip(null);
									}}
									onFocus={() => {
										setActiveSegmentId(segment.id);
										setTooltip({
											x: CHART_SIZE - 6,
											y: 14,
											segment,
											percent,
										});
									}}
									onBlur={() => {
										setActiveSegmentId(null);
										setTooltip(null);
									}}
								/>
							);
						})}
					</svg>

					{tooltip ? (
						<div
							className="pointer-events-none absolute z-10 min-w-31.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
							style={{
								left: `${Math.min(tooltip.x + 10, 78)}px`,
								top: `${Math.max(tooltip.y - 10, -4)}px`,
							}}
						>
							<div className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tooltip.segment.color }} />
								<p className="font-semibold text-slate-800">{tooltip.segment.label}</p>
							</div>
							<p className="mt-1 text-slate-600">{tooltip.percent.toFixed(1)}%</p>
							<p className="font-medium" style={{ color: tooltip.segment.color }}>
								{formatKgs(tooltip.segment.value)} Kgs
							</p>
						</div>
					) : null}
				</div>

				<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
					{segments.map((segment) => {
						const percent = (segment.value / totalQuantity) * 100;
						const isActive = activeSegmentId === segment.id;

						return (
							<button
								key={segment.id}
								type="button"
								className={joinClasses(
									"grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 rounded-2xl px-2.5 py-1 text-left transition-all duration-200",
									isActive ? "bg-slate-50" : "hover:bg-slate-50/70",
								)}
								style={isActive ? { backgroundColor: `${segment.color}14` } : undefined}
								onMouseEnter={() => setActiveSegmentId(segment.id)}
								onMouseLeave={() => setActiveSegmentId(null)}
								onFocus={() => setActiveSegmentId(segment.id)}
								onBlur={() => setActiveSegmentId(null)}
							>
								<span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
								<div className="min-w-0">
									<p className="text-xs font-medium leading-4 text-slate-800">{segment.label}</p>
									<p className="mt-1 flex items-baseline gap-1 text-xs leading-4">
										<span className="font-semibold" style={{ color: segment.color }}>
											{formatKgs(segment.value)}
										</span>
										<span className="text-[10px] font-normal text-slate-500">Kgs</span>
									</p>
									<p className="mt-1 text-[11px] leading-4 text-slate-500">{percent.toFixed(1)}%</p>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function ChartMessage({ className, tone, message }: Readonly<{ className?: string; tone: "neutral" | "error"; message: string }>) {
	return (
		<div
			className={joinClasses(
				"flex h-full items-center justify-center px-3 text-center text-sm",
				tone === "error" ? "text-rose-700" : "text-slate-600",
				className,
			)}
		>
			<p>{message}</p>
		</div>
	);
}

function updateTooltipPosition(
	clientX: number,
	clientY: number,
	segment: ChartSegment,
	percent: number,
	containerRef: React.RefObject<HTMLDivElement | null>,
	setTooltip: React.Dispatch<React.SetStateAction<TooltipState | null>>,
) {
	const rect = containerRef.current?.getBoundingClientRect();

	if (!rect) {
		return;
	}

	setTooltip({
		x: clientX - rect.left,
		y: clientY - rect.top,
		segment,
		percent,
	});
}

function sanitizeChartValue(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}

	return value;
}

function formatKgs(value: number) {
	if (Math.abs(value - Math.round(value)) < 0.01) {
		return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
	}

	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
