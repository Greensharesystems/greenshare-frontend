"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import Button from "@/app/components/ui/Button";
import { apiFetch } from "@/app/utils/api";
import { formatDateForDisplay } from "@/app/utils/dateFormat";

type AddCustomerFormProps = Readonly<{
	submitLabel?: string;
	mode?: "create" | "edit";
	customerId?: string | null;
}>;

type FocalPersonFormValue = {
	name: string;
	position: string;
	department: string;
	email: string;
	officePhone: string;
	mobilePhone: string;
	hasUserAccount?: boolean;
};

type CustomerRecord = {
	customerIdDate: string;
	customerId: string;
	companyName: string;
	companyEmirate: string;
	area: string;
	officeAddress: string;
	website: string;
	sector: string;
	focalPersons?: FocalPersonFormValue[];
};

type CompanyFormState = {
	companyName: string;
	emirate: string;
	area: string;
	officeLocation: string;
	website: string;
	sector: string;
};

const companyFields = [
	{ id: "companyName", label: "Company Name", type: "text", placeholder: "Enter company name" },
	{ id: "emirate", label: "Emirate", type: "text", placeholder: "Enter emirate" },
	{ id: "area", label: "Area", type: "text", placeholder: "Enter area" },
	{ id: "officeLocation", label: "Office Location", type: "text", placeholder: "Enter office location" },
	{ id: "website", label: "Website", type: "text", placeholder: "Enter website" },
	{ id: "sector", label: "Sector", type: "text", placeholder: "Enter sector" },
] as const;

const focalPersonFields = [
	{ id: "name", label: "Name", type: "text", placeholder: "Enter focal person name" },
	{ id: "position", label: "Position", type: "text", placeholder: "Enter position" },
	{ id: "department", label: "Department", type: "text", placeholder: "Enter department" },
	{ id: "email", label: "Email", type: "email", placeholder: "Enter email" },
	{ id: "officePhone", label: "Office Phone", type: "tel", placeholder: "Enter office phone" },
	{ id: "mobilePhone", label: "Mobile Phone", type: "tel", placeholder: "Enter mobile phone" },
] as const;

