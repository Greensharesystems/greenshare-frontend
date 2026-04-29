import ConversionFunnelWidget from "@/components/crm/dashboard/ConversionFunnelWidget";
import CustomerOverviewWidget from "@/components/crm/dashboard/CustomerOverviewWidget";
import LeadConversionTimeWidget from "@/components/crm/dashboard/LeadConversionTimeWidget";
import LeadGenerationTrendWidget from "@/components/crm/dashboard/LeadGenerationTrendWidget";
import LeadsOverviewWidget from "@/components/crm/dashboard/LeadsOverviewWidget";
import OutcomeValueWidget from "@/components/crm/dashboard/OutcomeValueWidget";
import PendingActionsWidget from "@/components/crm/dashboard/PendingActionsWidget";
import ProposalStatusBreakdownWidget from "@/components/crm/dashboard/ProposalStatusBreakdownWidget";
import ProposalTrendWidget from "@/components/crm/dashboard/ProposalTrendWidget";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const leadGenerationValues = [10, 15, 20, 18, 25, 30, 28, 35, 40, 38, 42, 50];
const proposalTrendValues = [5, 8, 12, 10, 15, 18, 20, 22, 25, 24, 28, 30];
const conversionFunnelSteps = [
	{ label: "Leads Created", value: 240 },
	{ label: "Assigned", value: 200 },
	{ label: "Proposal Created", value: 150 },
	{ label: "Proposal Sent", value: 110 },
	{ label: "Won", value: 70 },
	{ label: "Lost", value: 40 },
];
const pendingActions = [
	{ lid: "LID-001", customer: "Green Loop Trading", stage: "Lab Analysis", responsible: "Lab Team", due: "2 days" },
	{ lid: "LID-002", customer: "Blue Star Industries", stage: "Financial Review", responsible: "Finance", due: "1 day" },
	{ lid: "LID-003", customer: "Eco Materials LLC", stage: "Logistics Costing", responsible: "Ops Team", due: "3 days" },
];
const proposalStatuses = [
	{ label: "Draft", value: 20 },
	{ label: "Under Review", value: 15 },
	{ label: "Sent", value: 30 },
	{ label: "Accepted", value: 25 },
	{ label: "Rejected", value: 10 },
];

export default function EmployeeGrowthDashboardPage() {
	return (
		<section className="min-h-[calc(100vh-54px)] bg-white py-6">
			<div className="mx-auto w-full max-w-7xl px-6">
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Growth Dashboard</h1>
				</div>
				<div className="mt-6 grid gap-6 xl:grid-cols-3">
					<CustomerOverviewWidget totalCustomers={120} activeCustomers={85} newCustomersThisMonth={12} />
					<LeadsOverviewWidget totalLeads={240} openLeads={95} receivedLastWeek={18} proposalsSentLastWeek={10} />
					<OutcomeValueWidget wonLeadsValue="AED 2,500,000" lostLeadsValue="AED 900,000" winRate="62%" lostRate="38%" />
				</div>
				<div className="mt-6 grid gap-6 lg:grid-cols-2">
					<LeadGenerationTrendWidget months={months} values={leadGenerationValues} />
					<ProposalTrendWidget months={months} values={proposalTrendValues} />
				</div>
				<div className="mt-6 grid gap-6 lg:grid-cols-2">
					<ConversionFunnelWidget steps={conversionFunnelSteps} />
					<PendingActionsWidget rows={pendingActions} />
				</div>
				<div className="mt-6 grid gap-6 lg:grid-cols-2">
					<ProposalStatusBreakdownWidget statuses={proposalStatuses} />
					<LeadConversionTimeWidget
						avgDaysToWin="14 days"
						avgDaysToLost="21 days"
						fastestConversion="5 days"
						slowestConversion="38 days"
					/>
				</div>
			</div>
		</section>
	);
}
