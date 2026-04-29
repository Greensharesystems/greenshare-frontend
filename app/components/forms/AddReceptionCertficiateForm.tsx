"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/app/components/ui/Button";
import useAuth from "@/app/hooks/useAuth";
import { apiFetch } from "@/app/utils/api";
import { formatDateForDisplay } from "@/app/utils/dateFormat";

type ReceptionNoteWasteStream = Readonly<{
	code: string;
	name: string;
	wasteClass: string;
	physicalState: string;
	quantity: string;
	quantityUnit: string;
	collectionEmirate: string;
	collectionLocation: string;
	receptionDate: string;
}>;

type ReceptionNoteRecord = Readonly<{
	rnid: string;
	customerId: string;
	producingCompanyName: string;
	producingCompanyEmirate?: string;
	producingCompanyOfficeAddress?: string;
	producingCompanyContactPerson?: string;
	producingCompanyOfficePhone?: string;
	producingCompanyEmail?: string;
	transportingCompanyName?: string;
	transportingCompanyContactPerson?: string;
	transportingCompanyOfficePhone?: string;
	transportingCompanyEmail?: string;
	wasteStreams?: ReadonlyArray<ReceptionNoteWasteStream>;
	vehiclePlateNo?: string;
	driverName?: string;
	status?: string;
}>;

type AddReceptionCertficiateFormProps = Readonly<{
	submitLabel?: string;
}>;

type ProducingCompanyState = {
	companyName: string;
	emirate: string;
	officeAddress: string;
	contactPerson: string;
	officePhone: string;
	email: string;
};

type TransportingCompanyState = {
	companyName: string;
	contactPerson: string;
	officePhone: string;
	email: string;
};

type VehicleDetailsState = {
	vehiclePlateNo: string;
	driverName: string;
};

type LinkedRnidDetailsState = {
	id: number;
	rnid: string;
	customerId: string;
	producingCompany: ProducingCompanyState;
	transportingCompany: TransportingCompanyState;
	vehicleDetails: VehicleDetailsState;
	wasteStreams: ReceptionNoteWasteStream[];
};

const producingCompanyFields = [
	{ key: "companyName", label: "Company Name" },
	{ key: "emirate", label: "Emirate" },
	{ key: "officeAddress", label: "Office Address" },
	{ key: "contactPerson", label: "Contact Person" },
	{ key: "officePhone", label: "Office Phone" },
	{ key: "email", label: "Email" },
] as const;

const transportingCompanyFields = [
	{ key: "companyName", label: "Company Name" },
	{ key: "contactPerson", label: "Contact Person" },
	{ key: "officePhone", label: "Office Phone" },
	{ key: "email", label: "Email" },
] as const;

function emptyProducingCompany(): ProducingCompanyState {
	return {
		companyName: "",
		emirate: "",
		officeAddress: "",
		contactPerson: "",
		officePhone: "",
		email: "",
	};
}

function emptyTransportingCompany(): TransportingCompanyState {
	return {
		companyName: "",
		contactPerson: "",
		officePhone: "",
		email: "",
	};
}

function emptyVehicleDetails(): VehicleDetailsState {
	return {
		vehiclePlateNo: "",
		driverName: "",
	};
}

function blankWasteStream(): ReceptionNoteWasteStream {
	return {
		code: "",
		name: "",
		wasteClass: "",
		physicalState: "",
		quantity: "",
		quantityUnit: "",
		collectionEmirate: "",
		collectionLocation: "",
		receptionDate: "",
	};
}

function blankLinkedRnidDetails(id: number): LinkedRnidDetailsState {
	return {
		id,
		rnid: "",
		customerId: "",
		producingCompany: emptyProducingCompany(),
		transportingCompany: emptyTransportingCompany(),
		vehicleDetails: emptyVehicleDetails(),
		wasteStreams: [blankWasteStream()],
	};
}

