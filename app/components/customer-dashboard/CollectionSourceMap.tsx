"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type { FeatureCollection, Point } from "geojson";
import { Minus, Plus } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import Map, { Marker, Popup, Source, Layer, type MapRef, type ViewStateChangeEvent } from "react-map-gl/mapbox";

import { GREENSHARE_PALETTE } from "@/app/components/customer-dashboard/greensharePalette";
import {
	MAPBOX_ACCESS_TOKEN,
	MAPBOX_DEFAULT_VIEW_STATE,
	MAPBOX_STYLE,
	UAE_MAX_BOUNDS,
	UAE_VIEW_BOUNDS,
	warnIfMapboxTokenMissing,
} from "@/lib/mapbox";


type CollectionSourceLocation = Readonly<{
	emirate_name?: string;
	area_name?: string;
	location_name: string;
	quantity: number;
	latitude: number;
	longitude: number;
}>;

type CollectionSourceMapProps = Readonly<{
	locations?: ReadonlyArray<CollectionSourceLocation>;
	loading?: boolean;
	error?: string;
	className?: string;
}>;

type ResolvedLocation = Readonly<{
	id: string;
	emirate_name: string;
	area_name: string;
	location_name: string;
	quantity: number;
	latitude: number;
	longitude: number;
	radius: number;
}>;

type EmirateMarker = Readonly<{
	name: string;
	latitude: number;
	longitude: number;
}>;

type TooltipState =
	| Readonly<{
		type: "location";
		id: string;
		latitude: number;
		longitude: number;
		area_name: string;
		emirate_name: string;
		quantity: number;
	}>
	| Readonly<{
		type: "emirate";
		id: string;
		latitude: number;
		longitude: number;
		emirate_name: string;
	}>;

const MIN_ZOOM = 5.3;
const MAX_ZOOM = 8.8;
const LOCATION_COLLISION_THRESHOLD = 0.08;
const LOCATION_COLLISION_OFFSET = 0.032;

const EMIRATE_MARKERS: ReadonlyArray<EmirateMarker> = [
	{ name: "Abu Dhabi", latitude: 24.4539, longitude: 54.3773 },
	{ name: "Dubai", latitude: 25.2048, longitude: 55.2708 },
	{ name: "Sharjah", latitude: 25.3463, longitude: 55.4209 },
	{ name: "Ajman", latitude: 25.4052, longitude: 55.5136 },
	{ name: "Umm Al Quwain", latitude: 25.5647, longitude: 55.5552 },
	{ name: "Ras Al Khaimah", latitude: 25.8007, longitude: 55.9762 },
	{ name: "Fujairah", latitude: 25.1288, longitude: 56.3265 },
] as const;

const LOCATION_FALLBACKS = [
	{ emirate_name: "Dubai", area_name: "Jafza", key: "jafza", latitude: 24.9857, longitude: 55.0658 },
	{ emirate_name: "Dubai", area_name: "Jafza", key: "jebel ali free zone", latitude: 24.9857, longitude: 55.0658 },
	{ emirate_name: "Dubai", area_name: "Jafza", key: "jebel ali", latitude: 24.9857, longitude: 55.0658 },
	{ emirate_name: "Dubai", area_name: "Dubai Industrial City", key: "dubai industrial city", latitude: 24.9667, longitude: 55.386 },
	{ emirate_name: "Dubai", area_name: "Dubai Investment Park", key: "dubai investment park", latitude: 24.9853, longitude: 55.159 },
	{ emirate_name: "Dubai", area_name: "Dubai Investment Park", key: "dip", latitude: 24.9853, longitude: 55.159 },
	{ emirate_name: "Dubai", area_name: "Al Quoz", key: "al quoz", latitude: 25.1362, longitude: 55.227 },
	{ emirate_name: "Dubai", area_name: "Dubai", key: "dubai", latitude: 25.2048, longitude: 55.2708 },
	{ emirate_name: "Abu Dhabi", area_name: "Mussafah", key: "mussafah", latitude: 24.35, longitude: 54.52 },
	{ emirate_name: "Abu Dhabi", area_name: "Khalifa Industrial", key: "kizad", latitude: 24.8222, longitude: 54.6622 },
	{ emirate_name: "Abu Dhabi", area_name: "Khalifa Industrial", key: "khalifa industrial zone", latitude: 24.8222, longitude: 54.6622 },
	{ emirate_name: "Abu Dhabi", area_name: "Khalifa Industrial", key: "khalifa industrial", latitude: 24.8222, longitude: 54.6622 },
	{ emirate_name: "Abu Dhabi", area_name: "Abu Dhabi", key: "abu dhabi", latitude: 24.4539, longitude: 54.3773 },
	{ emirate_name: "Sharjah", area_name: "Sharjah Industrial Area", key: "sharjah industrial area", latitude: 25.325, longitude: 55.43 },
	{ emirate_name: "Sharjah", area_name: "Hamriyah", key: "hamriyah", latitude: 25.4875, longitude: 55.5303 },
	{ emirate_name: "Sharjah", area_name: "Sharjah", key: "sharjah", latitude: 25.3463, longitude: 55.4209 },
	{ emirate_name: "Ajman", area_name: "Ajman", key: "ajman", latitude: 25.4052, longitude: 55.5136 },
	{ emirate_name: "Umm Al Quwain", area_name: "Umm Al Quwain", key: "umm al quwain", latitude: 25.5647, longitude: 55.5552 },
	{ emirate_name: "Umm Al Quwain", area_name: "Umm Al Quwain", key: "uaq", latitude: 25.5647, longitude: 55.5552 },
	{ emirate_name: "Ras Al Khaimah", area_name: "Ras Al Khaimah", key: "ras al khaimah", latitude: 25.8007, longitude: 55.9762 },
	{ emirate_name: "Ras Al Khaimah", area_name: "Ras Al Khaimah", key: "rak", latitude: 25.8007, longitude: 55.9762 },
	{ emirate_name: "Fujairah", area_name: "Dibba", key: "dibba", latitude: 25.6196, longitude: 56.2729 },
	{ emirate_name: "Fujairah", area_name: "Fujairah", key: "fujairah", latitude: 25.1288, longitude: 56.3265 },
] as const;


