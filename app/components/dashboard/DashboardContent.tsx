"use client";

import { useEffect, useState } from "react";

import KpiCard from "@/app/components/cards/KpiCard";
import WidgetShell from "@/app/components/cards/WidgetShell";
import CollectionSourceMap from "@/app/components/customer-dashboard/CollectionSourceMap";
import CircularContributionWidget from "@/app/components/customer-dashboard/CircularContributionWidget";
import EnvironmentalImpactWidget from "@/app/components/customer-dashboard/EnvironmentalImpactWidget";
import MonthlyReceptionQuantitiesChart from "@/app/components/customer-dashboard/MonthlyReceptionQuantitiesChart";
import QuantityByClassDonutChart from "@/app/components/customer-dashboard/QuantityByClassDonutChart";
import SecondaryLoopSankey from "@/app/components/customer-dashboard/SecondaryLoopSankey";
import WasteStreamTrendChart from "@/app/components/customer-dashboard/WasteStreamTrendChart";
import useCustomerDashboard from "@/app/hooks/useCustomerDashboard";
import useAuth, { type AuthRole } from "@/app/hooks/useAuth";
import { apiFetch } from "@/app/utils/api";


const dashboardEndpointByRole: Record<AuthRole, string> = {
	admin: "/dashboard/admin",
	employee: "/dashboard/employee",
	customer: "/dashboard/customer",
};

type DashboardStat = Readonly<{
	label: string;
	value: string;
}>;

type DashboardCard = Readonly<{
	type: "kpi" | "widget";
	title: string;
	value?: string;
	description?: string;
	stats?: ReadonlyArray<DashboardStat>;
}>;

type DashboardSection = Readonly<{
	cards: ReadonlyArray<DashboardCard>;
}>;

type DashboardResponse = Readonly<{
	role: AuthRole;
	title: string;
	sections: ReadonlyArray<DashboardSection>;
}>;

type DashboardContentProps = Readonly<{
	role: AuthRole;
	titleOverride?: string;
}>;

