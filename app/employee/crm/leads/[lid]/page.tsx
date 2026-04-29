"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import AssignedPanel from "@/components/crm/leads/AssignedPanel";
import LeadDetailsHeader from "@/components/crm/leads/LeadDetailsHeader";
import FinancialReviewPanel from "@/components/crm/leads/FinancialReviewPanel";
import LabAnalysisPanel from "@/components/crm/leads/LabAnalysisPanel";
import LogisticsCostingPanel from "@/components/crm/leads/LogisticsCostingPanel";
import LeadOutcomePanel from "@/components/crm/leads/LeadOutcomePanel";
import OperationalCostingPanel from "@/components/crm/leads/OperationalCostingPanel";
import ProposalSummaryPanel from "@/components/crm/leads/ProposalSummaryPanel";
import LeadWorkflowStepper from "@/components/crm/leads/LeadWorkflowStepper";

type LeadPanelMode = "readOnly" | "editable" | "disabled";

export default function LeadDetailsPage() {
	const params = useParams<{ lid: string }>();
	const lid = Array.isArray(params.lid) ? params.lid[0] : params.lid;
	const currentStep = "Lab Analysis";
	const [selectedStep, setSelectedStep] = useState<string | null>(null);

	const selectedPanel = useMemo(() => {
		if (!selectedStep) {
			return null;
		}

		const panelMode: LeadPanelMode = "editable";

		if (selectedStep === "Assigned") {
			return <AssignedPanel mode={panelMode} />;
		}

		if (selectedStep === "Lab Analysis") {
			return <LabAnalysisPanel mode={panelMode} />;
		}

		if (selectedStep === "Operational Costing") {
			return <OperationalCostingPanel mode={panelMode} />;
		}

		if (selectedStep === "Logistics Costing") {
			return <LogisticsCostingPanel mode={panelMode} />;
		}

		if (selectedStep === "Financial Review") {
			return <FinancialReviewPanel mode={panelMode} />;
		}

		if (selectedStep === "Proposal") {
			return <ProposalSummaryPanel mode={panelMode} />;
		}

		if (selectedStep === "Outcome") {
			return <LeadOutcomePanel mode={panelMode} />;
		}

		return <WorkflowPlaceholderPanel step={selectedStep} mode={panelMode} />;
	}, [selectedStep]);

	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col">
				<LeadDetailsHeader
					lid={lid}
					customerName="Green Loop Trading LLC"
					cid="CID-10021"
					serviceType="Plastic Recycling"
					status="New"
					priority="Medium"
				/>
				<div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
					<LeadWorkflowStepper
						currentStep={currentStep}
						onStepClick={(step) => {
							setSelectedStep((currentSelectedStep) => (currentSelectedStep === step ? null : step));
						}}
					/>
				</div>
				{selectedPanel ? <div className="mt-6">{selectedPanel}</div> : null}
			</div>
		</section>
	);
}

function WorkflowPlaceholderPanel({ step, mode }: Readonly<{ step: string; mode: LeadPanelMode }>) {
	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-3">
				<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">{step}</p>
				<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Workflow Stage Panel</h2>
				<p className="max-w-3xl text-sm text-slate-500">
					This workflow panel is in {mode === "editable" ? "editable" : mode === "readOnly" ? "read-only" : "preview"} mode.
				</p>
			</div>
		</section>
	);
}
