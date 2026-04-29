"use client";

import { useRouter, useSearchParams } from "next/navigation";

import AddReceptionNoteForm from "@/app/components/forms/AddReceptionNoteForm";
import Button from "@/app/components/ui/Button";
import ReceptionNotesTable from "@/app/components/tables/ReceptionNotesTable";

export default function EmployeeReceptionNotesPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isCreateView = searchParams.get("mode") === "new";

	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			{isCreateView ? (
				<div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-4">
					<div className="pt-1">
						<Button variant="secondary" onClick={() => router.push("/employee/reception-notes")}>
							Back to RN Table
						</Button>
					</div>
					<div className="w-full max-w-4xl pt-2">
						<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Add Reception Note</h1>
					</div>
					<div aria-hidden="true" />
					<div className="w-full max-w-4xl">
						<AddReceptionNoteForm submitLabel="Add Reception Note" />
					</div>
				</div>
			) : (
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">Reception Notes</h1>
						<p className="max-w-3xl text-sm leading-6 text-slate-600">
							Review note submission status, assignment, and the latest processing updates.
						</p>
					</div>

					<div className="flex justify-end">
						<Button onClick={() => router.push("/employee/reception-notes?mode=new")}>
							Add Reception Note
						</Button>
					</div>

					<ReceptionNotesTable />
				</div>
			)}
		</section>
	);
}
