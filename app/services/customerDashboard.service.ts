"use client";

import { apiFetch } from "@/app/utils/api";


export type CustomerDashboardData = Readonly<{
	total_quantity_processed: number;
	quantity_by_class: Readonly<{
		hazardous: number;
		non_hazardous: number;
	}>;
	waste_stream_trend: Readonly<{
		waste_streams: ReadonlyArray<string>;
		points: ReadonlyArray<Readonly<{
			month: string;
			quantities_by_stream: Readonly<Record<string, number>>;
		}>>;
	}>;
	monthly_reception_quantities: Readonly<{
		months: ReadonlyArray<string>;
		values: ReadonlyArray<number>;
	}>;
	collection_source_locations: ReadonlyArray<Readonly<{
		emirate_name: string;
		area_name: string;
		location_name: string;
		quantity: number;
		latitude: number;
		longitude: number;
	}>>;
	secondary_loop_flow: ReadonlyArray<Readonly<{
		waste_stream_name: string;
		secondary_product: string;
		secondary_loop: string;
		quantity: number;
	}>>;
	circular_contribution: Readonly<{
		total?: number;
		materials: number;
		energy: number;
	}>;
	environmental_impact: Readonly<{
		landfill_diversion_percent: number;
		co2_reduced: number;
		ghg_emissions_reduced: number;
		trees_planted: number;
		homes_powered: number;
	}>;
}>;

type CustomerDashboardResponse = CustomerDashboardData | Readonly<{
	detail?: string;
}>;


export async function getCustomerDashboard(): Promise<CustomerDashboardData> {
	const response = await apiFetch("/customer/dashboard", {
		cache: "no-store",
	});
	const payload = (await response.json()) as CustomerDashboardResponse;

	if (!response.ok || !isCustomerDashboardData(payload)) {
		throw new Error("detail" in payload ? payload.detail ?? "Unable to load customer dashboard data." : "Unable to load customer dashboard data.");
	}

	return payload;
}


