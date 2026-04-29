"use client";

import type { FormEvent } from "react";

import Button from "@/app/components/ui/Button";

export type LeadFormData = Readonly<{
	customerCid: string;
	serviceType: string;
	wasteType: string;
	estimatedQuantity: string;
	priority: "high" | "medium" | "low";
	description: string;
}>;

type LeadFormProps = Readonly<{
	onSubmit: (data: LeadFormData) => void;
	onCancel: () => void;
}>;

export default function LeadForm({ onSubmit, onCancel }: LeadFormProps) {
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const form = event.currentTarget;
		const formData = new FormData(form);
		const payload: LeadFormData = {
			customerCid: String(formData.get("customerCid") ?? "").trim(),
			serviceType: String(formData.get("serviceType") ?? "").trim(),
			wasteType: String(formData.get("wasteType") ?? "").trim(),
			estimatedQuantity: String(formData.get("estimatedQuantity") ?? "").trim(),
			priority: (String(formData.get("priority") ?? "medium").trim() || "medium") as LeadFormData["priority"],
			description: String(formData.get("description") ?? "").trim(),
		};

		onSubmit(payload);
		form.reset();
	}

	return (
		<form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleSubmit}>
			<div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
				<label className="flex flex-col gap-1.5 sm:col-span-2">
					<span className="text-sm font-medium text-slate-700">Customer / CID</span>
					<input
						name="customerCid"
						required
						placeholder="Select customer or enter CID"
						className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">Service Type</span>
					<select
						name="serviceType"
						defaultValue=""
						required
						className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					>
						<option value="" disabled>
							Select service type
						</option>
						<option value="Recycling">Recycling</option>
						<option value="Collection">Collection</option>
						<option value="Consulting">Consulting</option>
					</select>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">Waste Type</span>
					<input
						name="wasteType"
						required
						placeholder="Plastic, paper, e-waste..."
						className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">Estimated Quantity</span>
					<input
						name="estimatedQuantity"
						required
						placeholder="e.g. 2.5 tons / month"
						className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">Priority</span>
					<select
						name="priority"
						defaultValue="medium"
						className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</label>

				<label className="flex flex-col gap-1.5 sm:col-span-2">
					<span className="text-sm font-medium text-slate-700">Description</span>
					<textarea
						name="description"
						rows={6}
						placeholder="Add lead notes, scope details, and next steps"
						className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>
			</div>

			<div className="mt-auto flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">Save Lead</Button>
			</div>
		</form>
	);
}
