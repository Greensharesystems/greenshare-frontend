"use client";

import { useRouter, useSearchParams } from "next/navigation";

import AddCircularityCertificateForm from "@/app/components/forms/AddCircularityCertificateForm";
import CircularityCertificateTable from "@/app/components/tables/CircularityCertificateTable";
import Button from "@/app/components/ui/Button";

export default function AdminCircularityCertificatesPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isCreateView = searchParams.get("mode") === "new";

	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			{isCreateView ? (
				<div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-4">
					<div className="pt-1">
						<Button variant="secondary" onClick={() => router.push("/admin/traceability/circularity-certificates")}>
							Back to CC Table
						</Button>
					</div>
					<div className="w-full max-w-4xl pt-2">
						<h1 className="text-xl font-normal tracking-normal text-slate-950">Add Circularity Certificate</h1>
					</div>
					<div aria-hidden="true" />
					<div className="w-full max-w-4xl">
						<AddCircularityCertificateForm submitLabel="Add Circularity Certificate" />
					</div>
				</div>
			) : (
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
					<h1 className="text-xl font-normal tracking-normal text-slate-950">Circularity Certificates</h1>
					<div className="flex justify-end">
						<Button onClick={() => router.push("/admin/traceability/circularity-certificates?mode=new")}>
							Add Circularity Certificate
						</Button>
					</div>

					<CircularityCertificateTable permissions={{ canRemove: true }} />
				</div>
			)}
		</section>
	);
}