export default function CollectionSourceMap({
	locations = [],
	loading = false,
	error = "",
	className,
}: CollectionSourceMapProps) {
	const mapRef = useRef<MapRef | null>(null);
	const [zoom, setZoom] = useState<number>(MAPBOX_DEFAULT_VIEW_STATE.zoom);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);
	const [isMapReady, setIsMapReady] = useState(false);
	const [mapError, setMapError] = useState("");
	const normalizedLocations = useMemo(
		() => locations.map(resolveLocation).filter((location): location is ResolvedLocation => location !== null),
		[locations],
	);
	const maxQuantity = Math.max(...normalizedLocations.map((location) => location.quantity), 0) || 1;
	const collectionMarkers = useMemo(
		() => buildCollectionMarkers(normalizedLocations, maxQuantity),
		[normalizedLocations, maxQuantity],
	);
	const emiratesWithData = useMemo(
		() => new Set(normalizedLocations.map((location) => location.emirate_name)),
		[normalizedLocations],
	);
	const activeEmirate = tooltip?.emirate_name ?? null;
	const emirateGeoJson = useMemo<FeatureCollection<Point>>(() => ({
		type: "FeatureCollection",
		features: EMIRATE_MARKERS.map((marker) => ({
			type: "Feature",
			properties: {
				name: marker.name,
				hasData: emiratesWithData.has(marker.name),
				isActive: activeEmirate === marker.name,
			},
			geometry: {
				type: "Point",
				coordinates: [marker.longitude, marker.latitude],
			},
		})),
	}), [activeEmirate, emiratesWithData]);

	useEffect(() => {
		warnIfMapboxTokenMissing();
	}, []);

	useEffect(() => {
		const map = mapRef.current?.getMap();
		if (!map || !isMapReady) {
			return;
		}

		fitMapToMarkersOrUae(map, collectionMarkers);
	}, [collectionMarkers, isMapReady]);

	if (loading) {
		return <MapLoadingState className={className} message="Loading collection source locations..." />;
	}

	if (!MAPBOX_ACCESS_TOKEN) {
		return <MapMessage className={className} tone="neutral" message="Collection source map is not configured yet." />;
	}

	if (error) {
		return <MapMessage className={className} tone="error" message={error} />;
	}

	if (mapError) {
		return <MapMessage className={className} tone="error" message={mapError} />;
	}

	if (collectionMarkers.length === 0) {
		return <MapMessage className={className} tone="neutral" message="No collection source locations available yet." />;
	}

	return (
		<div className={joinClasses("flex h-full min-h-0 flex-col", className)}>
			<div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-[#d8eadc]">
				{!isMapReady ? <MapLoadingOverlay message="Initializing map..." /> : null}
				<Map
					ref={mapRef}
					id="customer-collection-source-map"
					mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
					initialViewState={MAPBOX_DEFAULT_VIEW_STATE}
					maxBounds={UAE_MAX_BOUNDS}
					minZoom={MIN_ZOOM}
					maxZoom={MAX_ZOOM}
					reuseMaps
					dragRotate={false}
					pitchWithRotate={false}
					touchPitch={false}
					boxZoom={false}
					doubleClickZoom={false}
					style={{ width: "100%", height: "100%" }}
					mapStyle={MAPBOX_STYLE}
					onLoad={(event) => {
						const map = event.target;
						minimizeMapboxStyle(map);
						fitMapToMarkersOrUae(map, collectionMarkers);
						setIsMapReady(true);
					}}
					onError={() => {
						setMapError("Collection source map could not be loaded. Please try again later.");
					}}
					onMove={(event: ViewStateChangeEvent) => {
						setZoom(event.viewState.zoom);
					}}
				>
					<Source id="emirate-points" type="geojson" data={emirateGeoJson}>
						<Layer
							id="emirate-markers"
							type="circle"
							paint={{
								"circle-radius": [
									"case",
									["boolean", ["get", "isActive"], false],
									10,
									["boolean", ["get", "hasData"], false],
									8,
									6,
								],
								"circle-color": [
									"case",
									["boolean", ["get", "isActive"], false],
									GREENSHARE_PALETTE.tertiary,
									["boolean", ["get", "hasData"], false],
									GREENSHARE_PALETTE.highlight,
									"#d9e7db",
								],
								"circle-stroke-width": 2,
								"circle-stroke-color": "#ffffff",
								"circle-opacity": 0.95,
							}}
						/>
					</Source>

					{collectionMarkers.map((marker) => {
						const isActive = activeId === marker.id;

						return (
							<Marker key={marker.id} longitude={marker.longitude} latitude={marker.latitude} anchor="center">
								<button
									type="button"
									className="rounded-full border-2 transition duration-150 ease-out focus:outline-none"
									style={{
										width: `${marker.radius * 2}px`,
										height: `${marker.radius * 2}px`,
										backgroundColor: isActive ? GREENSHARE_PALETTE.highlight : "rgba(61, 208, 90, 0.72)",
										borderColor: isActive ? GREENSHARE_PALETTE.primary : GREENSHARE_PALETTE.tertiary,
										boxShadow: isActive
											? "0 0 0 6px rgba(52, 179, 77, 0.18)"
											: "0 0 0 4px rgba(52, 179, 77, 0.10)",
										transform: `scale(${isActive ? 1.08 : 1})`,
									}}
									onMouseEnter={() => {
										setActiveId(marker.id);
										setTooltip({
											type: "location",
											id: marker.id,
											latitude: marker.latitude,
											longitude: marker.longitude,
											area_name: marker.area_name,
											emirate_name: marker.emirate_name,
											quantity: marker.quantity,
										});
									}}
									onMouseLeave={() => {
										setActiveId(null);
										setTooltip(null);
									}}
									onFocus={() => {
										setActiveId(marker.id);
										setTooltip({
											type: "location",
											id: marker.id,
											latitude: marker.latitude,
											longitude: marker.longitude,
											area_name: marker.area_name,
											emirate_name: marker.emirate_name,
											quantity: marker.quantity,
										});
									}}
									onBlur={() => {
										setActiveId(null);
										setTooltip(null);
									}}
									aria-label={`${marker.area_name}, ${marker.emirate_name}: ${formatValue(marker.quantity)} Kgs`}
								>
									<span className="sr-only">{marker.area_name}</span>
								</button>
							</Marker>
						);
					})}

					{tooltip ? (
						<Popup
							longitude={tooltip.longitude}
							latitude={tooltip.latitude}
							anchor="bottom"
							closeButton={false}
							closeOnClick={false}
							offset={[0, -10]}
							className="greenshare-map-tooltip"
						>
							{tooltip.type === "location" ? (
								<div className="flex items-center gap-1 whitespace-nowrap text-[10px] text-slate-700">
									<p className="font-semibold text-slate-800">{tooltip.emirate_name}</p>
									<span className="text-slate-400">.</span>
									<p>{tooltip.area_name}</p>
									<span className="text-slate-400">.</span>
									<p className="font-medium" style={{ color: GREENSHARE_PALETTE.secondary }}>
										{formatValue(tooltip.quantity)} Kgs
									</p>
								</div>
							) : (
								<div className="whitespace-nowrap text-[11px] font-semibold text-slate-800">{tooltip.emirate_name}</div>
							)}
						</Popup>
					) : null}
				</Map>

				<div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-white/60 bg-white/88 px-1 py-1 shadow-sm backdrop-blur-sm">
					<button
						type="button"
						className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={() => mapRef.current?.zoomIn({ duration: 250 })}
						disabled={zoom >= MAX_ZOOM - 0.02}
						aria-label="Zoom in on collection source map"
					>
						<Plus className="h-3 w-3" />
					</button>
					<div className="relative h-14 w-0.75 overflow-hidden rounded-full bg-slate-200">
						<div
							className="absolute bottom-0 left-0 right-0 rounded-full"
							style={{
								height: `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%`,
								background: `linear-gradient(180deg, ${GREENSHARE_PALETTE.highlight}, ${GREENSHARE_PALETTE.secondary})`,
							}}
						/>
					</div>
					<button
						type="button"
						className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={() => mapRef.current?.zoomOut({ duration: 250 })}
						disabled={zoom <= MIN_ZOOM + 0.02}
						aria-label="Zoom out on collection source map"
					>
						<Minus className="h-3 w-3" />
					</button>
				</div>
			</div>

			<style jsx>{`
				:global(.mapboxgl-map) {
					background: #edf4ee;
				}

				:global(.mapboxgl-ctrl-top-right),
				:global(.mapboxgl-ctrl-top-left),
				:global(.mapboxgl-ctrl-bottom-right),
				:global(.mapboxgl-ctrl-bottom-left) {
					display: none;
				}

				:global(.greenshare-map-tooltip .mapboxgl-popup-content) {
					max-width: none;
					padding: 6px 8px;
					border-radius: 16px;
					border: 1px solid #e2e8f0;
					box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
				}

				:global(.greenshare-map-tooltip .mapboxgl-popup-tip) {
					display: none;
				}
			`}</style>
		</div>
	);
}


