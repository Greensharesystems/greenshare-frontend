"use client";

import { useState } from "react";

import {
	CUSTOMER_BACKGROUND_EVENT,
	CUSTOMER_BACKGROUND_OPTIONS,
	CUSTOMER_BACKGROUND_STORAGE_KEY,
	type CustomerBackgroundOption,
	resolveCustomerBackgroundOption,
} from "@/app/utils/customerBackground";

export default function CustomerSettingsPage() {
	const [selectedBackground, setSelectedBackground] = useState<CustomerBackgroundOption>(() => {
		if (typeof window === "undefined") {
			return resolveCustomerBackgroundOption(undefined);
		}

		return resolveCustomerBackgroundOption(window.localStorage.getItem(CUSTOMER_BACKGROUND_STORAGE_KEY));
	});

	function handleBackgroundChange(backgroundId: CustomerBackgroundOption["id"]) {
		const nextBackground = resolveCustomerBackgroundOption(backgroundId);
		window.localStorage.setItem(CUSTOMER_BACKGROUND_STORAGE_KEY, nextBackground.id);
		window.dispatchEvent(new Event(CUSTOMER_BACKGROUND_EVENT));
		setSelectedBackground(nextBackground);
	}

	return (
		<section className="min-h-[calc(100vh-54px)] px-6 py-6">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
				<div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#36B44D]">Settings</p>
					<h1 className="mt-2 text-3xl font-medium tracking-[-0.05em] text-slate-900">Workspace Background</h1>
					<p className="mt-2 max-w-2xl text-sm text-slate-500">
						Generic settings are limited to background selection for now. Pick the workspace surface you want across the customer area.
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					{CUSTOMER_BACKGROUND_OPTIONS.map((option) => {
						const isSelected = option.id === selectedBackground.id;

						return (
							<button
								key={option.id}
								type="button"
								onClick={() => handleBackgroundChange(option.id)}
								className={[
									"rounded-[28px] border p-4 text-left transition",
									isSelected
										? "border-[#36B44D] bg-white shadow-[0_14px_30px_rgba(54,180,77,0.14)]"
										: "border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
								].join(" ")}
							>
								<div className={[
									"h-36 rounded-[22px] border border-slate-200",
									option.previewClassName,
								].join(" ")}>
									<div className="flex h-full items-start justify-between p-4">
										{isSelected ? (
											<div className="rounded-full bg-[#36B44D] px-2.5 py-1 text-[11px] font-semibold text-white">Active</div>
										) : null}
									</div>
								</div>
								<p className="mt-4 text-lg font-medium tracking-[-0.03em] text-slate-900">{option.label}</p>
								<p className="mt-1 text-sm text-slate-500">{option.description}</p>
							</button>
						);
					})}
				</div>
			</div>
		</section>
	);
}