export default function AddReceptionCertficiateForm({
	submitLabel = "Add Reception Certificate",
}: AddReceptionCertficiateFormProps) {
	const router = useRouter();
	const { session } = useAuth();
	const [receptionNotes, setReceptionNotes] = useState<ReceptionNoteRecord[]>([]);
	const [linkedRnidDetails, setLinkedRnidDetails] = useState<LinkedRnidDetailsState[]>([blankLinkedRnidDetails(0)]);
	const [generatedRcid, setGeneratedRcid] = useState("");
	const [generatedRcidDate, setGeneratedRcidDate] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGeneratingRcid, setIsGeneratingRcid] = useState(false);
	const issuedBy = session?.role === "employee" ? session.displayName : "";

	useEffect(() => {
		let isMounted = true;

		async function loadReceptionNotes() {
			try {
				const response = await apiFetch("/reception-notes", {
					cache: "no-store",
				});
				const payload = (await response.json()) as ReceptionNoteRecord[];

				if (!response.ok || !Array.isArray(payload) || !isMounted) {
					return;
				}

				setReceptionNotes(payload.filter((note) => normalizeStatus(String(note.status ?? "Issued")) === "Issued"));
			} catch {
				if (isMounted) {
					setReceptionNotes([]);
				}
			}
		}

		void loadReceptionNotes();

		return () => {
			isMounted = false;
		};
	}, []);

	const producingCompany = getPrimaryProducingCompany(linkedRnidDetails);
	const primaryRnid = getPrimaryRnid(linkedRnidDetails);

	function handleRnidChange(entryId: number, event: ChangeEvent<HTMLInputElement>) {
		const nextRnid = event.target.value.toUpperCase();
		setErrorMessage("");
		setGeneratedRcid("");
		setGeneratedRcidDate("");

		const matchedReceptionNote = getReceptionNoteByRnid(receptionNotes, nextRnid);

		setLinkedRnidDetails((current) =>
			current.map((entry) => {
				if (entry.id !== entryId) {
					return entry;
				}

				if (!matchedReceptionNote) {
					return {
						...blankLinkedRnidDetails(entryId),
						rnid: nextRnid,
					};
				}

				return {
					id: entryId,
					rnid: nextRnid,
					customerId: matchedReceptionNote.customerId ?? "",
					producingCompany: {
						companyName: matchedReceptionNote.producingCompanyName ?? "",
						emirate: matchedReceptionNote.producingCompanyEmirate ?? "",
						officeAddress: matchedReceptionNote.producingCompanyOfficeAddress ?? "",
						contactPerson: matchedReceptionNote.producingCompanyContactPerson ?? "",
						officePhone: matchedReceptionNote.producingCompanyOfficePhone ?? "",
						email: matchedReceptionNote.producingCompanyEmail ?? "",
					},
					transportingCompany: {
						companyName: matchedReceptionNote.transportingCompanyName ?? "",
						contactPerson: matchedReceptionNote.transportingCompanyContactPerson ?? "",
						officePhone: matchedReceptionNote.transportingCompanyOfficePhone ?? "",
						email: matchedReceptionNote.transportingCompanyEmail ?? "",
					},
					vehicleDetails: {
						vehiclePlateNo: matchedReceptionNote.vehiclePlateNo ?? "",
						driverName: matchedReceptionNote.driverName ?? "",
					},
					wasteStreams:
						matchedReceptionNote.wasteStreams && matchedReceptionNote.wasteStreams.length > 0
							? [...matchedReceptionNote.wasteStreams]
							: [blankWasteStream()],
				};
			}),
		);
	}

	function handleAddRnid() {
		setGeneratedRcid("");
		setGeneratedRcidDate("");
		setLinkedRnidDetails((current) => [...current, blankLinkedRnidDetails(getNextLinkedRnidId(current))]);
	}

	function handleRemoveRnid(entryId: number) {
		setGeneratedRcid("");
		setGeneratedRcidDate("");
		setLinkedRnidDetails((current) => {
			if (current.length === 1) {
				return current;
			}

			return current.filter((entry) => entry.id !== entryId);
		});
	}

	async function handleGenerateRcid() {
		setErrorMessage("");

		if (!primaryRnid.trim()) {
			setErrorMessage("Enter at least one issued reception note ID before generating an RCID.");
			return;
		}

		setIsGeneratingRcid(true);

		try {
			const response = await apiFetch(`/reception-certificates/next-id?rnid=${encodeURIComponent(primaryRnid)}`, {
				cache: "no-store",
			});
			const payload = (await response.json()) as { detail?: string; rcid?: string };

			if (!response.ok || !payload.rcid) {
				throw new Error(payload.detail ?? "Unable to generate a reception certificate ID right now.");
			}

			setGeneratedRcid(payload.rcid);
			setGeneratedRcidDate(formatDateForDisplay(new Date()));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to generate a reception certificate ID right now.");
		} finally {
			setIsGeneratingRcid(false);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");

		if (!generatedRcid || !generatedRcidDate) {
			setErrorMessage("Generate an RCID before submitting.");
			return;
		}

		if (!issuedBy) {
			setErrorMessage("Only an employee session can issue a reception certificate.");
			return;
		}

		const linkedRnids = linkedRnidDetails
			.map((entry) => entry.rnid.trim().toUpperCase())
			.filter(Boolean);

		if (linkedRnids.length === 0) {
			setErrorMessage("Add at least one issued reception note before submitting.");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await apiFetch("/reception-certificates", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					rcidDate: generatedRcidDate,
					rcid: generatedRcid,
					rnid: linkedRnids.join(", "),
					linkedRnids,
					customerId: linkedRnidDetails.find((entry) => entry.customerId.trim())?.customerId ?? "",
					producingCompanyName: producingCompany.companyName,
					wasteStreamQuantity: getWasteStreamQuantitySummary(linkedRnidDetails),
					rcIssuedBy: issuedBy,
					status: "Issued",
				}),
			});
			const payload = (await response.json()) as { detail?: string };

			if (!response.ok) {
				setErrorMessage(payload.detail ?? "Unable to add that reception certificate right now.");
				return;
			}

			router.push("/employee/reception-certificate");
			router.refresh();
		} catch {
			setErrorMessage("Unable to reach the backend. Check that the API is running.");
		} finally {
			setIsSubmitting(false);
		}
	}

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

				<div className="flex flex-col gap-5">
					{linkedRnidDetails.map((entry, index) => (
						<div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="mb-4 flex items-center justify-between gap-3">
								<p className="text-sm font-semibold text-slate-700">RNID {index + 1}</p>
								<Button type="button" variant="danger" size="sm" className="min-h-6 rounded-lg px-1.5 py-0.5 text-[11px]" onClick={() => handleRemoveRnid(entry.id)} disabled={linkedRnidDetails.length === 1}>
									Remove
								</Button>
							</div>

							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">RNID (Reception Note ID)</span>
									<input
										type="text"
										value={entry.rnid}
										onChange={(event) => handleRnidChange(entry.id, event)}
										placeholder="Enter reception note ID"
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>

								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">CID</span>
									<input
										type="text"
										value={entry.customerId}
										readOnly
										placeholder="Auto-filled CID"
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>
							</div>
						</div>
					))}
				</div>

				<div>
					<Button type="button" variant="secondary" onClick={handleAddRnid}>
						+Add RNID (Reception Note ID)
					</Button>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 2</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Producing Company</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					{producingCompanyFields.map((field) => (
						<label key={field.key} className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">{field.label}</span>
							<input
								name={field.key}
								type="text"
								value={producingCompany[field.key]}
								readOnly
								placeholder={`Auto-filled ${field.label.toLowerCase()}`}
								className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 3</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Transporting Company</h2>
				</div>

				<div className="flex flex-col gap-5">
					{linkedRnidDetails.map((entry, index) => (
						<div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="mb-4">
								<p className="text-sm font-semibold text-slate-700">Transporting Company Details {index + 1}</p>
							</div>

							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								{transportingCompanyFields.map((field) => (
									<label key={`${field.key}-${entry.id}`} className="flex flex-col gap-1.5">
										<span className="text-sm font-medium text-slate-700">{field.label}</span>
										<input
											name={field.key}
											type={field.key === "email" ? "email" : "text"}
											value={entry.transportingCompany[field.key]}
											readOnly
											placeholder={`Auto-filled ${field.label.toLowerCase()}`}
											className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
										/>
									</label>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 4</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Vehicle Details</h2>
				</div>

				<div className="flex flex-col gap-5">
					{linkedRnidDetails.map((entry, index) => (
						<div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="mb-4">
								<p className="text-sm font-semibold text-slate-700">Vehicle Details {index + 1}</p>
							</div>

							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Vehicle Plate No.</span>
									<input type="text" value={entry.vehicleDetails.vehiclePlateNo} readOnly placeholder="Auto-filled vehicle plate number" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Driver Name</span>
									<input type="text" value={entry.vehicleDetails.driverName} readOnly placeholder="Auto-filled driver name" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 5</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Waste Stream Details</h2>
				</div>

				<div className="flex flex-col gap-5">
					{linkedRnidDetails.map((entry, entryIndex) => (
						<div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="mb-4">
								<p className="text-sm font-semibold text-slate-700">Waste Stream Details {entryIndex + 1}</p>
							</div>

							<div className="flex flex-col gap-4">
								{entry.wasteStreams.map((stream, streamIndex) => (
									<div key={`${entry.id}-${stream.code}-${streamIndex}`} className="rounded-3xl border border-slate-200 bg-white p-4">
										<div className="mb-4">
											<p className="text-sm font-semibold text-slate-700">Waste Stream {streamIndex + 1}</p>
										</div>

										<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Code</span>
												<input type="text" value={stream.code} readOnly placeholder="Auto-filled code" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Name</span>
												<input type="text" value={stream.name} readOnly placeholder="Auto-filled name" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Class</span>
												<input type="text" value={stream.wasteClass ?? ""} readOnly placeholder="Auto-filled class" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Physical State</span>
												<input type="text" value={stream.physicalState ?? ""} readOnly placeholder="Auto-filled physical state" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Quantity</span>
												<input type="text" value={extractWasteStreamQuantityValue(stream.quantity ?? "", stream.quantityUnit ?? "")} readOnly placeholder="Auto-filled quantity" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Quantity Unit</span>
												<input type="text" value={stream.quantityUnit ?? ""} readOnly placeholder="Auto-filled quantity unit" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Collection Emirate</span>
												<input type="text" value={stream.collectionEmirate ?? ""} readOnly placeholder="Auto-filled emirate" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Collection Location</span>
												<input type="text" value={stream.collectionLocation ?? ""} readOnly placeholder="Auto-filled collection location" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
											<label className="flex flex-col gap-1.5">
												<span className="text-sm font-medium text-slate-700">Reception Date</span>
												<input type="text" value={stream.receptionDate ?? ""} readOnly placeholder="Auto-filled date" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
											</label>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 6</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Waste Reception Facilities</h2>
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">Facilities Name</span>
					<input type="text" value="Zero Waste - Circular Processing Facilities" readOnly className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
				</label>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 7</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Reception Certificate Verification</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Issued by</span>
						<input type="text" value={issuedBy} readOnly className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Verified by</span>
						<input type="text" value="Imran Gill" readOnly className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Position</span>
						<input type="text" value="CEO" readOnly className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
					</label>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 8</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Reception Certificate ID</h2>
				</div>

				<div className="flex flex-col gap-4 md:flex-row md:items-end">
					<label className="flex flex-1 flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">RCID</span>
								<input type="text" value={generatedRcid} readOnly placeholder="RCID-0001-0001" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
					</label>

					<Button type="button" variant="secondary" onClick={handleGenerateRcid} disabled={!parseRnidParts(primaryRnid) || isGeneratingRcid}>
						{isGeneratingRcid ? "Generating..." : "Generate RCID"}
					</Button>
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">RCID Date</span>
					<input type="text" value={generatedRcidDate} readOnly placeholder="19-04-2026" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
				</label>
			</section>

			<div className="flex justify-center pt-2">
				<Button type="submit" disabled={!generatedRcid || !generatedRcidDate || isSubmitting}>
					{isSubmitting ? "Saving..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function getReceptionNoteByRnid(receptionNotes: ReceptionNoteRecord[], rnid: string) {
	return receptionNotes.find((note) => note.rnid.toUpperCase() === rnid.trim().toUpperCase()) ?? null;
}

function getPrimaryRnid(linkedRnidDetails: LinkedRnidDetailsState[]) {
	return linkedRnidDetails.find((entry) => entry.rnid.trim())?.rnid ?? "";
}

function getPrimaryProducingCompany(linkedRnidDetails: LinkedRnidDetailsState[]) {
	return linkedRnidDetails.find((entry) => hasProducingCompany(entry.producingCompany))?.producingCompany ?? emptyProducingCompany();
}

function hasProducingCompany(producingCompany: ProducingCompanyState) {
	return Object.values(producingCompany).some((value) => value.trim());
}

function getNextLinkedRnidId(linkedRnidDetails: LinkedRnidDetailsState[]) {
	return linkedRnidDetails.reduce((maxValue, entry) => Math.max(maxValue, entry.id), -1) + 1;
}

function parseRnidParts(rnid: string) {
	const matchedRnid = /^(?:RNID|RN)-(\d+)-(\d+)$/.exec(rnid.trim().toUpperCase());

	if (!matchedRnid) {
		return null;
	}

	const cidNumber = Number.parseInt(matchedRnid[1], 10);
	const rnidNumber = Number.parseInt(matchedRnid[2], 10);

	if (!Number.isFinite(cidNumber) || !Number.isFinite(rnidNumber)) {
		return null;
	}

	return {
		cidNumber: matchedRnid[1].padStart(4, "0"),
		rnidNumber: String(rnidNumber),
	};
}

function getWasteStreamQuantitySummary(linkedRnidDetails: LinkedRnidDetailsState[]) {
	return joinUniqueValues(
		linkedRnidDetails.flatMap((entry) => entry.wasteStreams.map((stream) => stream.quantity)),
	);
}

function joinUniqueValues(values: string[]) {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join(", ");
}

function normalizeStatus(status: string) {
	if (status === "Draft") {
		return status;
	}

	return "Issued";
}

function extractWasteStreamQuantityValue(quantity: string, quantityUnit: string) {
	const trimmedQuantity = quantity.trim();
	const trimmedUnit = quantityUnit.trim();

	if (!trimmedQuantity || !trimmedUnit) {
		return trimmedQuantity;
	}

	const unitSuffix = ` ${trimmedUnit}`;

	if (trimmedQuantity.endsWith(unitSuffix)) {
		return trimmedQuantity.slice(0, -unitSuffix.length).trim();
	}

	return trimmedQuantity;
}