function MapMessage({ className, tone, message }: Readonly<{ className?: string; tone: "neutral" | "error"; message: string }>) {
	return (
		<div className={joinClasses("flex h-full items-center justify-center px-4 text-center text-sm", tone === "error" ? "text-rose-700" : "text-slate-600", className)}>
			<p>{message}</p>
		</div>
	);
}


function MapLoadingState({ className, message }: Readonly<{ className?: string; message: string }>) {
	return (
		<div className={joinClasses("flex h-full items-center justify-center", className)}>
			<MapSpinner message={message} />
		</div>
	);
}


function MapLoadingOverlay({ message }: Readonly<{ message: string }>) {
	return (
		<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
			<MapSpinner message={message} />
		</div>
	);
}


function MapSpinner({ message }: Readonly<{ message: string }>) {
	return (
		<div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
			<span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-[#34b34d]" aria-hidden="true" />
			<span>{message}</span>
		</div>
	);
}


function resolveLocation(location: CollectionSourceLocation): ResolvedLocation | null {
	const quantity = sanitizeQuantity(location.quantity);
	if (quantity <= 0) {
		return null;
	}

	const emirateName = normalizeEmirateName(location.emirate_name ?? "");
	const areaName = normalizeAreaName(location.area_name ?? location.location_name);
	if (isValidUaeCoordinate(location.latitude, location.longitude)) {
		return {
			id: `${emirateName || areaName}-${areaName}-${location.latitude}-${location.longitude}`,
			emirate_name: emirateName || inferEmirateName(location.location_name) || "Unspecified",
			area_name: areaName,
			location_name: location.location_name,
			quantity,
			latitude: location.latitude,
			longitude: location.longitude,
			radius: 0,
		};
	}

	const fallback = resolveFallbackLocation(location);
	if (!fallback) {
		return null;
	}

	return {
		id: `${fallback.emirate_name}-${fallback.area_name}-${fallback.latitude}-${fallback.longitude}`,
		emirate_name: fallback.emirate_name,
		area_name: fallback.area_name,
		location_name: location.location_name,
		quantity,
		latitude: fallback.latitude,
		longitude: fallback.longitude,
		radius: 0,
	};
}


function resolveFallbackLocation(location: CollectionSourceLocation) {
	const searchValue = [location.area_name, location.location_name, location.emirate_name].filter(Boolean).join(" ").toLowerCase();
	const matchedFallback = LOCATION_FALLBACKS.find((entry) => searchValue.includes(entry.key));

	if (matchedFallback) {
		return matchedFallback;
	}

	const inferredEmirate = inferEmirateName(searchValue);
	if (!inferredEmirate) {
		return null;
	}

	return LOCATION_FALLBACKS.find((entry) => entry.emirate_name === inferredEmirate && entry.area_name === inferredEmirate) ?? null;
}


function normalizeEmirateName(value: string) {
	const normalizedValue = value.trim().toLowerCase();
	if (!normalizedValue) {
		return "";
	}

	if (normalizedValue.includes("abu dhabi")) {
		return "Abu Dhabi";
	}
	if (normalizedValue.includes("dubai")) {
		return "Dubai";
	}
	if (normalizedValue.includes("sharjah")) {
		return "Sharjah";
	}
	if (normalizedValue.includes("ajman")) {
		return "Ajman";
	}
	if (normalizedValue.includes("umm al quwain") || normalizedValue.includes("uaq")) {
		return "Umm Al Quwain";
	}
	if (normalizedValue.includes("ras al khaimah") || normalizedValue.includes("rak")) {
		return "Ras Al Khaimah";
	}
	if (normalizedValue.includes("fujairah")) {
		return "Fujairah";
	}

	return value.trim();
}


function inferEmirateName(value: string) {
	return normalizeEmirateName(value).trim() || "";
}


function normalizeAreaName(value: string) {
	const normalizedValue = value.trim();
	return normalizedValue || "Unspecified Area";
}


function buildCollectionMarkers(locations: ReadonlyArray<ResolvedLocation>, maxQuantity: number) {
	const markers = locations.map((location) => ({
		...location,
		radius: 5 + (location.quantity / maxQuantity) * 7,
	}));

	return markers.map((marker, index) => {
		const collisions = markers.filter((candidate, candidateIndex) => {
			if (candidateIndex >= index) {
				return false;
			}

			return Math.hypot(candidate.longitude - marker.longitude, candidate.latitude - marker.latitude) < LOCATION_COLLISION_THRESHOLD;
		});

		if (collisions.length === 0) {
			return marker;
		}

		const angle = collisions.length * (Math.PI / 3);
		return {
			...marker,
			longitude: marker.longitude + Math.cos(angle) * LOCATION_COLLISION_OFFSET,
			latitude: marker.latitude + Math.sin(angle) * LOCATION_COLLISION_OFFSET,
		};
	});
}


function sanitizeQuantity(value: number) {
	return Number.isFinite(value) && value > 0 ? value : 0;
}


function isValidUaeCoordinate(latitude: number, longitude: number) {
	return Number.isFinite(latitude)
		&& Number.isFinite(longitude)
		&& latitude >= UAE_MAX_BOUNDS[0][1]
		&& latitude <= UAE_MAX_BOUNDS[1][1]
		&& longitude >= UAE_MAX_BOUNDS[0][0]
		&& longitude <= UAE_MAX_BOUNDS[1][0];
}


function formatValue(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 2,
	}).format(value);
}


