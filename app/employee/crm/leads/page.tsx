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
				<div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-col gap-1">
							<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Leads</h1>
							<p className="max-w-2xl text-sm text-slate-500">Manage and track all incoming leads.</p>
						</div>
						<Button className="min-w-36 justify-center" onClick={() => setIsDrawerOpen(true)}>
							+ New Lead
						</Button>
					</div>

					<LeadTable leads={leads} />
				</div>
			</section>
			<AddLeadDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onCreateLead={handleCreateLead} existingLeads={leads} />
		</>
	);
}

function buildLeadRecord(leadData: LeadFormData, sequence: number): LeadRecord {
	const sequenceText = String(sequence).padStart(4, "0");
	const assignedToName = leadData.assignedTo === "Other" ? leadData.assignedPersonName : leadData.assignedTo;
	const customerName = leadData.customerName.trim();
	const cid = leadData.cid.trim();

	return {
		date: leadData.leadDate,
		leadGeneratedDate: leadData.leadDate,
		lid: leadData.leadId,
		source: leadData.source,
		assignedTo: {
			name: assignedToName,
			initials: buildInitials(assignedToName),
		},
		cid,
		customerName,
		wasteStream: leadData.wasteStream,
		wasteClass: leadData.wasteClass === "Non Hazardous" ? "Non-Hazardous" : leadData.wasteClass,
		otherWasteClass: leadData.wasteClass === "Others" ? leadData.otherWasteClass.trim() : null,
		estimatedQuantity: 0,
		unit: "Tons",
		labId: `LAB-${sequenceText}`,
		labStatus: "Pending",
		labUpdatedDate: leadData.leadDate,
		proposalId: null,
		proposalStatus: "Draft",
		proposalUpdatedDate: leadData.leadDate,
		status: "Open",
		leadStatusUpdatedDate: leadData.leadDate,
	};
}

function buildInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("")
		|| "NA";
}
