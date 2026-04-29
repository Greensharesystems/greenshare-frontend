"use client";

import { useMemo, useState } from "react";

import { GREENSHARE_PALETTE, GREENSHARE_SERIES } from "@/app/components/customer-dashboard/greensharePalette";


type SecondaryLoopFlow = Readonly<{
	waste_stream_name: string;
	secondary_product: string;
	secondary_loop: string;
	quantity: number;
}>;

type SecondaryProduct = "Materials" | "Energy";

type NormalizedSecondaryLoopFlow = Readonly<{
	waste_stream_name: string;
	secondary_product: SecondaryProduct;
	secondary_loop: string;
	quantity: number;
}>;

type SankeyNode = Readonly<{
	label: string;
	x: number;
	y: number;
	total: number;
	color: string;
	accentColor: string;
	barHeight: number;
	barWidth: number;
}>;

type SankeyLink = Readonly<{
	key: string;
	sourceLabel: string;
	targetLabel: string;
	quantity: number;
	color: string;
	accentColor: string;
	path: string;
	tooltipX: number;
	tooltipY: number;
}>;

type HoveredLink = Readonly<{
	key: string;
	x: number;
	y: number;
	sourceLabel: string;
	targetLabel: string;
	quantity: number;
	accentColor: string;
}>;

type SecondaryLoopSankeyProps = Readonly<{
	flows?: ReadonlyArray<SecondaryLoopFlow>;
	loading?: boolean;
	error?: string;
	className?: string;
}>;

const SANKEY_WIDTH = 820;
const SANKEY_HEIGHT = 228;
const HEADING_Y = 20;
const GUIDE_Y = 16;
const GUIDE_LEFT_START_X = 140;
const GUIDE_LEFT_END_X = 292;
const GUIDE_RIGHT_START_X = 502;
const GUIDE_RIGHT_END_X = 656;
const SOURCE_X = 92;
const PRODUCT_X = 404;
const LOOP_X = 744;
const SOURCE_STAGE_TOP = 62;
const SOURCE_STAGE_BOTTOM = 202;
const PRODUCT_STAGE_TOP = 88;
const PRODUCT_STAGE_BOTTOM = 172;
const LOOP_STAGE_TOP = 88;
const LOOP_STAGE_BOTTOM = 172;