function fitMapToMarkersOrUae(map: mapboxgl.Map, markers: ReadonlyArray<ResolvedLocation>) {
	if (markers.length === 0) {
		map.fitBounds(UAE_VIEW_BOUNDS, {
			padding: { top: 34, right: 22, bottom: 14, left: 22 },
			duration: 0,
			maxZoom: MAPBOX_DEFAULT_VIEW_STATE.zoom,
		});
		return;
	}

	const bounds = markers.reduce(
		(currentBounds, marker) => currentBounds.extend([marker.longitude, marker.latitude]),
		new mapboxgl.LngLatBounds([markers[0].longitude, markers[0].latitude], [markers[0].longitude, markers[0].latitude]),
	);

	map.fitBounds(bounds, {
		padding: { top: 42, right: 34, bottom: 34, left: 34 },
		duration: 0,
		maxZoom: 7.6,
	});
}


function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}


function minimizeMapboxStyle(map: mapboxgl.Map) {
	const hiddenLayers = [
		"road-label",
		"airport-label",
		"poi-label",
		"transit-label",
		"waterway-label",
		"settlement-subdivision-label",
		"settlement-minor-label",
		"natural-point-label",
	];

	for (const layerId of hiddenLayers) {
		if (map.getLayer(layerId)) {
			map.setLayoutProperty(layerId, "visibility", "none");
		}
	}

	if (map.getLayer("country-label")) {
		map.setPaintProperty("country-label", "text-opacity", 0.2);
	}

	if (map.getLayer("water")) {
		map.setPaintProperty("water", "fill-color", "#d9ece0");
	}

	if (map.getLayer("land")) {
		map.setPaintProperty("land", "background-color", "#eef6ef");
	}

	if (map.getLayer("road-primary")) {
		map.setPaintProperty("road-primary", "line-opacity", 0.18);
	}
	if (map.getLayer("road-secondary-tertiary")) {
		map.setPaintProperty("road-secondary-tertiary", "line-opacity", 0.1);
	}
	if (map.getLayer("road-street")) {
		map.setPaintProperty("road-street", "line-opacity", 0.06);
	}
}