export default function DashboardContent({ role, titleOverride }: DashboardContentProps) {
	const { session, isReady } = useAuth();
	const customerDashboard = useCustomerDashboard();
	const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const displayTitle = titleOverride ?? dashboard?.title;

	useEffect(() => {
		if (!isReady) {
			return;
		}

		if (!session) {
			setDashboard(null);
			setIsLoading(false);
			return;
		}

		let isMounted = true;

		async function loadDashboard() {
			setErrorMessage("");
			setIsLoading(true);

			try {
				const response = await apiFetch(dashboardEndpointByRole[role], {
					cache: "no-store",
				});
				const payload = (await response.json()) as DashboardResponse | { detail?: string };

				if (!response.ok || !("sections" in payload) || !isMounted) {
					throw new Error("detail" in payload ? payload.detail ?? "Unable to load dashboard data." : "Unable to load dashboard data.");
				}

				setDashboard(payload);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setDashboard(null);
				setErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard data.");
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		void loadDashboard();

		return () => {
			isMounted = false;
		};
	}, [isReady, role, session]);

	return (
		<section className={[
			"min-h-[calc(100vh-54px)] px-4 py-6 sm:px-6 lg:px-8",
			role === "customer" ? "" : "bg-white",
		].join(" ")}>
			<div className="mx-auto flex w-full max-w-400 flex-col gap-4">
				{role !== "customer" && displayTitle ? (
					<div className="flex flex-col gap-1">
						<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">{displayTitle}</h1>
					</div>
				) : null}

				{role === "customer" ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
						<KpiCard
							className="md:col-span-1 xl:col-span-4"
							title="Total Quantity Processed"
							value={getCustomerProcessedQuantityValue(customerDashboard.loading, customerDashboard.error, customerDashboard.data?.total_quantity_processed)}
							unit={getCustomerProcessedQuantityUnit(customerDashboard.loading, customerDashboard.error, customerDashboard.data?.total_quantity_processed)}
							inlineUnit
							unitClassName="text-slate-500"
							description={"Cumulative processed quantity\nacross all waste streams"}
							variant="centered-kpi"
						/>
						<WidgetShell size="sm" title="Quantity By Class" className="md:col-span-1 xl:col-span-4">
							<QuantityByClassDonutChart
								hazardousQuantity={customerDashboard.data?.quantity_by_class.hazardous}
								nonHazardousQuantity={customerDashboard.data?.quantity_by_class.non_hazardous}
								loading={customerDashboard.loading}
								error={customerDashboard.error}
							/>
						</WidgetShell>
						<WidgetShell size="md" title="Waste Stream Trend" className="md:col-span-2 xl:col-span-4 overflow-visible" contentClassName="overflow-visible">
							<WasteStreamTrendChart
								wasteStreams={customerDashboard.data?.waste_stream_trend.waste_streams}
								points={customerDashboard.data?.waste_stream_trend.points}
								loading={customerDashboard.loading}
								error={customerDashboard.error}
							/>
						</WidgetShell>
					</div>
				) : null}

				{role === "customer" ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
						<WidgetShell size="md" title="Monthly Reception Quantities" className="md:col-span-1 xl:col-span-6 overflow-visible" contentClassName="overflow-visible">
							<MonthlyReceptionQuantitiesChart
								months={customerDashboard.data?.monthly_reception_quantities.months}
								values={customerDashboard.data?.monthly_reception_quantities.values}
								loading={customerDashboard.loading}
								error={customerDashboard.error}
							/>
						</WidgetShell>
						<WidgetShell size="md" title="Collection Source Map" className="md:col-span-1 xl:col-span-6">
							<CollectionSourceMap
								locations={customerDashboard.data?.collection_source_locations}
								loading={customerDashboard.loading}
								error={customerDashboard.error}
							/>
						</WidgetShell>
					</div>
				) : null}

				{role === "customer" ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
						<WidgetShell size="md" title="Secondary Loop Flow" className="md:col-span-2 xl:col-span-6">
							<SecondaryLoopSankey
								flows={customerDashboard.data?.secondary_loop_flow}
								loading={customerDashboard.loading}
								error={customerDashboard.error}
							/>
						</WidgetShell>
						<WidgetShell size="sm" title="Contribution to Circular Economy" className="md:col-span-1 xl:col-span-3">
							<CircularContributionWidget />
						</WidgetShell>
						<WidgetShell size="sm" title="Environmental Impact" className="md:col-span-1 xl:col-span-3">
							<EnvironmentalImpactWidget />
						</WidgetShell>
					</div>
				) : null}

				{isLoading ? (
					<p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading dashboard...</p>
				) : null}

				{errorMessage ? (
					<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
				) : null}

				{!isLoading && !errorMessage && dashboard && role !== "customer" ? dashboard.sections.map((section, sectionIndex) => (
					<div key={`${dashboard.role}-${sectionIndex}`} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
						{section.cards.map((card, cardIndex) => card.type === "kpi" ? (
							<KpiCard
								key={`${dashboard.role}-${sectionIndex}-${cardIndex}-${card.title}`}
								className="md:col-span-1 xl:col-span-4"
								title={card.title}
								value={card.value ?? "0"}
								description={card.description ?? ""}
							/>
						) : (
							<WidgetShell
								key={`${dashboard.role}-${sectionIndex}-${cardIndex}-${card.title}`}
								className="md:col-span-1 xl:col-span-4"
								title={card.title}
								description={card.description ?? ""}
							>
								<div className="mt-auto grid grid-cols-2 gap-3">
									{(card.stats ?? []).map((item) => (
										<div key={`${card.title}-${item.label}`} className="rounded-2xl bg-slate-50 p-3">
											<p className="text-xs font-medium text-slate-500">{item.label}</p>
											<p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
										</div>
									))}
								</div>
							</WidgetShell>
						))}
					</div>
				)) : null}
			</div>
		</section>
	);
}


function getCustomerProcessedQuantityValue(loading: boolean, error: string, value: number | undefined) {
	if (loading) {
		return "...";
	}

	if (error || typeof value !== "number") {
		return "--";
	}

	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
	}).format(value);
}


function getCustomerProcessedQuantityUnit(loading: boolean, error: string, value: number | undefined) {
	if (loading || error || typeof value !== "number") {
		return "";
	}

	return "Kgs";
}