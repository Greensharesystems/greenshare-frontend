"use client";

import type { ChangeEvent, FocusEvent, FormEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/app/components/ui/Button";
import useAuth from "@/app/hooks/useAuth";
import { apiFetch } from "@/app/utils/api";
import { formatDateForDisplay, normalizeDateString } from "@/app/utils/dateFormat";

type CustomerRecord = Readonly<{
	customerId?: string;
	cid?: string;
	companyName?: string;
	company_name?: string;
	companyEmirate?: string;
	emirate?: string;
	officeAddress?: string;
	office_address?: string;
	officeLocation?: string;
	office_location?: string;
	contactPersonName?: string;
	focal_person_name?: string;
	name?: string;
	contactPersonEmail?: string;
	companyEmail?: string;
	company_email?: string;
	email?: string;
	contactPersonOfficePhone?: string;
	officePhone?: string;
	office_phone?: string;
}>;

type AddReceptionNoteFormProps = Readonly<{
	submitLabel?: string;
	mode?: "create" | "edit";
	rnid?: string;
}>;

type ReceptionNoteRecord = Readonly<{
	rnidDate?: string;
	rnid?: string;
	customerId?: string;
	producingCompanyName?: string;
	producingCompanyEmirate?: string;
	producingCompanyOfficeAddress?: string;
	producingCompanyContactPerson?: string;
	producingCompanyOfficePhone?: string;
	producingCompanyEmail?: string;
	referringCompany?: string | null;
	projectName?: string | null;
	projectNumber?: string | null;
	projectLocation?: string | null;
	projectCustomFields?: Array<{ field_title?: string; field_value?: string; title?: string; inputValue?: string }> | null;
	transportingCompanyName?: string;
	transportingCompanyContactPerson?: string;
	transportingCompanyOfficePhone?: string;
	transportingCompanyEmail?: string;
	wasteStreams?: ReceptionNoteWasteStream[];
	vehiclePlateNo?: string;
	driverName?: string;
	wasteStreamName?: string;
	wasteStreamQuantity?: string;
	rnIssuedBy?: string;
	status?: string;
}>;

type ReceptionNoteWasteStream = Readonly<{
	code?: string;
	name?: string;
	wasteClass?: string;
	physicalState?: string;
	quantity?: string;
	quantityUnit?: string;
	receptionDate?: string;
	collectionEmirate?: string;
	collectionLocation?: string;
}>;

const producingCompanyFields = [
	{ id: "producingCompanyName", label: "Company Name" },
	{ id: "producingCompanyEmirate", label: "Emirate" },
	{ id: "producingCompanyOfficeAddress", label: "Office Address" },
	{ id: "producingCompanyContactPerson", label: "Contact Person" },
	{ id: "producingCompanyOfficePhone", label: "Office Phone" },
	{ id: "producingCompanyEmail", label: "Email" },
] as const;

const transportingCompanyFields = [
	{ id: "transportingCompanyName", label: "Company Name" },
	{ id: "transportingCompanyContactPerson", label: "Contact Person" },
	{ id: "transportingCompanyOfficePhone", label: "Office Phone" },
	{ id: "transportingCompanyEmail", label: "Email" },
] as const;

const wasteStreamFields = [
	{ id: "code", label: "Code", type: "text", placeholder: "Enter waste stream code" },
	{ id: "name", label: "Name", type: "text", placeholder: "Enter waste stream name" },
] as const;

const emptyProducingCompany = {
	companyName: "",
	emirate: "",
	officeAddress: "",
	contactPerson: "",
	officePhone: "",
	email: "",
};

export default function AddReceptionNoteForm({
	submitLabel = "Add Reception Note",
	mode = "create",
	rnid = "",
}: AddReceptionNoteFormProps) {
	const router = useRouter();
	const { session } = useAuth();
	const isEditMode = mode === "edit";
	const [cid, setCid] = useState("");
	const [producingCompany, setProducingCompany] = useState(emptyProducingCompany);
	const [customerLookupMessage, setCustomerLookupMessage] = useState("");
	const [isFetchingCustomer, setIsFetchingCustomer] = useState(false);
	const sessionIssuedBy = session?.role === "employee" || session?.role === "admin" ? session.displayName : "";
	const [generatedRnid, setGeneratedRnid] = useState("");
	const [generatedRnidDate, setGeneratedRnidDate] = useState("");
	const [wasteStreams] = useState([0]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoadingReceptionNote, setIsLoadingReceptionNote] = useState(isEditMode);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGeneratingRnid, setIsGeneratingRnid] = useState(false);
	const [referringCompany, setReferringCompany] = useState("");
	const [projectName, setProjectName] = useState("");
	const [projectNumber, setProjectNumber] = useState("");
	const [projectLocation, setProjectLocation] = useState("");
	const [customProjectFields, setCustomProjectFields] = useState<Array<{ id: number; title: string; inputValue: string }>>([]);
	const [nextCustomFieldId, setNextCustomFieldId] = useState(0);
	const [editDefaults, setEditDefaults] = useState<ReceptionNoteRecord>({});
	const issuedBy = isEditMode ? String(editDefaults.rnIssuedBy ?? sessionIssuedBy) : sessionIssuedBy;
	const tablePath = session?.role === "admin" ? "/admin/traceability/reception-notes" : "/employee/reception-notes";

	useEffect(() => {
		if (!isEditMode) {
			setIsLoadingReceptionNote(false);
			return;
		}

		const normalizedRnid = rnid.trim();
		if (!normalizedRnid) {
			setErrorMessage("A valid reception note ID is required for editing.");
			setIsLoadingReceptionNote(false);
			return;
		}

		let isCurrent = true;
		setIsLoadingReceptionNote(true);
		setErrorMessage("");

		async function loadReceptionNoteForEdit() {
			try {
				const response = await apiFetch(`/reception-notes/${encodeURIComponent(normalizedRnid)}`, {
					cache: "no-store",
				});
				const payload = (await response.json()) as ReceptionNoteRecord | { detail?: string };

				if (!response.ok) {
					throw new Error("detail" in payload ? (payload.detail ?? "Unable to load that reception note.") : "Unable to load that reception note.");
				}

				if (!isCurrent) return;

				const receptionNote = payload as ReceptionNoteRecord;
				const projectFields = Array.isArray(receptionNote.projectCustomFields)
					? receptionNote.projectCustomFields.map((field, index) => ({
						id: index,
						title: String(field.field_title ?? field.title ?? ""),
						inputValue: String(field.field_value ?? field.inputValue ?? ""),
					}))
					: [];

				setEditDefaults(receptionNote);
				setCid(String(receptionNote.customerId ?? ""));
				setGeneratedRnid(String(receptionNote.rnid ?? ""));
				setGeneratedRnidDate(String(receptionNote.rnidDate ?? ""));
				setProducingCompany({
					companyName: String(receptionNote.producingCompanyName ?? ""),
					emirate: String(receptionNote.producingCompanyEmirate ?? ""),
					officeAddress: String(receptionNote.producingCompanyOfficeAddress ?? ""),
					contactPerson: String(receptionNote.producingCompanyContactPerson ?? ""),
					officePhone: String(receptionNote.producingCompanyOfficePhone ?? ""),
					email: String(receptionNote.producingCompanyEmail ?? ""),
				});
				setReferringCompany(String(receptionNote.referringCompany ?? ""));
				setProjectName(String(receptionNote.projectName ?? ""));
				setProjectNumber(String(receptionNote.projectNumber ?? ""));
				setProjectLocation(String(receptionNote.projectLocation ?? ""));
				setCustomProjectFields(projectFields);
				setNextCustomFieldId(projectFields.length);
			} catch (error) {
				if (isCurrent) {
					setErrorMessage(error instanceof Error ? error.message : "Unable to load that reception note.");
				}
			} finally {
				if (isCurrent) {
					setIsLoadingReceptionNote(false);
				}
			}
		}

		void loadReceptionNoteForEdit();

		return () => {
			isCurrent = false;
		};
	}, [isEditMode, rnid]);

	function handleCidChange(event: ChangeEvent<HTMLInputElement>) {
		const nextCid = event.target.value.toUpperCase();
		setErrorMessage("");
		setCustomerLookupMessage("");
		setGeneratedRnid("");
		setGeneratedRnidDate("");
		setCid(nextCid);

		if (!normalizeCustomerId(nextCid)) {
			setProducingCompany(emptyProducingCompany);
		}
	}

	async function fetchCustomerProducingCompany(normalizedCustomerId: string) {
		const response = await apiFetch(`/customers/${encodeURIComponent(normalizedCustomerId)}`, {
			cache: "no-store",
		});

		if (response.status === 404) {
			setCustomerLookupMessage("No customer found for this CID.");
			return null;
		}

		if (!response.ok) {
			throw new Error(`Customer lookup failed with status ${response.status}.`);
		}

		const customer = (await response.json()) as CustomerRecord;
		return mapCustomerToProducingCompany(customer);
	}

	async function lookupCustomerByCid(normalizedCustomerId: string) {
		setIsFetchingCustomer(true);
		setCustomerLookupMessage("");

		try {
			const nextProducingCompany = await fetchCustomerProducingCompany(normalizedCustomerId);
			setProducingCompany(nextProducingCompany ?? emptyProducingCompany);
			return nextProducingCompany;
		} catch (error) {
			console.error("Unable to fetch customer details for reception note CID lookup.", error);
			setProducingCompany(emptyProducingCompany);
			setCustomerLookupMessage("Unable to fetch customer details.");
			return null;
		} finally {
			setIsFetchingCustomer(false);
		}
	}

	async function handleCidBlur() {
		const normalizedCustomerId = normalizeCustomerId(cid);

		if (!normalizedCustomerId) {
			setCustomerLookupMessage("");
			setProducingCompany(emptyProducingCompany);
			return;
		}

		await lookupCustomerByCid(normalizedCustomerId);
	}

	async function handleGenerateRnid() {
		setErrorMessage("");

		const normalizedCustomerId = normalizeCustomerId(cid);

		if (!normalizedCustomerId) {
			setErrorMessage("Enter a valid customer ID before generating an RNID.");
			return;
		}

		setIsGeneratingRnid(true);

		try {
			const response = await apiFetch(
				`/reception-notes/next-id?customerId=${encodeURIComponent(normalizedCustomerId)}`,
				{
					cache: "no-store",
				},
			);
			const payload = (await response.json()) as { detail?: string; rnid?: string };

			if (!response.ok || !payload.rnid) {
				throw new Error(payload.detail ?? "Unable to generate a reception note ID right now.");
			}

			setGeneratedRnid(payload.rnid);
			setGeneratedRnidDate(formatDateForDisplay(new Date()));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to generate a reception note ID right now.");
		} finally {
			setIsGeneratingRnid(false);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");

		if (!generatedRnid || !generatedRnidDate) {
			setErrorMessage("Generate an RNID before submitting.");
			return;
		}

		if (!issuedBy) {
			setErrorMessage("Only an admin or employee session can save a reception note.");
			return;
		}

		const formData = new FormData(event.currentTarget);
		const primaryWasteStreamIndex = wasteStreams[0];
		const wasteStreamDetails = wasteStreams.map((streamIndex) => ({
			quantityUnit: String(formData.get(`wasteStreams[${streamIndex}].quantityUnit`) ?? "").trim(),
			code: String(formData.get(`wasteStreams[${streamIndex}].code`) ?? ""),
			name: String(formData.get(`wasteStreams[${streamIndex}].name`) ?? ""),
			wasteClass: String(formData.get(`wasteStreams[${streamIndex}].class`) ?? ""),
			physicalState: String(formData.get(`wasteStreams[${streamIndex}].physicalState`) ?? ""),
			quantity: formatWasteStreamQuantity(
				String(formData.get(`wasteStreams[${streamIndex}].quantity`) ?? ""),
				String(formData.get(`wasteStreams[${streamIndex}].quantityUnit`) ?? ""),
			),
			receptionDate: String(formData.get(`wasteStreams[${streamIndex}].receptionDate`) ?? "").trim(),
			collectionEmirate: String(formData.get(`wasteStreams[${streamIndex}].collectionEmirate`) ?? ""),
			collectionLocation: String(formData.get(`wasteStreams[${streamIndex}].collectionLocation`) ?? ""),
		}));

		for (let wasteStreamIndex = 0; wasteStreamIndex < wasteStreamDetails.length; wasteStreamIndex += 1) {
			const receptionDate = wasteStreamDetails[wasteStreamIndex].receptionDate;
			if (!receptionDate) {
				continue;
			}

			const normalizedReceptionDate = normalizeDateString(receptionDate);
			if (!normalizedReceptionDate) {
				setErrorMessage(`Waste Stream ${wasteStreamIndex + 1} Reception Date must use DD-MM-YYYY.`);
				return;
			}

			wasteStreamDetails[wasteStreamIndex].receptionDate = normalizedReceptionDate;
		}

		const primaryWasteStream = wasteStreamDetails[0];
		const normalizedCustomerId = normalizeCustomerId(cid);

		if (!normalizedCustomerId) {
			setErrorMessage("Enter a valid customer ID before submitting.");
			return;
		}

		const producingCompanyForSubmit = hasProducingCompanyDetails(producingCompany)
			? producingCompany
			: await lookupCustomerByCid(normalizedCustomerId);

		if (!producingCompanyForSubmit) {
			setErrorMessage("Enter a registered customer ID before submitting.");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await apiFetch(isEditMode ? `/reception-notes/${encodeURIComponent(generatedRnid)}` : "/reception-notes", {
				method: isEditMode ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					rnidDate: generatedRnidDate,
					rnid: generatedRnid,
					customerId: normalizedCustomerId,
					weighBridgeSlipDate: "",
					weighBridgeBillNo: "",
					producingCompanyName: producingCompanyForSubmit.companyName,
					producingCompanyEmirate: producingCompanyForSubmit.emirate,
					producingCompanyOfficeAddress: producingCompanyForSubmit.officeAddress,
					producingCompanyContactPerson: producingCompanyForSubmit.contactPerson,
					producingCompanyOfficePhone: producingCompanyForSubmit.officePhone,
					producingCompanyEmail: producingCompanyForSubmit.email,
					referringCompany: referringCompany.trim() || null,
					projectName: projectName.trim() || null,
					projectNumber: projectNumber.trim() || null,
					projectLocation: projectLocation.trim() || null,
					projectCustomFields: customProjectFields
						.filter((f) => f.title.trim() || f.inputValue.trim())
						.map((f) => ({ field_title: f.title.trim(), field_value: f.inputValue.trim() })),
					transportingCompanyName: String(formData.get("transportingCompanyName") ?? "").trim(),
					transportingCompanyContactPerson: String(formData.get("transportingCompanyContactPerson") ?? "").trim(),
					transportingCompanyOfficePhone: String(formData.get("transportingCompanyOfficePhone") ?? "").trim(),
					transportingCompanyEmail: String(formData.get("transportingCompanyEmail") ?? "").trim(),
					wasteStreams: wasteStreamDetails,
					vehiclePlateNo: String(formData.get("vehiclePlateNo") ?? "").trim(),
					driverName: String(formData.get("driverName") ?? "").trim(),
					wasteStreamName: String(formData.get(`wasteStreams[${primaryWasteStreamIndex}].name`) ?? "").trim(),
					wasteStreamQuantity: primaryWasteStream?.quantity ?? "",
					rnIssuedBy: issuedBy,
					status: "Issued",
				}),
			});
			const payload = (await response.json()) as { detail?: string };

			if (!response.ok) {
				setErrorMessage(payload.detail ?? `Unable to ${isEditMode ? "update" : "add"} that reception note right now.`);
				return;
			}

			router.push(tablePath);
			router.refresh();
		} catch {
			setErrorMessage("Unable to reach the backend. Check that the API is running.");
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleReceptionDateBlur(event: FocusEvent<HTMLInputElement>) {
		const normalizedDate = normalizeDateString(event.target.value);

		if (normalizedDate) {
			event.target.value = normalizedDate;
		}
	}

	function handleReceptionDateCalendarChange(event: ChangeEvent<HTMLInputElement>) {
		const normalizedDate = normalizeDateString(event.target.value);

		if (!normalizedDate) {
			return;
		}

		const container = event.currentTarget.closest("[data-reception-date-field]");
		const textInput = container?.querySelector<HTMLInputElement>('input[data-reception-date-input="true"]');

		if (!textInput) {
			return;
		}

		textInput.value = normalizedDate;
		textInput.dispatchEvent(new Event("input", { bubbles: true }));
		textInput.dispatchEvent(new Event("change", { bubbles: true }));
	}

	function handleOpenReceptionDatePicker(event: MouseEvent<HTMLButtonElement>) {
		const container = event.currentTarget.closest("[data-reception-date-field]");
		const hiddenDateInput = container?.querySelector<HTMLInputElement>('input[data-reception-date-picker="true"]');

		if (!hiddenDateInput) {
			return;
		}

		const pickerInput = hiddenDateInput as HTMLInputElement & { showPicker?: () => void };

		if (typeof pickerInput.showPicker === "function") {
			pickerInput.showPicker();
			return;
		}

		hiddenDateInput.focus();
		hiddenDateInput.click();
	}

	function handleAddCustomProjectField() {
		setCustomProjectFields((prev) => [...prev, { id: nextCustomFieldId, title: "", inputValue: "" }]);
		setNextCustomFieldId((prev) => prev + 1);
	}

	function handleRemoveCustomProjectField(fieldId: number) {
		setCustomProjectFields((prev) => prev.filter((f) => f.id !== fieldId));
	}

	function handleCustomProjectFieldChange(fieldId: number, key: "title" | "inputValue", value: string) {
		setCustomProjectFields((prev) => prev.map((f) => f.id === fieldId ? { ...f, [key]: value } : f));
	}

	if (isLoadingReceptionNote) {
		return (
			<div className="flex w-full max-w-4xl flex-col gap-5 p-6">
				<p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading reception note...</p>
			</div>
		);
	}

	const primaryWasteStreamDefaults = editDefaults.wasteStreams?.[0] ?? {};
	const transportingCompanyDefaults: Record<(typeof transportingCompanyFields)[number]["id"], string> = {
		transportingCompanyName: String(editDefaults.transportingCompanyName ?? ""),
		transportingCompanyContactPerson: String(editDefaults.transportingCompanyContactPerson ?? ""),
		transportingCompanyOfficePhone: String(editDefaults.transportingCompanyOfficePhone ?? ""),
		transportingCompanyEmail: String(editDefaults.transportingCompanyEmail ?? ""),
	};

	return (
		<form className="flex w-full max-w-4xl flex-col gap-5 p-6" onSubmit={handleSubmit}>
			{errorMessage ? (
				<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 1</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Traceability Details</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">CID (Customer ID)</span>
						<input
							id="cid"
							name="cid"
							type="text"
							value={cid}
							onChange={handleCidChange}
							onBlur={handleCidBlur}
							readOnly={isEditMode}
							placeholder="Enter customer ID"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
						{isFetchingCustomer ? (
							<span className="text-xs text-slate-500">Fetching customer details...</span>
						) : null}
						{customerLookupMessage ? (
							<span className="text-xs text-rose-600">{customerLookupMessage}</span>
						) : null}
					</label>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 2</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Producing Company</h2>
				</div>
				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					{producingCompanyFields.map((field) => (
						<label key={field.id} className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">{field.label}</span>
							<input
								id={field.id}
								name={field.id}
								type="text"
								value={producingCompany[toProducingCompanyKey(field.id)]}
								readOnly
								placeholder={`Auto-filled ${field.label.toLowerCase()}`}
								className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					))}
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Referring Company</span>
						<input
							id="referringCompany"
							name="referringCompany"
							type="text"
							value={referringCompany}
							onChange={(e) => setReferringCompany(e.target.value)}
							placeholder="Enter referring company"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 2.1</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Project Details</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Project Name</span>
						<input
							id="projectName"
							name="projectName"
							type="text"
							value={projectName}
							onChange={(e) => setProjectName(e.target.value)}
							placeholder="Enter project name"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Project Number</span>
						<input
							id="projectNumber"
							name="projectNumber"
							type="text"
							value={projectNumber}
							onChange={(e) => setProjectNumber(e.target.value)}
							placeholder="Enter project number"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>
					<label className="flex flex-col gap-1.5 md:col-span-2">
						<span className="text-sm font-medium text-slate-700">Project Location</span>
						<input
							id="projectLocation"
							name="projectLocation"
							type="text"
							value={projectLocation}
							onChange={(e) => setProjectLocation(e.target.value)}
							placeholder="Enter project location"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>
				</div>

				{customProjectFields.length > 0 ? (
					<div className="flex flex-col gap-3">
						{customProjectFields.map((field) => (
							<div key={field.id} className="flex items-end gap-3">
								<label className="flex flex-1 flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Field Title</span>
									<input
										type="text"
										value={field.title}
										onChange={(e) => handleCustomProjectFieldChange(field.id, "title", e.target.value)}
										placeholder="e.g. PO Number"
										className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>
								<label className="flex flex-1 flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Field Input</span>
									<input
										type="text"
										value={field.inputValue}
										onChange={(e) => handleCustomProjectFieldChange(field.id, "inputValue", e.target.value)}
										placeholder="Enter value"
										className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>
								<button
									type="button"
									onClick={() => handleRemoveCustomProjectField(field.id)}
									className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100"
									aria-label="Remove field"
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
								</button>
							</div>
						))}
					</div>
				) : null}

				<div>
					<Button type="button" variant="secondary" onClick={handleAddCustomProjectField}>
						+ Add a Field
					</Button>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 3</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Transporting Company</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					{transportingCompanyFields.map((field) => (
						<label key={field.id} className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">{field.label}</span>
							<input
								id={field.id}
								name={field.id}
								type={field.id.includes("Email") ? "email" : "text"}
								defaultValue={transportingCompanyDefaults[field.id]}
								placeholder={`Enter ${field.label.toLowerCase()}`}
								className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 4</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Vehicle Details</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Vehicle Plate No.</span>
						<input
							id="vehiclePlateNo"
							name="vehiclePlateNo"
							type="text"
							defaultValue={String(editDefaults.vehiclePlateNo ?? "")}
							placeholder="Enter vehicle plate number"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Driver Name</span>
						<input
							id="driverName"
							name="driverName"
							type="text"
							defaultValue={String(editDefaults.driverName ?? "")}
							placeholder="Enter driver name"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 5</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Waste Stream Details</h2>
				</div>

				<div className="flex flex-col gap-5">
					{wasteStreams.map((streamIndex) => (
						<div key={streamIndex} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								{wasteStreamFields.map((field) => (
									<label key={`${field.id}-${streamIndex}`} className="flex flex-col gap-1.5">
										<span className="text-sm font-medium text-slate-700">{field.label}</span>
										<input
											id={`${field.id}-${streamIndex}`}
											name={`wasteStreams[${streamIndex}].${field.id}`}
											type={field.type}
											defaultValue={String(primaryWasteStreamDefaults[field.id] ?? "")}
											placeholder={field.placeholder}
											className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
										/>
									</label>
								))}

								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Class</span>
									<select
										name={`wasteStreams[${streamIndex}].class`}
										defaultValue={String(primaryWasteStreamDefaults.wasteClass ?? "")}
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									>
										<option value="" disabled>Select class</option>
										<option value="Hazardous">Hazardous</option>
										<option value="Non Hazardous">Non Hazardous</option>
									</select>
								</label>

								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Physical State</span>
									<select
										name={`wasteStreams[${streamIndex}].physicalState`}
										defaultValue={String(primaryWasteStreamDefaults.physicalState ?? "")}
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									>
										<option value="" disabled>Select physical state</option>
										<option value="Solid">Solid</option>
										<option value="Liquid">Liquid</option>
										<option value="Semi Solid">Semi Solid</option>
									</select>
								</label>

								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Quantity</span>
									<input
										name={`wasteStreams[${streamIndex}].quantity`}
										type="text"
										defaultValue={String(primaryWasteStreamDefaults.quantity ?? "")}
										placeholder="Enter waste stream quantity"
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>

								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Quantity Unit</span>
									<select
										name={`wasteStreams[${streamIndex}].quantityUnit`}
										defaultValue={String(primaryWasteStreamDefaults.quantityUnit ?? "")}
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									>
										<option value="" disabled>Select quantity unit</option>
										<option value="Kgs">Kgs</option>
										<option value="Tons">Tons</option>
										<option value="Liters">Liters</option>
										<option value="Metric Tons">Metric Tons</option>
									</select>
								</label>

								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Collection Emirate</span>
									<select
										name={`wasteStreams[${streamIndex}].collectionEmirate`}
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
										defaultValue={String(primaryWasteStreamDefaults.collectionEmirate ?? "")}
									>
										<option value="" disabled>Select collection emirate</option>
										<option value="Abu Dhabi">Abu Dhabi</option>
										<option value="Dubai">Dubai</option>
										<option value="Sharjah">Sharjah</option>
										<option value="Ajman">Ajman</option>
										<option value="Umm Al Quwain">Umm Al Quwain</option>
										<option value="Ras Al Khaimah">Ras Al Khaimah</option>
										<option value="Fujairah">Fujairah</option>
									</select>
								</label>

								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Collection Location</span>
									<input
										name={`wasteStreams[${streamIndex}].collectionLocation`}
										type="text"
										defaultValue={String(primaryWasteStreamDefaults.collectionLocation ?? "")}
										placeholder="Enter collection location"
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>

								<label className="flex flex-col gap-1.5" data-reception-date-field>
									<span className="text-sm font-medium text-slate-700">Reception Date</span>
									<div className="relative">
										<input
											name={`wasteStreams[${streamIndex}].receptionDate`}
											data-reception-date-input="true"
											type="text"
											defaultValue={String(primaryWasteStreamDefaults.receptionDate ?? "")}
											inputMode="numeric"
											autoComplete="off"
											placeholder="19-04-2026"
											pattern="\d{2}-\d{2}-\d{4}"
											onBlur={handleReceptionDateBlur}
											className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
										/>
										<input
											data-reception-date-picker="true"
											type="date"
											tabIndex={-1}
											aria-hidden="true"
											onChange={handleReceptionDateCalendarChange}
											className="pointer-events-none absolute h-0 w-0 opacity-0"
										/>
										<button
											type="button"
											onClick={handleOpenReceptionDatePicker}
											className="absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center rounded-xl text-slate-600 transition hover:text-[#36B44D] focus:outline-none focus:ring-4 focus:ring-[#36B44D]/20"
											aria-label="Open reception date calendar"
										>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
												<path d="M7 2v4M17 2v4M3 9h18" strokeLinecap="round" strokeLinejoin="round" />
												<rect x="3" y="5" width="18" height="16" rx="2" />
											</svg>
										</button>
									</div>
								</label>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 6</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Reception Note Verification</h2>
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">Issued by</span>
					<input
						id="issuedBy"
						name="issuedBy"
						type="text"
						value={issuedBy}
						readOnly
						placeholder="Employee name"
						className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 7</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Reception Note ID</h2>
				</div>

				<div className="flex flex-col gap-4 md:flex-row md:items-end">
					<label className="flex flex-1 flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">RNID</span>
						<input
							id="rnid"
							name="rnid"
							type="text"
							value={generatedRnid}
							readOnly
							placeholder="RNID-0004-0001"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>

					{isEditMode ? null : (
						<Button type="button" variant="secondary" onClick={handleGenerateRnid} disabled={!normalizeCustomerId(cid) || isGeneratingRnid}>
							{isGeneratingRnid ? "Generating..." : "Generate RNID"}
						</Button>
					)}
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">RNID Date</span>
					<input
						id="rnidDate"
						name="rnidDate"
						type="text"
						value={generatedRnidDate}
						readOnly
						placeholder="19-04-2026"
						className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>
			</section>

			<div className="flex justify-center pt-2">
				<Button type="submit" disabled={!generatedRnid || !generatedRnidDate || isSubmitting}>
					{isSubmitting ? "Saving..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function toProducingCompanyKey(fieldId: (typeof producingCompanyFields)[number]["id"]) {
	const keyMap = {
		producingCompanyName: "companyName",
		producingCompanyEmirate: "emirate",
		producingCompanyOfficeAddress: "officeAddress",
		producingCompanyContactPerson: "contactPerson",
		producingCompanyOfficePhone: "officePhone",
		producingCompanyEmail: "email",
	} as const;

	return keyMap[fieldId];
}

function mapCustomerToProducingCompany(customer: CustomerRecord) {
	return {
		companyName: getCustomerField(customer.companyName, customer.company_name),
		emirate: getCustomerField(customer.companyEmirate, customer.emirate),
		officeAddress: getCustomerField(customer.officeAddress, customer.officeLocation, customer.office_address, customer.office_location),
		contactPerson: getCustomerField(customer.contactPersonName, customer.focal_person_name, customer.name),
		officePhone: getCustomerField(customer.officePhone, customer.office_phone, customer.contactPersonOfficePhone),
		email: getCustomerField(customer.companyEmail, customer.company_email, customer.email, customer.contactPersonEmail),
	};
}

function getCustomerField(...values: Array<string | undefined>) {
	return values.map((value) => String(value ?? "").trim()).find(Boolean) ?? "";
}

function hasProducingCompanyDetails(producingCompany: typeof emptyProducingCompany) {
	return Object.values(producingCompany).some((value) => value.trim());
}

function normalizeCustomerId(cid: string) {
	const digits = cid.replace(/\D/g, "");

	if (!digits) {
		return null;
	}

	return `CID-${digits.padStart(4, "0")}`;
}

function formatWasteStreamQuantity(quantity: string, quantityUnit: string) {
	const normalizedQuantity = quantity.trim();
	const normalizedQuantityUnit = quantityUnit.trim();

	return [normalizedQuantity, normalizedQuantityUnit].filter(Boolean).join(" ");
}
