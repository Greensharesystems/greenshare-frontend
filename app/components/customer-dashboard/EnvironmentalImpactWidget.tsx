"use client";

import Image from "next/image";

type EnvironmentalImpactMetric = Readonly<{
	label: string;
	value: number | "TBU";
	format: "percent" | "decimal" | "tbu";
	unit?: "Kgs" | "Trees" | "Homes";
}>;


export default function EnvironmentalImpactWidget() {
	const metrics: ReadonlyArray<EnvironmentalImpactMetric> = [
		{
			label: "Landfill Diversion",
			value: 100,
			format: "percent",
		},
		{
			label: "CO2 Reduced",
			value: "TBU",
			format: "tbu",
			unit: "Kgs",
		},
		{
			label: "GHG Emissions Reduced",
			value: "TBU",
			format: "tbu",
			unit: "Kgs",
		},
		{
			label: "Trees Planted",
			value: "TBU",
			format: "tbu",
			unit: "Trees",
		},
		{
			label: "Homes Powered",
			value: "TBU",
			format: "tbu",
			unit: "Homes",
		},
	];

	const [landfillDiversion, co2Reduced, ghgEmissionsReduced, treesPlanted, homesPowered] = metrics;

	return (
		<div className="grid h-full min-h-0 overflow-hidden pt-px grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
			<div className="grid grid-cols-2 content-start gap-x-3 gap-y-1">
				<ImpactMetricBlock metric={landfillDiversion} />
				<ImpactMetricBlock metric={co2Reduced} />
			</div>

			<div className="content-start pt-px">
				<ImpactMetricBlock metric={ghgEmissionsReduced} />
			</div>

			<div className="grid grid-cols-2 content-start gap-x-3 gap-y-1">
				<ImpactMetricBlock metric={treesPlanted} />
				<ImpactMetricBlock metric={homesPowered} />
			</div>
		</div>
	);
}


function ImpactMetricBlock({ metric }: Readonly<{ metric: EnvironmentalImpactMetric }>) {
	const formattedValue = formatMetricNumber(metric.value, metric.format);
	const renderedUnit = metric.format === "percent" ? "%" : metric.unit;

	return (
		<div className="grid min-w-0 content-start gap-0.5 self-start">
			<div className="flex items-start gap-1">
				{metric.label === "Landfill Diversion" ? (
					<Image src="/icons/landfilldiversion-icon.png" alt="" width={12} height={12} className="mt-px h-3 w-3 shrink-0 object-contain" />
				) : metric.label === "CO2 Reduced" ? (
					<Image src="/icons/co2-icon.png" alt="" width={12} height={12} className="mt-px h-3 w-3 shrink-0 object-contain" />
				) : metric.label === "GHG Emissions Reduced" ? (
					<Image src="/icons/ghgemissions-icon.png" alt="" width={12} height={12} className="mt-px h-3 w-3 shrink-0 object-contain" />
				) : metric.label === "Trees Planted" ? (
					<Image src="/icons/treesplanted-icon.png" alt="" width={12} height={12} className="mt-px h-3 w-3 shrink-0 object-contain" />
				) : metric.label === "Homes Powered" ? (
					<Image src="/icons/homepowered-icon.png" alt="" width={12} height={12} className="-mt-0.5 h-3 w-3 shrink-0 object-contain" />
				) : (
					<span className="mt-0.5 h-3 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: "#34B34D" }} />
				)}
				<p className="text-[11px] font-medium leading-[1.05] text-slate-500">{metric.label}</p>
			</div>
			<div className="flex items-end gap-1 pl-2 leading-none">
				<p
					className={joinClasses(
						metric.format === "tbu" ? "text-[0.92rem]" : "text-lg",
						"font-medium tracking-[-0.02em]",
					)}
					style={{ color: "#34B34D" }}
				>
					{formattedValue}
				</p>
				{renderedUnit ? (
					<p className="pb-px text-[9px] font-normal leading-none tracking-[-0.01em] text-slate-500">{renderedUnit}</p>
				) : null}
			</div>
		</div>
	);
}


function formatMetricNumber(value: number | "TBU", format: EnvironmentalImpactMetric["format"]) {
	if (format === "tbu") {
		return "TBU";
	}

	const formatter = new Intl.NumberFormat("en-US", {
		maximumFractionDigits: format === "percent" ? 0 : 2,
	});

	return formatter.format(value);
}


function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
