"use client";

import { useEffect, useState } from "react";

import AddLeadDrawer from "@/components/crm/leads/AddLeadDrawer";
import LeadTable, { type LeadRecord } from "@/components/crm/leads/LeadTable";
import type { LeadFormData } from "@/components/crm/leads/LeadForm";
import Button from "@/app/components/ui/Button";
import { createLeadRecord, getLeadRecords, getNextLeadId } from "@/app/services/crm-leads.service";

export default function EmployeeLeadsPage() {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [leads, setLeads] = useState<LeadRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [pageError, setPageError] = useState<string | null>(null);

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
						<LeadTable leads={leads} />
					)}
				</div>
			</section>
			<AddLeadDrawer
				open={isDrawerOpen}
				onClose={() => setIsDrawerOpen(false)}
				onCreateLead={handleCreateLead}
				onGenerateLeadId={handleGenerateLeadId}
			/>
		</>
	);
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallbackMessage;
}