export default function SecondaryLoopSankey({
	flows = [],
	loading = false,
	error = "",
	className,
}: SecondaryLoopSankeyProps) {
	const [activeLink, setActiveLink] = useState<HoveredLink | null>(null);
	const sanitizedFlows = useMemo(
		() => flows
			.filter((flow) => Number.isFinite(flow.quantity) && flow.quantity > 0)
			.map((flow) => ({
				waste_stream_name: flow.waste_stream_name.trim() || "Unspecified",
				secondary_product: normalizeProductLabel(flow.secondary_product),
				secondary_loop: normalizeLoopLabel(flow.secondary_loop),
				quantity: flow.quantity,
			}))
			.filter((flow): flow is NormalizedSecondaryLoopFlow => flow.secondary_product !== null && flow.secondary_loop !== null),
		[flows],
	);

	if (loading) {
		return <SankeyMessage className={className} tone="neutral" message="Loading secondary loop flow..." />;
	}

	if (error) {
		return <SankeyMessage className={className} tone="error" message={error} />;
	}

	if (sanitizedFlows.length === 0) {
		return <SankeyMessage className={className} tone="neutral" message="No secondary loop flow available yet." />;
	}

	const sourceTotals = buildStageTotals(sanitizedFlows, (flow) => flow.waste_stream_name);
	const productTotals = buildStageTotals(sanitizedFlows, (flow) => flow.secondary_product);
	const loopTotals = buildStageTotals(sanitizedFlows, (flow) => flow.secondary_loop);
	const maxSourceTotal = Math.max(...sourceTotals.map((node) => node.total), 0) || 1;
	const maxProductTotal = Math.max(...productTotals.map((node) => node.total), 0) || 1;
	const maxLoopTotal = Math.max(...loopTotals.map((node) => node.total), 0) || 1;
	const sourceNodes = buildNodes({
		entries: sourceTotals,
		x: SOURCE_X,
		stageTop: SOURCE_STAGE_TOP,
		stageBottom: SOURCE_STAGE_BOTTOM,
		maxTotal: maxSourceTotal,
		minBarHeight: 10,
		maxBarHeight: 22,
		barWidth: 8,
		getColors: (_, index) => getSourcePalette(index),
	});
	const productNodes = buildNodes({
		entries: productTotals,
		x: PRODUCT_X,
		stageTop: PRODUCT_STAGE_TOP,
		stageBottom: PRODUCT_STAGE_BOTTOM,
		maxTotal: maxProductTotal,
		minBarHeight: 20,
		maxBarHeight: 36,
		barWidth: 12,
		getColors: (label) => ({
			color: getProductNodeColor(label as SecondaryProduct),
			accentColor: getProductAccentColor(label as SecondaryProduct),
		}),
	});
	const loopNodes = buildNodes({
		entries: loopTotals,
		x: LOOP_X,
		stageTop: LOOP_STAGE_TOP,
		stageBottom: LOOP_STAGE_BOTTOM,
		maxTotal: maxLoopTotal,
		minBarHeight: 20,
		maxBarHeight: 36,
		barWidth: 12,
		getColors: (label) => ({
			color: getLoopNodeColor(label),
			accentColor: getLoopAccentColor(label),
		}),
	});
	const sourceNodeByLabel = new Map(sourceNodes.map((node) => [node.label, node]));
	const productNodeByLabel = new Map(productNodes.map((node) => [node.label, node]));
	const loopNodeByLabel = new Map(loopNodes.map((node) => [node.label, node]));
	const stageOneLinks = buildStageOneLinks(sanitizedFlows, sourceNodeByLabel, productNodeByLabel);
	const stageTwoLinks = buildStageTwoLinks(sanitizedFlows, productNodeByLabel, loopNodeByLabel);
	const maxStageOneQuantity = Math.max(...stageOneLinks.map((link) => link.quantity), 0) || 1;
	const maxStageTwoQuantity = Math.max(...stageTwoLinks.map((link) => link.quantity), 0) || 1;

	return (
		<div className={joinClasses("flex h-full min-h-0 flex-col", className)}>
			<div className="relative min-h-0 flex-1 overflow-hidden">
				<svg
					viewBox={`0 0 ${SANKEY_WIDTH} ${SANKEY_HEIGHT}`}
					preserveAspectRatio="xMidYMin meet"
					className="block h-full w-full"
				>
					<defs>
						<filter id="greenshare-sankey-shadow" x="-50%" y="-50%" width="200%" height="200%">
							<feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor={GREENSHARE_PALETTE.primary} floodOpacity="0.12" />
						</filter>
						<marker id="secondary-loop-guide-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
							<path d="M 0 0 L 6 3 L 0 6 Z" fill={GREENSHARE_PALETTE.secondary} opacity="0.55" />
						</marker>
					</defs>

					<text x={18} y={HEADING_Y} className="fill-slate-600 text-[13px] font-semibold tracking-[0.015em]">Waste Streams</text>
					<path d={`M ${GUIDE_LEFT_START_X} ${GUIDE_Y} L ${GUIDE_LEFT_END_X} ${GUIDE_Y}`} stroke={GREENSHARE_PALETTE.secondary} strokeWidth="1.25" strokeDasharray="4 5" opacity="0.46" markerEnd="url(#secondary-loop-guide-arrow)" />
					<text x={PRODUCT_X - 64} y={HEADING_Y} className="fill-slate-600 text-[13px] font-semibold tracking-[0.015em]">Secondary Products</text>
					<path d={`M ${GUIDE_RIGHT_START_X} ${GUIDE_Y} L ${GUIDE_RIGHT_END_X} ${GUIDE_Y}`} stroke={GREENSHARE_PALETTE.secondary} strokeWidth="1.25" strokeDasharray="4 5" opacity="0.46" markerEnd="url(#secondary-loop-guide-arrow)" />
					<text x={LOOP_X - 52} y={HEADING_Y} className="fill-slate-600 text-[13px] font-semibold tracking-[0.015em]">Secondary Loops</text>

					{stageTwoLinks.map((link) => {
						const isActive = activeLink === null || activeLink.key === link.key;
						const strokeWidth = 6 + (link.quantity / maxStageTwoQuantity) * 6;

						return (
							<g key={link.key}>
								<path
									d={link.path}
									stroke={link.color}
									strokeWidth={strokeWidth + 1.8}
									strokeLinecap="round"
									fill="none"
									opacity={isActive ? 0.14 : 0.05}
								/>
								<path
									d={link.path}
									stroke={link.accentColor}
									strokeWidth={strokeWidth}
									strokeLinecap="round"
									fill="none"
									opacity={isActive ? 0.74 : 0.2}
									filter={isActive ? "url(#greenshare-sankey-shadow)" : undefined}
									tabIndex={0}
									onMouseEnter={() => setActiveLink(createHoveredLink(link))}
									onMouseLeave={() => setActiveLink(null)}
									onFocus={() => setActiveLink(createHoveredLink(link))}
									onBlur={() => setActiveLink(null)}
								>
									<title>{`${link.sourceLabel} -> ${link.targetLabel}: ${formatValue(link.quantity)} Kgs`}</title>
								</path>
							</g>
						);
					})}

					{stageOneLinks.map((link) => {
						const isActive = activeLink === null || activeLink.key === link.key;
						const strokeWidth = 4 + (link.quantity / maxStageOneQuantity) * 5;

						return (
							<g key={link.key}>
								<path
									d={link.path}
									stroke={link.color}
									strokeWidth={strokeWidth + 1.5}
									strokeLinecap="round"
									fill="none"
									opacity={isActive ? 0.15 : 0.06}
								/>
								<path
									d={link.path}
									stroke={link.accentColor}
									strokeWidth={strokeWidth}
									strokeLinecap="round"
									fill="none"
									opacity={isActive ? 0.86 : 0.24}
									filter={isActive ? "url(#greenshare-sankey-shadow)" : undefined}
									tabIndex={0}
									onMouseEnter={() => setActiveLink(createHoveredLink(link))}
									onMouseLeave={() => setActiveLink(null)}
									onFocus={() => setActiveLink(createHoveredLink(link))}
									onBlur={() => setActiveLink(null)}
								>
									<title>{`${link.sourceLabel} -> ${link.targetLabel}: ${formatValue(link.quantity)} Kgs`}</title>
								</path>
							</g>
						);
					})}

					{sourceNodes.map((node) => (
						<g key={node.label}>
							<text x={node.x - 10} y={node.y + 4.5} textAnchor="end" className="fill-slate-700 text-[12px] font-medium">
								{truncateLabel(node.label, 24)}
							</text>
							<rect
								x={node.x - node.barWidth / 2}
								y={node.y - node.barHeight / 2}
								width={node.barWidth}
								height={node.barHeight}
								rx={node.barWidth / 2}
								fill={node.color}
								stroke={node.accentColor}
								strokeWidth="1.1"
							/>
						</g>
					))}

					{productNodes.map((node) => (
						<g key={node.label}>
							<rect
								x={node.x - node.barWidth / 2}
								y={node.y - node.barHeight / 2}
								width={node.barWidth}
								height={node.barHeight}
								rx={node.barWidth / 2}
								fill={node.color}
								stroke={node.accentColor}
								strokeWidth="1.2"
							/>
							<text x={node.x} y={node.y - node.barHeight / 2 - 12} textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">
								{node.label}
							</text>
						</g>
					))}

					{loopNodes.map((node) => (
						<g key={node.label}>
							<rect
								x={node.x - node.barWidth / 2}
								y={node.y - node.barHeight / 2}
								width={node.barWidth}
								height={node.barHeight}
								rx={node.barWidth / 2}
								fill={node.color}
								stroke={node.accentColor}
								strokeWidth="1.1"
							/>
							<text x={node.x + 12} y={node.y - 1} className="fill-slate-900 text-[13px] font-semibold">
								{node.label}
							</text>
							<text x={node.x + 12} y={node.y + 14} className="fill-slate-500 text-[11px] font-medium">
								{formatValue(node.total)} Kgs
							</text>
						</g>
					))}

					{activeLink ? <SankeyTooltip hoveredLink={activeLink} /> : null}
				</svg>
			</div>
		</div>
	);
}


