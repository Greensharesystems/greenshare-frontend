"use client";

import { useState } from "react";

import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/app/components/ui/Button";

type ProposalRow = Readonly<{
	pid: string;
	lid: string;
	customerName: string;
	status: string;
	version: string;
	createdDate: string;
}>;

const initialProposalRows: ProposalRow[] = [
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

export default function AdminProposalsPage() {
	const [proposals, setProposals] = useState<ProposalRow[]>(initialProposalRows);
	const [removeTargetPid, setRemoveTargetPid] = useState<string | null>(null);

	function handleRequestRemove(pid: string) {
		setRemoveTargetPid(pid);
	}

	function handleCancelRemove() {
		setRemoveTargetPid(null);
	}

	function handleConfirmRemove() {
		if (!removeTargetPid) return;
		setProposals((current) => current.filter((proposal) => proposal.pid !== removeTargetPid));
		setRemoveTargetPid(null);
	}

	function handleView(pid: string) {
		console.log(`View proposal: ${pid}`);
	}

	function handleDownload(pid: string) {
		console.log(`Download proposal: ${pid}`);
	}

	return (
		<>
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
									{proposals.map((proposal) => (
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
													<button
														type="button"
														onClick={() => handleView(proposal.pid)}
														className="transition hover:text-[#36B44D] hover:underline"
													>
														View
													</button>
													<span className="text-slate-300">|</span>
													<button
														type="button"
														onClick={() => handleDownload(proposal.pid)}
														className="transition hover:text-[#36B44D] hover:underline"
													>
														Download
													</button>
													<span className="text-slate-300">|</span>
													<button
														type="button"
														onClick={() => handleRequestRemove(proposal.pid)}
														className="transition hover:text-rose-600 hover:underline"
													>
														Remove
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

			{removeTargetPid ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
						<h2 className="text-lg font-semibold text-slate-900">Remove Proposal</h2>
						<p className="mt-2 text-sm text-slate-600">
							Are you sure you want to remove proposal{" "}
							<span className="font-semibold text-slate-900">{removeTargetPid}</span>? This action cannot be undone.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="secondary" onClick={handleCancelRemove}>
								Cancel
							</Button>
							<button
								type="button"
								onClick={handleConfirmRemove}
								className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-600 bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-600/25"
							>
								Remove
							</button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}
