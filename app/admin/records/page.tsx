"use client";

import { useState } from "react";

import NoteAndCertificatesTable from "@/app/components/tables/NoteAndCertificatesTable";
import Tab, { type TabItem } from "@/app/components/ui/Tab";

export default function AdminRecordsPage() {
	const [activeTab, setActiveTab] = useState("reception-notes");

	const tabs: readonly TabItem[] = [
		{
			label: "Reception Notes",
			value: "reception-notes",
			content: <RecordsPanel title="Reception Notes" description="Track intake documents submitted for each customer collection." />,
		},
		{
			label: "Reception Certificates",
			value: "reception-certificates",
			content: (
				<RecordsPanel
					title="Reception Certificates"
					description="Review certificates generated from validated reception records before release."
				/>
			),
		},
		{
			label: "Circularity Certificates",
			value: "circularity-certificates",
			content: (
				<RecordsPanel
					title="Circularity Certificates"
					description="Monitor circularity certificate issuance and customer-ready status across processed materials."
				/>
			),
		},
	];

	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">Records</h1>
				<Tab tabs={tabs} activeValue={activeTab} onChange={setActiveTab} panelClassName="p-0" />
			</div>
		</section>
	);
}

type RecordsPanelProps = Readonly<{
	title: string;
	description: string;
}>;

function RecordsPanel({ title, description }: RecordsPanelProps) {
	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold text-slate-950">{title}</h2>
				<p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
			</div>
			<NoteAndCertificatesTable />
		</div>
	);
}