function SankeyMessage({ className, tone, message }: Readonly<{ className?: string; tone: "neutral" | "error"; message: string }>) {
	return (
		<div className={joinClasses("flex h-full items-center justify-center px-4 text-center text-sm", tone === "error" ? "text-rose-700" : "text-slate-600", className)}>
			<p>{message}</p>
		</div>
	);
}


function SankeyTooltip({ hoveredLink }: Readonly<{ hoveredLink: HoveredLink }>) {
	const tooltipWidth = 170;
	const tooltipHeight = 50;
	const x = clamp(hoveredLink.x - tooltipWidth / 2, 96, SANKEY_WIDTH - tooltipWidth - 18);
	const y = clamp(hoveredLink.y - 38, 30, SANKEY_HEIGHT - tooltipHeight - 18);

	return (
		<g pointerEvents="none">
			<rect x={x} y={y} width={tooltipWidth} height={tooltipHeight} rx={12} fill={GREENSHARE_PALETTE.primary} opacity="0.95" />
			<circle cx={x + 14} cy={y + 16} r="3.5" fill={hoveredLink.accentColor} />
			<text x={x + 24} y={y + 19} className="fill-white text-[10px] font-medium">
				{truncateLabel(hoveredLink.sourceLabel, 20)}
			</text>
			<text x={x + 24} y={y + 31} className="text-[10px] font-medium" fill={GREENSHARE_PALETTE.highlight}>
				{truncateLabel(hoveredLink.targetLabel, 18)}
			</text>
			<text x={x + 24} y={y + 43} className="fill-white text-[10px] font-medium">
				{formatValue(hoveredLink.quantity)} Kgs
			</text>
		</g>
	);
}


