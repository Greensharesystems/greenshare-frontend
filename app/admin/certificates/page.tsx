"use client";

import { useState } from "react";

import KpiCard from "@/app/components/cards/KpiCard";
import NoteAndCertificateStatusTable from "@/app/components/tables/NoteAndCertificateStatusTable";
import Tab, { type TabItem } from "@/app/components/ui/Tab";

const kpiCards = [
	{
		title: "Reception Notes",
		value: "128",
		description: "Notes recorded and currently moving through review and approval.",
	},
	{
		title: "Reception Certificates",
		value: "94",
		description: "Certificates prepared from validated reception records for issuance.",
	},
	{
		title: "Circularity Certificates",
		value: "61",
		description: "Circularity certificates tracked across processing and final delivery.",
	},
] as const;

export default function AdminCertificatesPage() {
	const [activeTab, setActiveTab] = useState("reception-notes");

	const tabs: readonly TabItem[] = [
		{
			label: "Reception Notes",
			value: "reception-notes",
			content: (
				<CertificatesPanel
					title="Reception Notes"
					description="Monitor the status of submitted reception notes and follow each review stage."
				/>
			),
		},
		{
			label: "Reception Certificates",
			value: "reception-certificates",
			content: (
				<CertificatesPanel
					title="Reception Certificates"
					description="Track certificate preparation, verification, and readiness for release."
				/>
			),
		},
		{
			label: "Circularity Certificates",
			value: "circularity-certificates",
			content: (
				<CertificatesPanel
					title="Circularity Certificates"
					description="Review circularity certificate progress for processed materials and customers."
				/>
			),
		},
	];

	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">Certificates</h1>

				<div className="flex flex-wrap gap-4">
					{kpiCards.map((card) => (
						<KpiCard
							key={card.title}
							title={card.title}
							value={card.value}
							description={card.description}
						/>
					))}
				</div>

				<Tab tabs={tabs} activeValue={activeTab} onChange={setActiveTab} panelClassName="p-0" />
			</div>
		</section>
	);
}

type CertificatesPanelProps = Readonly<{
	title: string;
	description: string;
}>;

function CertificatesPanel({ title, description }: CertificatesPanelProps) {
	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold text-slate-950">{title}</h2>
				<p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
			</div>
			<NoteAndCertificateStatusTable />
		</div>
	);
}
