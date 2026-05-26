"use client";

import { useState } from "react";

import AddLeadDrawer from "@/components/crm/leads/AddLeadDrawer";
import LeadTable, { initialLeadRows, type LeadRecord } from "@/components/crm/leads/LeadTable";
import type { LeadFormData } from "@/components/crm/leads/LeadForm";
import Button from "@/app/components/ui/Button";

export default function EmployeeLeadsPage() {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [leads, setLeads] = useState<LeadRecord[]>(initialLeadRows);

	function handleCreateLead(leadData: LeadFormData) {
		setLeads((currentLeads) => [
			buildLeadRecord(leadData, currentLeads.length + 1),
			...currentLeads,
		]);
	}

	return (
		<>
			<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-col gap-1">
							<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Leads</h1>
							<p className="max-w-2xl text-sm text-slate-500">Manage and track all incoming leads.</p>
						</div>
						<Button className="min-w-36 justify-center" onClick={() => setIsDrawerOpen(true)}>
							+ New Lead
						</Button>
					</div>

					<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
						<LeadTable leads={leads} />
					</div>
				</div>
			</section>
			<AddLeadDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onCreateLead={handleCreateLead} />
		</>
	);
}

function buildLeadRecord(leadData: LeadFormData, sequence: number): LeadRecord {
	const { customerName, cid } = splitCustomerAndCid(leadData.customerCid);
	const sequenceText = String(sequence).padStart(4, "0");

	return {
		date: formatLeadDate(new Date()),
		lid: `LID-${sequenceText}`,
		source: "Website",
		assignedTo: {
			name: "Lab Team",
			initials: "LT",
		},
		cid,
		customerName,
		wasteStream: leadData.serviceType,
		wasteClass: inferWasteClass(leadData.serviceType),
		estimatedQuantity: 0,
		unit: "Tons",
		labId: `LAB-${sequenceText}`,
		labStatus: "Pending",
		proposalId: null,
		proposalStatus: "Draft",
		status: "Open",
	};
}

function splitCustomerAndCid(customerCid: string) {
	const [namePart, cidPart] = customerCid.split("/").map((value) => value.trim()).filter(Boolean);

	if (namePart && cidPart) {
		return { customerName: namePart, cid: cidPart };
	}

	return {
		customerName: customerCid,
		cid: customerCid,
	};
}

function formatLeadDate(date: Date) {
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

function inferWasteClass(serviceType: string): LeadRecord["wasteClass"] {
	const value = serviceType.toLowerCase();

	if (value.includes("plastic") || value.includes("paper") || value.includes("recycling")) {
		return "Recyclable";
	}

	if (value.includes("chemical") || value.includes("sludge") || value.includes("solvent") || value.includes("waste")) {
		return "Hazardous";
	}

	return "Non-Hazardous";
}