function buildStageTotals(flows: ReadonlyArray<NormalizedSecondaryLoopFlow>, getLabel: (flow: NormalizedSecondaryLoopFlow) => string) {
	const totals = new Map<string, number>();

	for (const flow of flows) {
		const label = getLabel(flow);
		totals.set(label, (totals.get(label) ?? 0) + flow.quantity);
	}

	return [...totals.entries()]
		.map(([label, total]) => ({ label, total }))
		.sort((left, right) => right.total - left.total || left.label.localeCompare(right.label));
}


function buildNodes({
	entries,
	x,
	stageTop,
	stageBottom,
	maxTotal,
	minBarHeight,
	maxBarHeight,
	barWidth,
	getColors,
}: Readonly<{
	entries: ReadonlyArray<Readonly<{ label: string; total: number }>>;
	x: number;
	stageTop: number;
	stageBottom: number;
	maxTotal: number;
	minBarHeight: number;
	maxBarHeight: number;
	barWidth: number;
	getColors: (label: string, index: number) => Readonly<{ color: string; accentColor: string }>;
}>): ReadonlyArray<SankeyNode> {
	return entries.map((entry, index) => {
		const { color, accentColor } = getColors(entry.label, index);

		return {
			label: entry.label,
			x,
			y: getNodeY(index, entries.length, stageTop, stageBottom),
			total: entry.total,
			color,
			accentColor,
			barHeight: minBarHeight + (entry.total / maxTotal) * (maxBarHeight - minBarHeight),
			barWidth,
		} satisfies SankeyNode;
	});
}


function buildStageOneLinks(
	flows: ReadonlyArray<NormalizedSecondaryLoopFlow>,
	sourceNodeByLabel: ReadonlyMap<string, SankeyNode>,
	productNodeByLabel: ReadonlyMap<string, SankeyNode>,
) {
	const links: Array<SankeyLink | null> = flows
		.map((flow) => {
			const sourceNode = sourceNodeByLabel.get(flow.waste_stream_name);
			const productNode = productNodeByLabel.get(flow.secondary_product);

			if (!sourceNode || !productNode) {
				return null;
			}

			return {
				key: `stage-one::${flow.waste_stream_name}::${flow.secondary_product}::${flow.secondary_loop}`,
				sourceLabel: flow.waste_stream_name,
				targetLabel: flow.secondary_product as string,
				quantity: flow.quantity,
				color: sourceNode.color,
				accentColor: sourceNode.accentColor,
				path: buildCurvedPath(sourceNode.x, sourceNode.y, productNode.x, productNode.y, 88),
				tooltipX: (sourceNode.x + productNode.x) / 2,
				tooltipY: (sourceNode.y + productNode.y) / 2,
			} satisfies SankeyLink;
		});

	return links
		.filter((link): link is SankeyLink => link !== null)
		.sort((left, right) => right.quantity - left.quantity);
}


