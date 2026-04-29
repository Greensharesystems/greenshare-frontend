"use client";

import Link from "next/link";

import StatusBadge from "@/components/ui/StatusBadge";

type ProposalRow = Readonly<{
	pid: string;
	lid: string;
	customerName: string;
	status: string;
	version: string;
	createdDate: string;
}>;

const proposalRows: ProposalRow[] = [
	{
		pid: "PID-CID001-0001",
		lid: "LID-CID001-0001",
		customerName: "Green Loop Trading LLC",
		status: "Draft",
		version: "v1",
		createdDate: "24 Apr 2026",
	},
	{
		pid: "PID-CID002-0001",
		lid: "LID-CID002-0001",
		customerName: "Blue Star Industries",
		status: "Sent",
		version: "v1",
		createdDate: "23 Apr 2026",
	},
];

const columns = ["PID", "LID", "Customer", "Status", "Version", "Created Date", "Actions"] as const;

export default function EmployeeProposalsPage() {
	function handleViewProposal(pid: string) {
		console.log(`View proposal: ${pid}`);
	}

	function handleDownloadProposal(pid: string) {
		console.log(`Download proposal: ${pid}`);
	}

	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Proposals</h1>
					<p className="max-w-2xl text-sm text-slate-500">
						Review and manage proposal records across the CRM workflow.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
					<div className="w-full overflow-x-auto">
						<table className="min-w-full border-collapse text-left text-sm text-slate-700">
							<thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
								<tr>
									{columns.map((column) => (
										<th key={column} className="px-4 py-3 font-semibold">
											{column}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{proposalRows.map((proposal) => (
									<tr key={proposal.pid} className="border-b border-slate-200 transition hover:bg-slate-50 last:border-b-0">
										<td className="p-4 font-medium text-slate-900">{proposal.pid}</td>
										<td className="p-4 text-slate-600">{proposal.lid}</td>
										<td className="p-4 text-slate-600">{proposal.customerName}</td>
										<td className="p-4">
											<StatusBadge status={proposal.status} />
										</td>
										<td className="p-4 text-slate-600">{proposal.version}</td>
										<td className="p-4 text-slate-600">{proposal.createdDate}</td>
										<td className="p-4">
											<div className="flex items-center gap-2 text-xs font-medium text-slate-600">
												<Link href={`/employee/crm/proposals/${proposal.pid}`} className="transition hover:text-[#36B44D] hover:underline">
													Edit
												</Link>
												<span className="text-slate-300">|</span>
												<button
													type="button"
													onClick={() => handleViewProposal(proposal.pid)}
													className="transition hover:text-[#36B44D] hover:underline"
												>
													View
												</button>
												<span className="text-slate-300">|</span>
												<button
													type="button"
													onClick={() => handleDownloadProposal(proposal.pid)}
													className="transition hover:text-[#36B44D] hover:underline"
												>
													Download
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</section>
	);
}
