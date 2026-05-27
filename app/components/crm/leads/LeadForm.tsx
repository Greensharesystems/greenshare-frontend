"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import Button from "@/app/components/ui/Button";
import { searchCustomers } from "@/app/services/customers.service";

export type LeadFormData = Readonly<{
	cid: string;
	customerName: string;
	source: string;
	otherSource: string;
	transporterName: string;
	referralName: string;
	assignedTo: string;
	assignedPersonName: string;
	wasteStream: string;
	wasteClass: "Hazardous" | "Non Hazardous" | "Others";
	otherWasteClass: string;
	estimatedQuantity: string;
	unit: string;
	otherUnit: string;
	leadId: string;
	leadDate: string;
	comments: string;
}>;

type CustomerOption = Readonly<{
	cid: string;
	customerName: string;
}>;

type LeadFormState = {
	cid: string;
	customerName: string;
	source: string;
	otherSource: string;
	transporterName: string;
	referralName: string;
	assignedTo: string;
	assignedPersonName: string;
	wasteStream: string;
	wasteClass: "Hazardous" | "Non Hazardous" | "Others" | "";
	otherWasteClass: string;
	estimatedQuantity: string;
	unit: "Tons" | "Kgs" | "Liters" | "Metric Tons" | "Others" | "";
	otherUnit: string;
	leadId: string;
	leadDate: string;
	comments: string;
	selectedCustomerCid: string | null;
};

const SOURCE_OPTIONS = [
	"Dubai South",
	"Dubai Municipality",
	"Transporter",
	"Website",
	"WhatsApp",
	"Call",
	"Database",
	"Email",
	"Referral",
	"Other",
] as const;

const UNIT_OPTIONS = ["Tons", "Kgs", "Liters", "Metric Tons", "Others"] as const;

const ASSIGNEE_OPTIONS = ["Makis Spyartos", "Asul Asokan", "Ashish Hamirani", "Other"] as const;

const INITIAL_FORM_STATE: LeadFormState = {
	cid: "",
	customerName: "",
	source: "",
	otherSource: "",
	transporterName: "",
	referralName: "",
	assignedTo: "",
	assignedPersonName: "",
	wasteStream: "",
	wasteClass: "",
	otherWasteClass: "",
	estimatedQuantity: "",
	unit: "",
	otherUnit: "",
	leadId: "",
	leadDate: "",
	comments: "",
	selectedCustomerCid: null,
};

type LeadFormProps = Readonly<{
	onSubmit: (data: LeadFormData) => Promise<void>;
	onCancel: () => void;
	onGenerateLeadId: () => Promise<string>;
}>;


