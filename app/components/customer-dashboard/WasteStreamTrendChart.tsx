"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { GREENSHARE_PALETTE, GREENSHARE_SERIES } from "@/app/components/customer-dashboard/greensharePalette";


type WasteStreamTrendPoint = Readonly<{
	month: string;
	quantities_by_stream: Readonly<Record<string, number>>;
}>;

type WasteStreamTrendChartProps = Readonly<{
	wasteStreams?: ReadonlyArray<string>;
	points?: ReadonlyArray<WasteStreamTrendPoint>;
	loading?: boolean;
	error?: string;
	className?: string;
}>;

type StreamSeries = Readonly<{
	name: string;
	color: string;
	values: number[];
}>;

type TooltipState = Readonly<{
	streamName: string;
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
const CHART_PADDING = { top: 22, right: 0, bottom: 24, left: 42 };
const X_AXIS_EDGE_INSET = 12;
const TOOLTIP_EDGE_PADDING = 8;
const TOOLTIP_OFFSET_X = 8;
const TOOLTIP_OFFSET_Y = 6;
const DEFAULT_TOOLTIP_SIZE: TooltipSize = { width: 280, height: 38 };

export default function WasteStreamTrendChart({
	wasteStreams = [],
	points = [],
	loading = false,
	error = "",
	className,
}: WasteStreamTrendChartProps) {
	const [activeSeriesName, setActiveSeriesName] = useState<string | null>(null);
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [tooltipSize, setTooltipSize] = useState<TooltipSize>({ width: 0, height: 0 });
	const [wrapperSize, setWrapperSize] = useState<WrapperSize>({ width: 0, height: 0 });
	const normalizedPoints = useMemo(
		() =>
			points.map((point) => ({
				month: normalizeMonth(point.month),
				quantities_by_stream: Object.fromEntries(
					Object.entries(point.quantities_by_stream).map(([streamName, value]) => [streamName, sanitizeValue(value)]),
				),
			})),
		[points],
	);
	const monthlyPoints = useMemo(
		() =>
			MONTHS.map((month) => {
				const matchedPoint = normalizedPoints.find((point) => point.month === month);
				return {
					month,
					quantities_by_stream: matchedPoint?.quantities_by_stream ?? {},
				};
			}),
		[normalizedPoints],
	);
	const displaySeries = useMemo<ReadonlyArray<StreamSeries>>(
		() =>
			wasteStreams.map((streamName, index) => ({
				name: streamName,
				color: GREENSHARE_SERIES[index % GREENSHARE_SERIES.length],
				values: monthlyPoints.map((point) => sanitizeValue(point.quantities_by_stream[streamName] ?? 0)),
			})),
		[monthlyPoints, wasteStreams],
	);
	const repeatedSeries = useMemo(
		() => displaySeries.filter((stream) => stream.values.filter((value) => value > 0).length > 1),
		[displaySeries],
	);
	const scatterPoints = useMemo(
		() => displaySeries.flatMap((stream) => {
			const activeMonthIndexes = stream.values
				.map((value, index) => ({ value, index }))
				.filter((entry) => entry.value > 0);

			if (activeMonthIndexes.length !== 1) {
				return [];
			}

			return [{
				streamName: stream.name,
				color: stream.color,
				value: activeMonthIndexes[0]?.value ?? 0,
				monthIndex: activeMonthIndexes[0]?.index ?? 0,
				month: MONTHS[activeMonthIndexes[0]?.index ?? 0] ?? "",
			}];
		}),
		[displaySeries],
	);
	const yAxisMax = Math.max(
		...repeatedSeries.flatMap((stream) => stream.values),
		...scatterPoints.map((point) => point.value),
		0,
	);
	const chartMax = getNiceAxisMax(yAxisMax);
	const yAxisTicks = buildYAxisTicks(chartMax, 5);
	const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
	const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

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
		return <TrendMessage className={className} tone="neutral" message="Loading waste stream trend..." />;
	}

	if (error) {
		return <TrendMessage className={className} tone="error" message={error} />;
	}

	if (monthlyPoints.length === 0 || wasteStreams.length === 0) {
		return <TrendMessage className={className} tone="neutral" message="No waste stream trend data available yet." />;
	}

	if (repeatedSeries.length === 0 && scatterPoints.length === 0) {
		return <TrendMessage className={className} tone="neutral" message="No waste stream trend data available yet." />;
	}

	return (
		<div className={joinClasses("flex h-full min-h-0 flex-col", className)}>
			<div ref={wrapperRef} className="relative -mt-1 min-h-0 flex-1 overflow-visible">
				<div className="h-full w-full overflow-hidden">
					<svg ref={svgRef} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-full w-full">
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
										{formatAxisValue(tickValue)}
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
							strokeWidth="1.4"
							opacity="0.32"
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

						{monthlyPoints.map((point, index) => {
							const x = getXPosition(index, monthlyPoints.length, plotWidth);

							return (
								<g key={`${point.month}-${index}`}>
									<text
										x={CHART_PADDING.left + x}
										y={CHART_HEIGHT - 3}
										textAnchor="middle"
										className="fill-slate-500 text-[11px]"
									>
										{point.month}
									</text>
								</g>
							);
						})}
						{repeatedSeries.map((stream) => {
							const isActive = activeSeriesName === null || activeSeriesName === stream.name;
							const linePoints = stream.values.map((value, index) => ({
								x: CHART_PADDING.left + getXPosition(index, monthlyPoints.length, plotWidth),
								y: CHART_PADDING.top + getYPosition(value, chartMax, plotHeight),
								value,
								month: monthlyPoints[index]?.month ?? "",
							}));
							const pointsAttribute = stream.values.map((value, index) => {
								const x = CHART_PADDING.left + getXPosition(index, monthlyPoints.length, plotWidth);
								const y = CHART_PADDING.top + getYPosition(value, chartMax, plotHeight);
								return `${x},${y}`;
							}).join(" ");

							return (
								<g
									key={stream.name}
									onMouseEnter={() => setActiveSeriesName(stream.name)}
									onFocus={() => setActiveSeriesName(stream.name)}
									onMouseLeave={() => {
										setActiveSeriesName(null);
										setTooltip(null);
									}}
									onBlur={() => {
										setActiveSeriesName(null);
										setTooltip(null);
									}}
								>
									<polyline
										fill="none"
										stroke="transparent"
										strokeWidth={14}
										strokeLinecap="round"
										strokeLinejoin="round"
										points={pointsAttribute}
										onMouseMove={(event) => {
											const nearestIndex = getNearestPointIndex(event, svgRef, linePoints);
											if (nearestIndex === null) {
												return;
											}

											const point = linePoints[nearestIndex];
											const cursorPosition = getPointerPosition(event, wrapperRef);
											setTooltip({
												streamName: stream.name,
												month: point.month,
												monthIndex: nearestIndex,
												value: point.value,
												color: stream.color,
												x: cursorPosition?.x ?? scaleSvgXToWrapper(point.x, wrapperSize.width),
												y: cursorPosition?.y ?? scaleSvgYToWrapper(point.y, wrapperSize.height),
											});
										}}
									/>
									<polyline
										fill="none"
										stroke={stream.color}
										strokeWidth={isActive ? 3 : 2}
										strokeLinecap="round"
										strokeLinejoin="round"
										opacity={isActive ? 1 : 0.32}
										points={pointsAttribute}
									/>
									{stream.values.map((value, index) => {
										const x = CHART_PADDING.left + getXPosition(index, monthlyPoints.length, plotWidth);
										const y = CHART_PADDING.top + getYPosition(value, chartMax, plotHeight);

										return (
											<circle
												key={`${stream.name}-${monthlyPoints[index]?.month ?? index}`}
												cx={x}
												cy={y}
												r={isActive ? 4.5 : 3.5}
												fill={stream.color}
												opacity={isActive ? 1 : 0.35}
												onMouseEnter={(event) => {
													setActiveSeriesName(stream.name);
													const cursorPosition = getPointerPosition(event, wrapperRef);
													setTooltip({
														streamName: stream.name,
														month: monthlyPoints[index]?.month ?? "",
														monthIndex: index,
														value,
														color: stream.color,
														x: cursorPosition?.x ?? scaleSvgXToWrapper(x, wrapperSize.width),
														y: cursorPosition?.y ?? scaleSvgYToWrapper(y, wrapperSize.height),
													});
												}}
												onFocus={() => {
													setActiveSeriesName(stream.name);
													setTooltip({
														streamName: stream.name,
														month: monthlyPoints[index]?.month ?? "",
														monthIndex: index,
														value,
														color: stream.color,
														x: scaleSvgXToWrapper(x, wrapperSize.width),
														y: scaleSvgYToWrapper(y, wrapperSize.height),
													});
												}}
											/>
										);
									})}
								</g>
							);
						})}
						{scatterPoints.map((point) => {
							const x = CHART_PADDING.left + getXPosition(point.monthIndex, monthlyPoints.length, plotWidth);
							const y = CHART_PADDING.top + getYPosition(point.value, chartMax, plotHeight);
							const radius = 4 + Math.min(6, (point.value / Math.max(chartMax, 1)) * 8);

							return (
								<circle
									key={`${point.streamName}-${point.month}`}
									cx={x}
									cy={y}
									r={radius}
									fill={point.color}
									opacity={activeSeriesName === null || activeSeriesName === point.streamName ? 0.92 : 0.3}
									className="cursor-pointer transition-opacity duration-150"
									onMouseEnter={(event) => {
										setActiveSeriesName(point.streamName);
										const cursorPosition = getPointerPosition(event, wrapperRef);
										setTooltip({
											streamName: point.streamName,
											month: point.month,
											monthIndex: point.monthIndex,
											value: point.value,
											color: point.color,
											x: cursorPosition?.x ?? scaleSvgXToWrapper(x, wrapperSize.width),
											y: cursorPosition?.y ?? scaleSvgYToWrapper(y, wrapperSize.height),
										});
									}}
									onMouseLeave={() => {
										setActiveSeriesName(null);
										setTooltip(null);
									}}
									onFocus={() => {
										setActiveSeriesName(point.streamName);
										setTooltip({
											streamName: point.streamName,
											month: point.month,
											monthIndex: point.monthIndex,
											value: point.value,
											color: point.color,
											x: scaleSvgXToWrapper(x, wrapperSize.width),
											y: scaleSvgYToWrapper(y, wrapperSize.height),
										});
									}}
								/>
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
							<p className="font-semibold text-slate-800">{tooltip.streamName}</p>
							<span className="text-slate-400">•</span>
							<p>{tooltip.month}</p>
							<span className="text-slate-400">•</span>
							<p className="font-medium" style={{ color: tooltip.color }}>
								{formatAxisValue(tooltip.value)} Kgs
							</p>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}


function TrendMessage({ className, tone, message }: Readonly<{ className?: string; tone: "neutral" | "error"; message: string }>) {
	return (
		<div className={joinClasses("flex h-full items-center justify-center px-4 text-center text-sm", tone === "error" ? "text-rose-700" : "text-slate-600", className)}>
			<p>{message}</p>
		</div>
	);
}


function getXPosition(index: number, pointCount: number, plotWidth: number) {
	if (pointCount <= 1) {
		return plotWidth / 2;
	}

	const usablePlotWidth = Math.max(plotWidth - X_AXIS_EDGE_INSET * 2, 0);
	return X_AXIS_EDGE_INSET + (index / (pointCount - 1)) * usablePlotWidth;
}


function getYPosition(value: number, maxValue: number, plotHeight: number) {
	if (maxValue <= 0) {
		return plotHeight;
	}

	return plotHeight - (value / maxValue) * plotHeight;
}


function buildYAxisTicks(maxValue: number, tickCount: number) {
	if (tickCount <= 1) {
		return [maxValue];
	}

	return Array.from({ length: tickCount }, (_, index) => (maxValue / (tickCount - 1)) * index);
}


function sanitizeValue(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}

	return value;
}


function formatAxisValue(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
	}).format(value);
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
	const renderLeft = tooltip.monthIndex >= 8;
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
		transform: "translate(0, 0)",
	} as const;
}


function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
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


function getNearestPointIndex(
	event: React.MouseEvent<SVGPolylineElement, MouseEvent>,
	svgRef: React.RefObject<SVGSVGElement | null>,
	points: ReadonlyArray<{ x: number }>,
) {
	const svg = svgRef.current;

	if (!svg || points.length === 0) {
		return null;
	}

	const rect = svg.getBoundingClientRect();
	const relativeX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
	let nearestIndex = 0;
	let nearestDistance = Number.POSITIVE_INFINITY;

	points.forEach((point, index) => {
		const distance = Math.abs(point.x - relativeX);
		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearestIndex = index;
		}
	});

	return nearestIndex;
}


function getPointerPosition(
	event: React.MouseEvent<SVGCircleElement | SVGPolylineElement, MouseEvent>,
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


function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
