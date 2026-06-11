"use client";

import { useState } from "react";

import CircularityCertificateTable from "@/app/components/tables/CircularityCertificateTable";
import ReceptionCertificateTable from "@/app/components/tables/ReceptionCertificateTable";
import Tab, { type TabItem } from "@/app/components/ui/Tab";

export default function CustomerCertificatesPage() {
	const [activeTab, setActiveTab] = useState("reception-certificates");

	const tabs: readonly TabItem[] = [
		{
			label: "Reception Certificates",
			value: "reception-certificates",
			content: <ReceptionCertificateTable permissions={{ canRemove: false }} />,
		},
		{
			label: "Circularity Certificates",
			value: "circularity-certificates",
			content: <CircularityCertificateTable permissions={{ canRemove: false }} />,
		},
	];

	return (
		<section className="min-h-[calc(100vh-54px)] px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-xl font-normal tracking-normal text-slate-950">Certificates</h1>
				</div>

				<Tab tabs={tabs} activeValue={activeTab} onChange={setActiveTab} panelClassName="p-0" />
			</div>
		</section>
	);
}