export default function LeadForm({ onSubmit, onCancel, onGenerateLeadId }: LeadFormProps) {
	const [formState, setFormState] = useState<LeadFormState>(INITIAL_FORM_STATE);
	const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
	const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
	const [isCustomerLookupLoading, setIsCustomerLookupLoading] = useState(false);
	const [showValidation, setShowValidation] = useState(false);
	const [submissionError, setSubmissionError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGeneratingLeadId, setIsGeneratingLeadId] = useState(false);
	const customerSearchCacheRef = useRef(new Map<string, CustomerOption[]>());
	const customerLookupRequestIdRef = useRef(0);

	const isTransporterSource = formState.source === "Transporter";
	const isReferralSource = formState.source === "Referral";
	const isOtherSource = formState.source === "Other";
	const isOtherAssignee = formState.assignedTo === "Other";
	const isOtherWasteClass = formState.wasteClass === "Others";
	const isOtherUnit = formState.unit === "Others";
	const hasCustomerIdentity = Boolean(formState.cid.trim() && formState.customerName.trim());
	const hasGeneratedLead = Boolean(formState.leadId && formState.leadDate);
	const hasEstimatedQuantity = Boolean(formState.estimatedQuantity.trim()) && Number.isFinite(Number(formState.estimatedQuantity));
	const isFormValid =
		hasCustomerIdentity &&
		Boolean(formState.source) &&
		(!isOtherSource || Boolean(formState.otherSource.trim())) &&
		Boolean(formState.assignedTo) &&
		Boolean(formState.wasteStream.trim()) &&
		Boolean(formState.wasteClass) &&
		(!isOtherWasteClass || Boolean(formState.otherWasteClass.trim())) &&
		hasEstimatedQuantity &&
		Boolean(formState.unit) &&
		(!isOtherUnit || Boolean(formState.otherUnit.trim())) &&
		hasGeneratedLead &&
		(!isTransporterSource || Boolean(formState.transporterName.trim())) &&
		(!isReferralSource || Boolean(formState.referralName.trim())) &&
		(!isOtherAssignee || Boolean(formState.assignedPersonName.trim()));

	useEffect(() => {
		const cidQuery = formState.cid.trim().toUpperCase();
		if (!cidQuery) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			void lookupCustomers(cidQuery, (results) => {
				const exactCustomer = results.find((customer) => customer.cid.toLowerCase() === cidQuery.toLowerCase()) ?? null;

				setFormState((current) => {
					if (current.cid.trim().toUpperCase() !== cidQuery) {
						return current;
					}

					if (!exactCustomer) {
						if (current.selectedCustomerCid && current.selectedCustomerCid.toLowerCase() !== cidQuery.toLowerCase()) {
							return {
								...current,
								customerName: "",
								selectedCustomerCid: null,
							};
						}

						return current;
					}

					return {
						...current,
						cid: exactCustomer.cid,
						customerName: exactCustomer.customerName,
						selectedCustomerCid: exactCustomer.cid,
					};
				});
			});
		}, 300);

		return () => window.clearTimeout(timeoutId);
	}, [formState.cid]);

	useEffect(() => {
		if (!isCustomerMenuOpen) {
			return;
		}

		const nameQuery = formState.customerName.trim();
		if (!nameQuery) {
			setCustomerOptions([]);
			return;
		}

		const timeoutId = window.setTimeout(() => {
			void lookupCustomers(nameQuery, (results) => {
				setCustomerOptions(results);
				const exactCustomer = results.find((customer) => customer.customerName.toLowerCase() === nameQuery.toLowerCase()) ?? null;

				if (!exactCustomer) {
					return;
				}

				setFormState((current) => {
					if (current.customerName.trim().toLowerCase() !== nameQuery.toLowerCase()) {
						return current;
					}

					return {
						...current,
						cid: exactCustomer.cid,
						customerName: exactCustomer.customerName,
						selectedCustomerCid: exactCustomer.cid,
					};
				});
			});
		}, 300);

		return () => window.clearTimeout(timeoutId);
	}, [formState.customerName, isCustomerMenuOpen]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setShowValidation(true);
		setSubmissionError(null);

		if (!isFormValid) {
			return;
		}

		const payload: LeadFormData = {
			cid: formState.cid.trim(),
			customerName: formState.customerName.trim(),
			source: formState.source,
			otherSource: formState.otherSource.trim(),
			transporterName: formState.transporterName.trim(),
			referralName: formState.referralName.trim(),
			assignedTo: formState.assignedTo,
			assignedPersonName: formState.assignedPersonName.trim(),
			wasteStream: formState.wasteStream.trim(),
			wasteClass: formState.wasteClass as LeadFormData["wasteClass"],
			otherWasteClass: formState.otherWasteClass.trim(),
			estimatedQuantity: formState.estimatedQuantity.trim(),
			unit: formState.unit,
			otherUnit: formState.otherUnit.trim(),
			leadId: formState.leadId,
			leadDate: formState.leadDate,
			comments: formState.comments.trim(),
		};

		setIsSubmitting(true);

		try {
			await onSubmit(payload);
			setFormState(INITIAL_FORM_STATE);
			setShowValidation(false);
			setIsCustomerMenuOpen(false);
		} catch (error) {
			setSubmissionError(resolveErrorMessage(error, "Unable to save that lead right now."));
		} finally {
			setIsSubmitting(false);
		}
	}

	function updateField<Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) {
		setFormState((current) => ({
			...current,
			[key]: value,
		}));
	}

	function handleSourceChange(value: string) {
		setFormState((current) => ({
			...current,
			source: value,
			otherSource: value === "Other" ? current.otherSource : "",
			transporterName: value === "Transporter" ? current.transporterName : "",
			referralName: value === "Referral" ? current.referralName : "",
		}));
	}

	function handleUnitChange(value: LeadFormState["unit"]) {
		setFormState((current) => ({
			...current,
			unit: value,
			otherUnit: value === "Others" ? current.otherUnit : "",
		}));
	}

	function handleAssignedToChange(value: string) {
		setFormState((current) => ({
			...current,
			assignedTo: value,
			assignedPersonName: value === "Other" ? current.assignedPersonName : "",
		}));
	}

	function handleWasteClassChange(value: LeadFormState["wasteClass"]) {
		setFormState((current) => ({
			...current,
			wasteClass: value,
			otherWasteClass: value === "Others" ? current.otherWasteClass : "",
		}));
	}

	function handleCidChange(value: string) {
		const normalizedCid = value.toUpperCase();
		setFormState((current) => {
			return {
				...current,
				cid: normalizedCid,
				customerName: current.selectedCustomerCid && current.selectedCustomerCid !== normalizedCid ? "" : current.customerName,
				selectedCustomerCid: current.selectedCustomerCid === normalizedCid ? current.selectedCustomerCid : null,
			};
		});
	}

	function handleCustomerNameChange(value: string) {
		setFormState((current) => {
			return {
				...current,
				customerName: value,
				cid: current.selectedCustomerCid ? "" : current.cid,
				selectedCustomerCid: null,
			};
		});
		setIsCustomerMenuOpen(true);
		setCustomerOptions([]);
	}

	function handleCustomerSelect(customer: CustomerOption) {
		setFormState((current) => ({
			...current,
			cid: customer.cid,
			customerName: customer.customerName,
			selectedCustomerCid: customer.cid,
		}));
		setCustomerOptions([customer]);
		setIsCustomerMenuOpen(false);
	}

	async function lookupCustomers(query: string, onResolved: (results: CustomerOption[]) => void) {
		const normalizedQuery = query.trim();
		if (!normalizedQuery) {
			onResolved([]);
			return;
		}

		const cacheKey = normalizedQuery.toLowerCase();
		const cachedResults = customerSearchCacheRef.current.get(cacheKey);
		if (cachedResults) {
			onResolved(cachedResults);
			return;
		}

		const requestId = ++customerLookupRequestIdRef.current;
		setIsCustomerLookupLoading(true);
		setSubmissionError(null);

		try {
			const results = (await searchCustomers(normalizedQuery)).slice(0, 6);
			customerSearchCacheRef.current.set(cacheKey, results);

			if (requestId === customerLookupRequestIdRef.current) {
				onResolved(results);
			}
		} catch (error) {
			if (requestId === customerLookupRequestIdRef.current) {
				setSubmissionError(resolveErrorMessage(error, "Unable to search customers right now."));
			}
		} finally {
			if (requestId === customerLookupRequestIdRef.current) {
				setIsCustomerLookupLoading(false);
			}
		}
	}

	async function generateLeadId() {
		setSubmissionError(null);
		setIsGeneratingLeadId(true);

		try {
			const nextLeadId = await onGenerateLeadId();
			setFormState((current) => ({
				...current,
				leadId: nextLeadId,
				leadDate: formatLeadDate(new Date()),
			}));
		} catch (error) {
			setSubmissionError(resolveErrorMessage(error, "Unable to generate a Lead ID right now."));
		} finally {
			setIsGeneratingLeadId(false);
		}
	}

	return (
		<form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleSubmit}>
			<div className="space-y-5 px-6 py-6">
				<section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
					<div className="mb-4">
						<h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Customer Details</h3>
						<p className="mt-1 text-sm text-slate-500">Match an existing customer by CID or search by customer name.</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">CID</span>
							<input
								name="cid"
								value={formState.cid}
								onChange={(event) => handleCidChange(event.target.value)}
								placeholder="CID-0001"
								className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>

						<div className="relative flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Customer Name</span>
							<input
								name="customerName"
								value={formState.customerName}
								onChange={(event) => handleCustomerNameChange(event.target.value)}
								onFocus={() => setIsCustomerMenuOpen(true)}
								onBlur={() => window.setTimeout(() => setIsCustomerMenuOpen(false), 120)}
								placeholder="Search customer name"
								className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/20"
							/>
							{isCustomerMenuOpen && (isCustomerLookupLoading || customerOptions.length > 0 || Boolean(formState.customerName.trim())) ? (
								<div className="absolute top-full z-10 mt-2 max-h-52 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
									{isCustomerLookupLoading ? <div className="px-3 py-2 text-sm text-slate-500">Searching customers...</div> : null}
									{!isCustomerLookupLoading && customerOptions.length === 0 ? <div className="px-3 py-2 text-sm text-slate-500">No registered customers found.</div> : null}
									{customerOptions.map((customer) => (
										<button
											key={customer.cid}
											type="button"
											onMouseDown={(event) => {
												event.preventDefault();
												handleCustomerSelect(customer);
											}}
											className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
										>
											<span className="text-sm font-medium text-slate-800">{customer.customerName}</span>
											<span className="text-xs text-slate-500">{customer.cid}</span>
										</button>
									))}
								</div>
							) : null}
						</div>
					</div>
					{showValidation && !hasCustomerIdentity ? (
						<p className="mt-3 text-sm text-rose-600">Select a registered customer so both CID and Customer Name are populated.</p>
					) : null}
				</section>

				<section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/70">
					<div className="mb-4">
						<h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Lead Details</h3>
						<p className="mt-1 text-sm text-slate-500">Complete the lead source, assignment, classification, and notes.</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Source</span>
							<select
								name="source"
								value={formState.source}
								onChange={(event) => handleSourceChange(event.target.value)}
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							>
								<option value="">Select source</option>
								{SOURCE_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</label>

						<div className={`overflow-hidden transition-all duration-200 ${isOtherSource ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-slate-700">Other Source</span>
								<input
									name="otherSource"
									value={formState.otherSource}
									onChange={(event) => updateField("otherSource", event.target.value)}
									placeholder="Enter other source"
									className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
								/>
							</label>
						</div>

						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Assigned To</span>
							<select
								name="assignedTo"
								value={formState.assignedTo}
								onChange={(event) => handleAssignedToChange(event.target.value)}
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							>
								<option value="">Select assignee</option>
								{ASSIGNEE_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</label>

						<div className={`overflow-hidden transition-all duration-200 ${isTransporterSource ? "max-h-24 opacity-100" : "max-h-0 opacity-0 sm:col-span-2"}`}>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-slate-700">Transporter Name</span>
								<input
									name="transporterName"
									value={formState.transporterName}
									onChange={(event) => updateField("transporterName", event.target.value)}
									placeholder="Enter transporter name"
									className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
								/>
							</label>
						</div>

						<div className={`overflow-hidden transition-all duration-200 ${isReferralSource ? "max-h-24 opacity-100" : "max-h-0 opacity-0 sm:col-span-2"}`}>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-slate-700">Referral Name</span>
								<input
									name="referralName"
									value={formState.referralName}
									onChange={(event) => updateField("referralName", event.target.value)}
									placeholder="Enter referral name"
									className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
								/>
							</label>
						</div>

						<div className={`overflow-hidden transition-all duration-200 ${isOtherAssignee ? "max-h-24 opacity-100" : "max-h-0 opacity-0 sm:col-span-2"}`}>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-slate-700">Assigned Person Name</span>
								<input
									name="assignedPersonName"
									value={formState.assignedPersonName}
									onChange={(event) => updateField("assignedPersonName", event.target.value)}
									placeholder="Enter assigned person name"
									className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
								/>
							</label>
						</div>

						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Waste Stream</span>
							<input
								name="wasteStream"
								value={formState.wasteStream}
								onChange={(event) => updateField("wasteStream", event.target.value)}
								placeholder="Enter waste stream"
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>

						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Est. Qty</span>
							<input
								name="estimatedQuantity"
								type="number"
								min="0"
								step="any"
								inputMode="decimal"
								value={formState.estimatedQuantity}
								onChange={(event) => updateField("estimatedQuantity", event.target.value)}
								placeholder="Enter estimated quantity"
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>

						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Unit</span>
							<select
								name="unit"
								value={formState.unit}
								onChange={(event) => handleUnitChange(event.target.value as LeadFormState["unit"])}
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							>
								<option value="">Select unit</option>
								{UNIT_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</label>

						<div className={`overflow-hidden transition-all duration-200 ${isOtherUnit ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-slate-700">Other Unit</span>
								<input
									name="otherUnit"
									value={formState.otherUnit}
									onChange={(event) => updateField("otherUnit", event.target.value)}
									placeholder="Enter other unit"
									className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
								/>
							</label>
						</div>

						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Class</span>
							<select
								name="wasteClass"
								value={formState.wasteClass}
								onChange={(event) => handleWasteClassChange(event.target.value as LeadFormState["wasteClass"])}
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							>
								<option value="">Select class</option>
								<option value="Hazardous">Hazardous</option>
								<option value="Non Hazardous">Non Hazardous</option>
								<option value="Others">Others</option>
							</select>
						</label>

						<div className={`overflow-hidden transition-all duration-200 ${isOtherWasteClass ? "max-h-24 opacity-100" : "max-h-0 opacity-0 sm:col-span-2"}`}>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-slate-700">Other Class</span>
								<input
									name="otherWasteClass"
									value={formState.otherWasteClass}
									onChange={(event) => updateField("otherWasteClass", event.target.value)}
									placeholder="Enter other class"
									className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
								/>
							</label>
						</div>

						<div className="flex flex-col gap-1.5 sm:col-span-2">
							<span className="text-sm font-medium text-slate-700">Lead ID</span>
							<div className="flex flex-col gap-3 sm:flex-row">
								<input
									name="leadId"
									value={formState.leadId}
									readOnly
									placeholder="Generate Lead ID"
									className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
								/>
								<Button type="button" className="min-w-40 justify-center" onClick={generateLeadId} disabled={isGeneratingLeadId || isSubmitting}>
									{isGeneratingLeadId ? "Generating..." : "Generate Lead ID"}
								</Button>
							</div>
						</div>

						<label className="flex flex-col gap-1.5 sm:col-span-2">
							<span className="text-sm font-medium text-slate-700">Date of the Lead</span>
							<input
								name="leadDate"
								value={formState.leadDate}
								readOnly
								placeholder="Generated with Lead ID"
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
							/>
						</label>

						<label className="flex flex-col gap-1.5 sm:col-span-2">
							<span className="text-sm font-medium text-slate-700">Comments</span>
							<textarea
								name="comments"
								rows={5}
								value={formState.comments}
								onChange={(event) => updateField("comments", event.target.value)}
								placeholder="Add lead notes, scope details, and next steps"
								className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					</div>
					{showValidation && !isFormValid ? (
						<p className="mt-4 text-sm text-rose-600">
							Complete all required fields, including generating a Lead ID and any conditional names, before adding the lead.
						</p>
					) : null}
					{submissionError ? <p className="mt-4 text-sm text-rose-600">{submissionError}</p> : null}
				</section>
			</div>

			<div className="mt-auto flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
				<Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting || isGeneratingLeadId}>
					Cancel
				</Button>
				<Button type="submit" disabled={!isFormValid || isSubmitting || isGeneratingLeadId}>
					{isSubmitting ? "Saving..." : "Add Lead"}
				</Button>
			</div>
		</form>
	);
}

function formatLeadDate(date: Date) {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear());

	return `${day}-${month}-${year}`;
}


function resolveErrorMessage(error: unknown, fallbackMessage: string) {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallbackMessage;
}
