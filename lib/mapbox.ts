export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

export const MAPBOX_DEFAULT_VIEW_STATE = {
	longitude: 54.72,
	latitude: 24.77,
	zoom: 6,
	bearing: 0,
	pitch: 0,
} as const;

export const UAE_VIEW_BOUNDS: [[number, number], [number, number]] = [
	[51.95, 22.85],
	[56.75, 26.3],
];

export const UAE_MAX_BOUNDS: [[number, number], [number, number]] = [
	[51.5, 22.4],
	[57.15, 26.7],
];

export function warnIfMapboxTokenMissing() {
	if (MAPBOX_ACCESS_TOKEN) {
		return;
	}

	console.warn("NEXT_PUBLIC_MAPBOX_TOKEN is not configured. Mapbox maps will show a fallback message.");
}
