"use client";

import { useEffect, useState } from "react";

import AddLeadDrawer from "@/components/crm/leads/AddLeadDrawer";
import LeadTable, { type LeadRecord } from "@/components/crm/leads/LeadTable";
import type { LeadFormData } from "@/components/crm/leads/LeadForm";
import Button from "@/app/components/ui/Button";
import { createLeadRecord, deleteLeadRecord, getLeadRecords, getNextLeadId } from "@/app/services/crm-leads.service";

export default function AdminLeadsPage() {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [leads, setLeads] = useState<LeadRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [pageError, setPageError] = useState<string | null>(null);
	const [removeTargetLid, setRemoveTargetLid] = useState<string | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);

	useEffect(() => {
		void loadLeads();
	}, []);

	async function loadLeads() {
		setIsLoading(true);
		setPageError(null);

		try {
			setLeads(await getLeadRecords());
		} catch (error) {
			setPageError(resolveErrorMessage(error, "Unable to load CRM leads right now."));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleCreateLead(leadData: LeadFormData) {
		const createdLead = await createLeadRecord(leadData);
		setPageError(null);
		setLeads((currentLeads) => [createdLead, ...currentLeads]);
	}

	async function handleGenerateLeadId() {
		return getNextLeadId();
	}

	function handleRequestRemove(lid: string) {
		setRemoveTargetLid(lid);
	}

	function handleCancelRemove() {
		if (isRemoving) return;
		setRemoveTargetLid(null);
	}

	async function handleConfirmRemove() {
		if (!removeTargetLid || isRemoving) return;
		setIsRemoving(true);
		try {
			await deleteLeadRecord(removeTargetLid);
			setLeads((current) => current.filter((lead) => lead.lid !== removeTargetLid));
			setRemoveTargetLid(null);
		} catch (error) {
			setPageError(resolveErrorMessage(error, "Unable to remove that lead right now."));
			setRemoveTargetLid(null);
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
							<h1 className="text-base font-normal tracking-normal text-slate-950">Leads</h1>
							<p className="max-w-2xl text-sm text-slate-500">Manage and track all incoming leads.</p>
						</div>
						<Button className="min-w-36 justify-center" onClick={() => setIsDrawerOpen(true)}>
							+ New Lead
						</Button>
					</div>

					{pageError ? (
						<div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
							<span>{pageError}</span>
							<Button variant="secondary" onClick={() => void loadLeads()}>
								Retry
							</Button>
						</div>
					) : null}

					{isLoading ? (
						<div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
							Loading CRM leads...
						</div>
					) : (
						<LeadTable
							leads={leads}
							linkBase="/admin/crm/leads"
							onRemove={handleRequestRemove}
							showExport
						/>
					)}
				</div>
			</section>

			<AddLeadDrawer
				open={isDrawerOpen}
				onClose={() => setIsDrawerOpen(false)}
				onCreateLead={handleCreateLead}
				onGenerateLeadId={handleGenerateLeadId}
			/>

			{removeTargetLid ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
						<h2 className="text-lg font-semibold text-slate-900">Remove Lead</h2>
						<p className="mt-2 text-sm text-slate-600">
							Are you sure you want to remove lead{" "}
							<span className="font-semibold text-slate-900">{removeTargetLid}</span>? This action cannot be undone.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="secondary" onClick={handleCancelRemove} disabled={isRemoving}>
								Cancel
							</Button>
							<button
								type="button"
								onClick={() => void handleConfirmRemove()}
								disabled={isRemoving}
								className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-600 bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-600/25 disabled:opacity-60 disabled:cursor-not-allowed"
							>
								{isRemoving ? "Removing…" : "Remove"}
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
