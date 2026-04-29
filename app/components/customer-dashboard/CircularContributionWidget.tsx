"use client";

import useCustomerDashboard from "@/app/hooks/useCustomerDashboard";


export default function CircularContributionWidget({ className }: Readonly<{ className?: string }>) {
	const customerDashboard = useCustomerDashboard();
	const contribution = customerDashboard.data?.circular_contribution;

	if (customerDashboard.loading) {
		return <ContributionMessage className={className} tone="neutral" message="Loading contribution data..." />;
	}

	if (customerDashboard.error) {
		return <ContributionMessage className={className} tone="error" message={customerDashboard.error} />;
	}

	if (!contribution) {
		return <ContributionMessage className={className} tone="neutral" message="No circular contribution available yet." />;
	}

	const materials = sanitizeValue(contribution.materials);
	const energy = sanitizeValue(contribution.energy);
	const totalContribution = sanitizeValue(contribution.total ?? (materials + energy));
	const materialsPercentage = totalContribution > 0 ? (materials / totalContribution) * 100 : 0;
	const energyPercentage = totalContribution > 0 ? (energy / totalContribution) * 100 : 0;

	if (totalContribution <= 0) {
		return <ContributionMessage className={className} tone="neutral" message="No circular contribution available yet." />;
	}

	return (
		<div className={joinClasses("flex h-full min-h-0 flex-col", className)}>
			<div className="flex min-h-0 flex-1 flex-col gap-5">
				<div className="flex flex-col items-center text-center">
					<div className="flex items-end gap-1.5 leading-none" style={{ color: "#34B34D" }}>
						<p className="text-[1.55rem] font-normal tracking-[-0.04em]">{formatValue(totalContribution)}</p>
						<p className="pb-0.5 text-sm font-normal tracking-[-0.01em] text-slate-500">Kgs</p>
					</div>
					<p className="mt-1 text-[13px] font-medium tracking-[-0.01em] text-slate-500">Total Contribution</p>
				</div>

				<div className="flex flex-col gap-2.5">
					<div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
						<div className="flex h-full w-full rounded-full overflow-hidden">
							<div
								className="h-full origin-left transition-[width] duration-700 ease-out"
								style={{ width: `${materialsPercentage}%`, backgroundColor: "#2D923E" }}
							/>
							<div
								className="h-full origin-left transition-[width] duration-700 ease-out"
								style={{ width: `${energyPercentage}%`, backgroundColor: "#3CD05A" }}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<ValueBlock label="Materials" value={materials} dotColor="#2D923E" valueColor="#2D923E" />
						<ValueBlock label="Energy" value={energy} dotColor="#3CD05A" valueColor="#3CD05A" />
					</div>
				</div>
			</div>
		</div>
	);
}


function ValueBlock({
	label,
	value,
	dotColor,
	valueColor,
}: Readonly<{
	label: string;
	value: number;
	dotColor: string;
	valueColor: string;
}>) {
	return (
		<div className="flex min-w-0 flex-col items-start text-left">
			<div className="flex items-center gap-2">
				<span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
				<p className="text-[11px] font-medium tracking-[-0.01em] text-slate-500">{label}</p>
			</div>
			<div className="mt-1.5 flex items-end gap-1 leading-none" style={{ color: valueColor }}>
				<p className="text-[1.15rem] font-normal tracking-[-0.03em]">{formatValue(value)}</p>
				<p className="pb-0.5 text-xs font-normal tracking-[-0.01em] text-slate-500">Kgs</p>
			</div>
		</div>
	);
}


function ContributionMessage({ className, tone, message }: Readonly<{ className?: string; tone: "neutral" | "error"; message: string }>) {
	return (
		<div className={joinClasses("flex h-full items-center justify-center px-4 text-center text-sm", tone === "error" ? "text-rose-700" : "text-slate-600", className)}>
			<p>{message}</p>
		</div>
	);
}


function sanitizeValue(value: number | undefined) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}


function formatValue(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
	}).format(value);
}


function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}

