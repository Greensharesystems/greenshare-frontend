const proposalSections = [
	{
		label: "Technical Scope",
		defaultValue:
			"Define the collection scope, material categories, service inclusions, reporting deliverables, and operating assumptions for this proposal.",
	},
	{
		label: "Commercial Terms",
		defaultValue:
			"Capture payment terms, service validity, approval assumptions, exclusions, and any commercial conditions required before issue.",
	},
	{
		label: "Pricing Summary",
		defaultValue:
			"Summarize the total proposal value, pricing structure, logistics charges, optional line items, and internal margin considerations.",
	},
] as const;

export default function ProposalBuilder() {
	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Proposal Builder</p>
					<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Build Proposal Content</h2>
					<p className="max-w-3xl text-sm text-slate-500">
						Draft the proposal scope, commercial terms, and pricing summary using local dummy content only.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					{proposalSections.map((section) => (
						<label key={section.label} className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
							<span className="text-sm font-semibold text-slate-900">{section.label}</span>
							<textarea
								rows={6}
								defaultValue={section.defaultValue}
								className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					))}
				</div>
			</div>
		</section>
	);
}
