import TraceabilityTable from "@/app/components/tables/TraceabilityTable";

export default function CustomerTraceabilityPage() {
	return (
		<section className="min-h-[calc(100vh-54px)] px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-xl font-normal tracking-normal text-slate-950">Traceability</h1>
				</div>

				<TraceabilityTable />
			</div>
		</section>
	);
}