export async function downloadCustomerReportsCsv(): Promise<void> {
	const response = await apiFetch("/customer/reports/export/csv", {
		cache: "no-store",
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
		throw new Error(payload?.detail ?? "Unable to download the customer report right now.");
	}

	const csvBlob = await response.blob();
	const downloadUrl = window.URL.createObjectURL(csvBlob);
	const link = document.createElement("a");
	const filename = extractDownloadFilename(response.headers.get("Content-Disposition"), "customer-reports.csv");

	link.href = downloadUrl;
	link.download = filename;
	link.style.display = "none";
	document.body.append(link);
	link.click();
	link.remove();

	window.setTimeout(() => {
		window.URL.revokeObjectURL(downloadUrl);
	}, 1000);
}


function isCustomerDashboardData(payload: CustomerDashboardResponse): payload is CustomerDashboardData {
	return typeof payload === "object"
		&& payload !== null
		&& "total_quantity_processed" in payload
		&& typeof payload.total_quantity_processed === "number"
		&& "quantity_by_class" in payload
		&& typeof payload.quantity_by_class === "object"
		&& payload.quantity_by_class !== null
		&& "hazardous" in payload.quantity_by_class
		&& "non_hazardous" in payload.quantity_by_class
		&& typeof payload.quantity_by_class.hazardous === "number"
		&& typeof payload.quantity_by_class.non_hazardous === "number"
		&& "waste_stream_trend" in payload
		&& typeof payload.waste_stream_trend === "object"
		&& payload.waste_stream_trend !== null
		&& "waste_streams" in payload.waste_stream_trend
		&& Array.isArray(payload.waste_stream_trend.waste_streams)
		&& "points" in payload.waste_stream_trend
		&& Array.isArray(payload.waste_stream_trend.points)
		&& payload.waste_stream_trend.waste_streams.every((streamName) => typeof streamName === "string")
		&& payload.waste_stream_trend.points.every((point) => isTrendPoint(point))
		&& "monthly_reception_quantities" in payload
		&& typeof payload.monthly_reception_quantities === "object"
		&& payload.monthly_reception_quantities !== null
		&& "months" in payload.monthly_reception_quantities
		&& Array.isArray(payload.monthly_reception_quantities.months)
		&& payload.monthly_reception_quantities.months.every((month) => typeof month === "string")
		&& "values" in payload.monthly_reception_quantities
		&& Array.isArray(payload.monthly_reception_quantities.values)
		&& payload.monthly_reception_quantities.values.every((value) => typeof value === "number")
		&& "collection_source_locations" in payload
		&& Array.isArray(payload.collection_source_locations)
		&& payload.collection_source_locations.every((location) => isCollectionSourceLocation(location))
		&& "secondary_loop_flow" in payload
		&& Array.isArray(payload.secondary_loop_flow)
		&& payload.secondary_loop_flow.every((item) => isSecondaryLoopFlowItem(item))
		&& "circular_contribution" in payload
		&& isCircularContribution(payload.circular_contribution)
		&& "environmental_impact" in payload
		&& isEnvironmentalImpact(payload.environmental_impact);
}


function isTrendPoint(point: unknown): point is CustomerDashboardData["waste_stream_trend"]["points"][number] {
	return typeof point === "object"
		&& point !== null
		&& "month" in point
		&& typeof point.month === "string"
		&& "quantities_by_stream" in point
		&& typeof point.quantities_by_stream === "object"
		&& point.quantities_by_stream !== null
		&& Object.values(point.quantities_by_stream).every((value) => typeof value === "number");
}


function isCollectionSourceLocation(location: unknown): location is CustomerDashboardData["collection_source_locations"][number] {
	return typeof location === "object"
		&& location !== null
		&& "emirate_name" in location
		&& typeof location.emirate_name === "string"
		&& "area_name" in location
		&& typeof location.area_name === "string"
		&& "location_name" in location
		&& typeof location.location_name === "string"
		&& "quantity" in location
		&& typeof location.quantity === "number"
		&& "latitude" in location
		&& typeof location.latitude === "number"
		&& "longitude" in location
		&& typeof location.longitude === "number";
}


function isSecondaryLoopFlowItem(item: unknown): item is CustomerDashboardData["secondary_loop_flow"][number] {
	return typeof item === "object"
		&& item !== null
		&& "waste_stream_name" in item
		&& typeof item.waste_stream_name === "string"
		&& "secondary_product" in item
		&& typeof item.secondary_product === "string"
		&& "secondary_loop" in item
		&& typeof item.secondary_loop === "string"
		&& "quantity" in item
		&& typeof item.quantity === "number";
}


function isCircularContribution(value: unknown): value is CustomerDashboardData["circular_contribution"] {
	return typeof value === "object"
		&& value !== null
		&& (!("total" in value) || typeof value.total === "number")
		&& "materials" in value
		&& typeof value.materials === "number"
		&& "energy" in value
		&& typeof value.energy === "number";
}


function isEnvironmentalImpact(value: unknown): value is CustomerDashboardData["environmental_impact"] {
	return typeof value === "object"
		&& value !== null
		&& "landfill_diversion_percent" in value
		&& typeof value.landfill_diversion_percent === "number"
		&& "co2_reduced" in value
		&& typeof value.co2_reduced === "number"
		&& "ghg_emissions_reduced" in value
		&& typeof value.ghg_emissions_reduced === "number"
		&& "trees_planted" in value
		&& typeof value.trees_planted === "number"
		&& "homes_powered" in value
		&& typeof value.homes_powered === "number";
}


function extractDownloadFilename(contentDisposition: string | null, fallbackFilename: string) {
	if (!contentDisposition) {
		return fallbackFilename;
	}

	const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
	if (utf8Match && utf8Match[1]) {
		return decodeURIComponent(utf8Match[1]);
	}

	const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
	if (filenameMatch && filenameMatch[1]) {
		return filenameMatch[1];
	}

	return fallbackFilename;
}
