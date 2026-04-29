import ProposalBuilder from "@/components/crm/proposals/ProposalBuilder";
import ProposalHeader from "@/components/crm/proposals/ProposalHeader";

export default function ProposalDetailsPage() {
	return (
		<section className="min-h-[calc(100vh-54px)] bg-white py-6">
			<div className="mx-auto w-full max-w-7xl px-6">
				<ProposalHeader />
				<div className="mt-6">
					<ProposalBuilder />
				</div>
			</div>
		</section>
	);
}
