"use client";

import { useEffect, useState } from "react";

import AddStreamCodeDrawer from "@/components/crm/stream-codes/AddStreamCodeDrawer";
import StreamCodeTable from "@/components/crm/stream-codes/StreamCodeTable";
import Button from "@/app/components/ui/Button";
import {
	createStreamCode,
	deleteStreamCode,
	getStreamCodes,
	updateStreamCode,
	type StreamCodePayload,
	type StreamCodeRecord,
} from "@/app/services/stream-codes.service";


type DrawerState =
	| { mode: "create"; record: null }
	| { mode: "edit"; record: StreamCodeRecord };


export default function AdminStreamCodesPage() {
	const [streamCodes, setStreamCodes] = useState<StreamCodeRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [pageError, setPageError] = useState<string | null>(null);
	const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
	const [removeTarget, setRemoveTarget] = useState<StreamCodeRecord | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);

	useEffect(() => {
		void loadStreamCodes();
	}, []);

	async function loadStreamCodes() {
		setIsLoading(true);
		setPageError(null);

		try {
			setStreamCodes(await getStreamCodes());
		} catch (error) {
			setPageError(resolveErrorMessage(error, "Unable to load Stream Codes right now."));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleSave(payload: StreamCodePayload) {
		if (!drawerState) return;

		if (drawerState.mode === "create") {
			const created = await createStreamCode(payload);
			setStreamCodes((current) => [created, ...current]);
			return;
		}

		const updated = await updateStreamCode(drawerState.record.id, payload);
		setStreamCodes((current) => current.map((record) => (record.id === updated.id ? updated : record)));
	}

	async function handleConfirmRemove() {
		if (!removeTarget || isRemoving) return;

		setIsRemoving(true);
		setPageError(null);
		try {
			await deleteStreamCode(removeTarget.id);
			setStreamCodes((current) => current.filter((record) => record.id !== removeTarget.id));
			setRemoveTarget(null);
		} catch (error) {
			setPageError(resolveErrorMessage(error, "Unable to remove that Stream Code right now."));
			setRemoveTarget(null);
		} finally {
			setIsRemoving(false);
		}
	}

	return (
		<>
			<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
				<div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-col gap-1">
							<h1 className="text-xl font-normal tracking-normal text-slate-950">Stream Codes</h1>
						</div>
						<Button className="min-w-44 justify-center" onClick={() => setDrawerState({ mode: "create", record: null })}>
							+ Add Stream Code
						</Button>
					</div>

					{pageError ? (
						<div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
							<span>{pageError}</span>
							<Button variant="secondary" onClick={() => void loadStreamCodes()}>
								Retry
							</Button>
						</div>
					) : null}

					{isLoading ? (
						<div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
							Loading Stream Codes...
						</div>
					) : (
						<StreamCodeTable
							streamCodes={streamCodes}
							onEdit={(record) => setDrawerState({ mode: "edit", record })}
							onRemove={setRemoveTarget}
						/>
					)}
				</div>
			</section>

			<AddStreamCodeDrawer
				open={drawerState !== null}
				mode={drawerState?.mode ?? "create"}
				initialData={drawerState?.record ?? null}
				onClose={() => setDrawerState(null)}
				onSave={handleSave}
			/>

			{removeTarget ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
						<h2 className="text-lg font-semibold text-slate-900">Remove Stream Code</h2>
						<p className="mt-2 text-sm text-slate-600">
							Are you sure you want to remove <span className="font-semibold text-slate-900">{removeTarget.streamCode}</span>? This action will hide it from Stream Codes.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="secondary" onClick={() => setRemoveTarget(null)} disabled={isRemoving}>
								Cancel
							</Button>
							<button type="button" onClick={() => void handleConfirmRemove()} disabled={isRemoving} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-600 bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-600/25 disabled:opacity-60 disabled:cursor-not-allowed">
								{isRemoving ? "Removing..." : "Remove"}
							</button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}


function resolveErrorMessage(error: unknown, fallbackMessage: string) {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallbackMessage;
}