export default function AddCustomerForm({ submitLabel = "Add Customer", mode = "create", customerId }: AddCustomerFormProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [companyForm, setCompanyForm] = useState<CompanyFormState>(createEmptyCompanyForm());
	const [focalPersons, setFocalPersons] = useState<FocalPersonFormValue[]>([createEmptyFocalPerson()]);
	const [generatedCustomerId, setGeneratedCustomerId] = useState("");
	const [generatedCustomerDate, setGeneratedCustomerDate] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGeneratingCustomerId, setIsGeneratingCustomerId] = useState(false);
	const [isLoadingCustomer, setIsLoadingCustomer] = useState(mode === "edit");

	useEffect(() => {
		if (mode !== "edit" || !customerId) {
			setErrorMessage("");
			setIsLoadingCustomer(false);
			return;
		}

		let isMounted = true;

		async function loadCustomer() {
			const resolvedCustomerId = customerId ?? "";
			setErrorMessage("");
			setIsLoadingCustomer(true);

			try {
				const response = await apiFetch(`/customers/${encodeURIComponent(resolvedCustomerId)}`, {
					cache: "no-store",
				});
				const payload = (await response.json()) as CustomerRecord & { detail?: string };

				if (!response.ok) {
					throw new Error(payload.detail ?? "Unable to load that customer.");
				}

				if (!isMounted) {
					return;
				}

				setGeneratedCustomerId(String(payload.customerId ?? ""));
				setGeneratedCustomerDate(String(payload.customerIdDate ?? ""));
				setCompanyForm({
					companyName: String(payload.companyName ?? ""),
					emirate: String(payload.companyEmirate ?? ""),
					area: String(payload.area ?? ""),
					officeLocation: String(payload.officeAddress ?? ""),
					website: String(payload.website ?? ""),
					sector: String(payload.sector ?? ""),
				});
				setFocalPersons(
					Array.isArray(payload.focalPersons) && payload.focalPersons.length > 0
						? payload.focalPersons.map((focalPerson) => ({
							name: String(focalPerson.name ?? ""),
							position: String(focalPerson.position ?? ""),
							department: String(focalPerson.department ?? ""),
							email: String(focalPerson.email ?? ""),
							officePhone: String(focalPerson.officePhone ?? ""),
							mobilePhone: String(focalPerson.mobilePhone ?? ""),
							hasUserAccount: Boolean(focalPerson.hasUserAccount),
						}))
						: [createEmptyFocalPerson()],
				);
			} catch (error) {
				if (isMounted) {
					setErrorMessage(error instanceof Error ? error.message : "Unable to load that customer.");
				}
			} finally {
				if (isMounted) {
					setIsLoadingCustomer(false);
				}
			}
		}

		void loadCustomer();

		return () => {
			isMounted = false;
		};
	}, [customerId, mode]);

	async function handleGenerateCustomerId() {
		setErrorMessage("");
		setIsGeneratingCustomerId(true);

		try {
			const response = await apiFetch("/customers/next-id", {
				cache: "no-store",
			});
			const payload = (await response.json()) as { detail?: string; customerId?: string };

			if (!response.ok || !payload.customerId) {
				throw new Error(payload.detail ?? "Unable to generate a customer ID right now.");
			}

			setGeneratedCustomerId(payload.customerId);
			setGeneratedCustomerDate(formatDateForDisplay(new Date()));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to generate a customer ID right now.");
		} finally {
			setIsGeneratingCustomerId(false);
		}
	}

	function handleCompanyFieldChange(event: ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		setCompanyForm((current) => ({
			...current,
			[name]: value,
		}));
	}

	function handleFocalPersonChange(index: number, field: keyof FocalPersonFormValue, value: string) {
		setFocalPersons((current) => current.map((focalPerson, focalPersonIndex) => (
			focalPersonIndex === index
				? {
					...focalPerson,
					[field]: value,
				}
				: focalPerson
		)));
	}

	function handleAddFocalPerson() {
		setFocalPersons((current) => [...current, createEmptyFocalPerson()]);
	}

	function handleRemoveFocalPerson(index: number) {
		setFocalPersons((current) => (current.length > 1 ? current.filter((_, focalPersonIndex) => focalPersonIndex !== index) : current));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");

		if (!generatedCustomerId || !generatedCustomerDate) {
			setErrorMessage(mode === "edit" ? "Customer details are still loading." : "Generate a customer ID before submitting.");
			return;
		}

		const normalizedFocalPersons = focalPersons.map((focalPerson) => ({
			name: focalPerson.name.trim(),
			position: focalPerson.position.trim(),
			department: focalPerson.department.trim(),
			email: focalPerson.email.trim(),
			officePhone: focalPerson.officePhone.trim(),
			mobilePhone: focalPerson.mobilePhone.trim(),
		}));

		if (normalizedFocalPersons.some((focalPerson) => !Object.values(focalPerson).every(Boolean))) {
			setErrorMessage("Every focal person must be completed before submitting.");
			return;
		}

		const focalPersonEmails = normalizedFocalPersons.map((focalPerson) => focalPerson.email.toLowerCase());
		if (new Set(focalPersonEmails).size !== focalPersonEmails.length) {
			setErrorMessage("Each focal person email must be unique within the customer record.");
			return;
		}

		setIsSubmitting(true);

		try {
			const endpoint = mode === "edit" ? `/customers/${encodeURIComponent(generatedCustomerId)}` : "/customers";
			const response = await apiFetch(endpoint, {
				method: mode === "edit" ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					customerIdDate: generatedCustomerDate,
					customerId: generatedCustomerId,
					companyName: companyForm.companyName.trim(),
					emirate: companyForm.emirate.trim(),
					area: companyForm.area.trim(),
					officeLocation: companyForm.officeLocation.trim(),
					website: companyForm.website.trim(),
					sector: companyForm.sector.trim(),
					focalPersons: normalizedFocalPersons,
				}),
			});

			const payload = (await response.json()) as { detail?: string };

			if (!response.ok) {
				setErrorMessage(payload.detail ?? `Unable to ${mode === "edit" ? "update" : "add"} that customer right now.`);
				return;
			}

			router.push(pathname.includes("/employee/") ? "/employee/customers" : "/admin/customers");
			router.refresh();
		} catch {
			setErrorMessage("Unable to reach the backend. Check that the API is running.");
		} finally {
			setIsSubmitting(false);
		}
	}

	const isEditMode = mode === "edit";

	return (
		<form className="flex w-full max-w-4xl flex-col gap-5 p-6" onSubmit={handleSubmit}>
			{errorMessage ? (
				<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 1</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Company Information</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					{companyFields.map((field) => (
						<label key={field.id} className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">{field.label}</span>
							<input
								id={field.id}
								name={field.id}
								type={field.type}
								required
								value={companyForm[field.id]}
								onChange={handleCompanyFieldChange}
								inputMode={field.id === "website" ? "url" : undefined}
								pattern={field.id === "website" ? "^(www\.)?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$" : undefined}
								title={field.id === "website" ? "Enter a website like co1.com or www.co1.com" : undefined}
								placeholder={field.placeholder}
								className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 2</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Focal Persons</h2>
				</div>

				<p className="text-sm leading-6 text-slate-600">
					The first focal person becomes the main company contact shown in customer listings. Additional focal persons can later be registered as separate customer users from the Add User flow.
				</p>

				<div className="flex flex-col gap-5">
					{focalPersons.map((focalPerson, index) => (
						<div key={`focal-person-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
							<div className="mb-4 flex items-start justify-between gap-3">
								<div className="flex flex-col gap-1">
									<h3 className="text-lg font-medium text-slate-950">{`Focal Person ${index + 1}`}</h3>
									{focalPerson.hasUserAccount ? (
										<p className="text-sm text-slate-500">A customer user is already registered for this focal person.</p>
									) : null}
								</div>
								<Button type="button" variant="secondary" size="sm" onClick={() => handleRemoveFocalPerson(index)} disabled={focalPersons.length === 1}>
									Remove
								</Button>
							</div>

							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								{focalPersonFields.map((field) => (
									<label key={`${field.id}-${index + 1}`} className="flex flex-col gap-1.5">
										<span className="text-sm font-medium text-slate-700">{field.label}</span>
										<input
											id={`${field.id}-${index + 1}`}
											name={`${field.id}-${index + 1}`}
											type={field.type}
											required
											value={focalPerson[field.id]}
											onChange={(event) => handleFocalPersonChange(index, field.id, event.target.value)}
											placeholder={field.placeholder}
											className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
										/>
									</label>
								))}
							</div>
						</div>
					))}
				</div>

				<div className="flex justify-start">
					<Button type="button" variant="secondary" onClick={handleAddFocalPerson}>
						Add Focal Person
					</Button>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 3</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Customer ID</h2>
				</div>

				<div className="flex flex-col gap-4 md:flex-row md:items-end">
					<label className="flex flex-1 flex-col gap-1.5">
						<input
							id="customerId"
							name="customerId"
							type="text"
							value={generatedCustomerId}
							readOnly
							placeholder="CID-0001"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>

					{isEditMode ? null : (
						<Button type="button" variant="secondary" onClick={() => void handleGenerateCustomerId()} disabled={isGeneratingCustomerId}>
							{isGeneratingCustomerId ? "Generating..." : "Generate CID"}
						</Button>
					)}
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">CID Date</span>
					<input
						id="customerIdDate"
						name="customerIdDate"
						type="text"
						value={generatedCustomerDate}
						readOnly
						placeholder="19-04-2026"
						className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>
			</section>

			<div className="flex justify-center pt-2">
				<Button type="submit" disabled={isSubmitting || isGeneratingCustomerId || isLoadingCustomer || !generatedCustomerId || !generatedCustomerDate}>
					{isSubmitting ? (isEditMode ? "Saving Customer..." : "Saving Customer...") : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function createEmptyCompanyForm(): CompanyFormState {
	return {
		companyName: "",
		emirate: "",
		area: "",
		officeLocation: "",
		website: "",
		sector: "",
	};
}

function createEmptyFocalPerson(): FocalPersonFormValue {
	return {
		name: "",
		position: "",
		department: "",
		email: "",
		officePhone: "",
		mobilePhone: "",
	};
}