function buildStageTwoLinks(
	flows: ReadonlyArray<NormalizedSecondaryLoopFlow>,
	productNodeByLabel: ReadonlyMap<string, SankeyNode>,
	loopNodeByLabel: ReadonlyMap<string, SankeyNode>,
) {
	const totals = new Map<string, { sourceLabel: string; targetLabel: string; quantity: number }>();

	for (const flow of flows) {
		const key = `${flow.secondary_product}::${flow.secondary_loop}`;
		const current = totals.get(key);

		if (current) {
			current.quantity += flow.quantity;
			continue;
		}

		totals.set(key, {
			sourceLabel: flow.secondary_product,
			targetLabel: flow.secondary_loop,
			quantity: flow.quantity,
		});
	}

	const links: Array<SankeyLink | null> = [...totals.entries()]
		.map(([key, value]) => {
			const productNode = productNodeByLabel.get(value.sourceLabel);
			const loopNode = loopNodeByLabel.get(value.targetLabel);

			if (!productNode || !loopNode) {
				return null;
			}

			return {
				key: `stage-two::${key}`,
				sourceLabel: value.sourceLabel,
				targetLabel: value.targetLabel,
				quantity: value.quantity,
				color: productNode.color,
				accentColor: productNode.accentColor,
				path: buildCurvedPath(productNode.x, productNode.y, loopNode.x, loopNode.y, 92),
				tooltipX: (productNode.x + loopNode.x) / 2,
				tooltipY: (productNode.y + loopNode.y) / 2,
			} satisfies SankeyLink;
		});

	return links
		.filter((link): link is SankeyLink => link !== null)
		.sort((left, right) => right.quantity - left.quantity);
}


function buildCurvedPath(startX: number, startY: number, endX: number, endY: number, controlOffset: number) {
	return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
}


function createHoveredLink(link: SankeyLink): HoveredLink {
	return {
		key: link.key,
		x: link.tooltipX,
		y: link.tooltipY,
		sourceLabel: link.sourceLabel,
		targetLabel: link.targetLabel,
		quantity: link.quantity,
		accentColor: link.accentColor,
	};
}


function getNodeY(index: number, count: number, stageTop: number, stageBottom: number) {
	if (count <= 1) {
		return (stageTop + stageBottom) / 2;
	}

	return stageTop + ((stageBottom - stageTop) / (count - 1)) * index;
}


function normalizeProductLabel(label: string): SecondaryProduct | null {
	const normalizedValue = label.trim().toLowerCase();

	if (normalizedValue.includes("material")) {
		return "Materials";
	}

	if (normalizedValue.includes("energy")) {
		return "Energy";
	}

	return null;
}


function normalizeLoopLabel(label: string): string | null {
	const normalizedValue = label.trim();

	if (!normalizedValue) {
		return null;
	}

	if (/manufacturer/i.test(normalizedValue)) {
		return "Manufacturer";
	}

	if (/trader/i.test(normalizedValue)) {
		return "Trader";
	}

	return normalizedValue;
}


function getSourcePalette(index: number) {
	const color = GREENSHARE_SERIES[index % GREENSHARE_SERIES.length];
	const accentColor = GREENSHARE_SERIES[(index + 1) % GREENSHARE_SERIES.length];

	return {
		color,
		accentColor,
	} as const;
}


function getProductNodeColor(product: SecondaryProduct) {
	return product === "Materials" ? GREENSHARE_PALETTE.highlight : GREENSHARE_PALETTE.accent;
}


function getProductAccentColor(product: SecondaryProduct) {
	return product === "Materials" ? GREENSHARE_PALETTE.primary : GREENSHARE_PALETTE.secondary;
}


function getLoopNodeColor(loop: string) {
	return loop === "Manufacturer" ? GREENSHARE_PALETTE.primary : GREENSHARE_PALETTE.highlight;
}


function getLoopAccentColor(loop: string) {
	return loop === "Manufacturer" ? GREENSHARE_PALETTE.secondary : GREENSHARE_PALETTE.tertiary;
}


function formatValue(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
	}).format(value);
}


function truncateLabel(label: string, maxLength: number) {
	return label.length > maxLength ? `${label.slice(0, maxLength - 3)}...` : label;
}


function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}


function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}