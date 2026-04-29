import Stepper from "@/components/ui/Stepper";

const steps = ["New", "Assigned", "Lab Analysis", "Operational Costing", "Logistics Costing", "Financial Review", "Proposal", "Outcome"];

type LeadWorkflowStepperProps = Readonly<{
	currentStep: string;
	onStepClick?: (step: string, mode: "readOnly" | "editable" | "disabled") => void;
}>;

export default function LeadWorkflowStepper({ currentStep, onStepClick }: LeadWorkflowStepperProps) {
	const normalizedCurrentStep = normalizeLeadStep(currentStep);

	return <Stepper steps={steps} currentStep={normalizedCurrentStep} onStepClick={onStepClick} />;
}

function normalizeLeadStep(step: string) {
	if (step === "Won" || step === "Lost" || step === "Won / Lost") {
		return "Outcome";
	}

	return step;
}
