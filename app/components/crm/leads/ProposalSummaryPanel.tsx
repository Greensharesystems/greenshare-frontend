import Button from "@/app/components/ui/Button";

type LeadPanelMode = "readOnly" | "editable" | "disabled";

type ProposalSummaryPanelProps = Readonly<{
	mode?: LeadPanelMode;
}>;

export default function ProposalSummaryPanel({ mode = "editable" }: ProposalSummaryPanelProps) {
	const isReadOnly = mode === "readOnly";
	const isDisabled = mode === "disabled";
	const inputsDisabled = mode !== "editable";

	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Proposal</p>
					<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Proposal Summary</h2>
					<p className="max-w-3xl text-sm text-slate-500">
						Prepare and review the commercial proposal summary before sharing it with the customer.
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<Field label="Proposal Value" value="AED 12,800" disabled={inputsDisabled} />
					<Field label="Validity" value="30 Days" disabled={inputsDisabled} />
					<Field label="Expected Margin" value="26%" disabled={inputsDisabled} />
					<Field label="Prepared By" value="Business Growth Team" disabled={inputsDisabled} />
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">Proposal Notes</span>
					<textarea
						rows={5}
						defaultValue="Draft proposal includes collection, processing, and reporting scope aligned with approved costing inputs."
						disabled={inputsDisabled}
						className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20 disabled:cursor-not-allowed disabled:opacity-70"
					/>
				</label>

				<div className="flex flex-wrap gap-3 pt-1">
					<Button variant="secondary">View</Button>
					<Button variant="secondary" disabled={mode !== "readOnly"}>Download</Button>
					<Button disabled={mode !== "editable"}>Upload</Button>
					<Button disabled={mode !== "editable"}>Submit</Button>
				</div>

				{isReadOnly ? <p className="text-xs text-slate-500">Read-only mode: completed step data can be viewed or downloaded.</p> : null}
				{isDisabled ? <p className="text-xs text-slate-500">Preview mode: upcoming step data is visible but cannot be edited.</p> : null}
			</div>
		</section>
	);
}

function Field({ label, value, disabled }: Readonly<{ label: string; value: string; disabled: boolean }>) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-sm font-medium text-slate-700">{label}</span>
			<input
				defaultValue={value}
				disabled={disabled}
				className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20 disabled:cursor-not-allowed disabled:opacity-70"
			/>
		</label>
	);
}
