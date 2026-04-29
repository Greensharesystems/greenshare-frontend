"use client";

import { useState } from "react";

import WidgetShell from "@/app/components/cards/WidgetShell";
import { downloadCustomerReportsCsv } from "@/app/services/customerDashboard.service";

export default function CustomerReportsPage() {
	const [isDownloading, setIsDownloading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	async function handleDownload() {
		setErrorMessage("");
		setIsDownloading(true);

		try {
			await downloadCustomerReportsCsv();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to download the customer report right now.");
		} finally {
			setIsDownloading(false);
		}
	}

	return (
		<section className="min-h-[calc(100vh-54px)] px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">Reports</h1>
					<p className="max-w-3xl text-sm leading-6 text-slate-600">
						Download the dataset for quantities, certificates, and material flow.
					</p>
				</div>

				<WidgetShell size="md" title="Download Data">
					<div className="flex h-full items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
						<div className="min-w-0">
							<p className="text-base font-semibold tracking-[-0.03em] text-slate-950">Export Data (CSV)</p>
							<p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
								Complete dataset of quantities, certificates, and material flow
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								void handleDownload();
							}}
							disabled={isDownloading}
							className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-[#36B44D]/20 bg-[#36B44D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2fa044] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
						>
							{isDownloading ? "Downloading..." : "Download CSV"}
						</button>
					</div>
				</WidgetShell>

				{errorMessage ? (
					<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
				) : null}
			</div>
		</section>
	);
}
