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
}>;

type ReceptionCertificateRecord = Readonly<{
	rcid: string;
	rcidDate: string;
	rnid: string;
	linkedRnids?: ReadonlyArray<string>;
	customerId?: string;
	producingCompanyName?: string;
	wasteStreamQuantity?: string;
	rcIssuedBy?: string;
	status?: string;
}>;

type AddCircularityCertificateFormProps = Readonly<{
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

type SecondaryEcosystemState = {
	secondaryProduct: string;
	secondaryLoop: string;
};

type SecondaryEcosystemMode = "shared" | "by_rc" | "by_rn";

type SecondaryEcosystemPayload = {
	mode: SecondaryEcosystemMode;
	shared: SecondaryEcosystemState;
	entries: Array<{
		rcid: string;
		rnid: string;
		secondaryProduct: string;
		secondaryLoop: string;
	}>;
};

type LinkedReceptionNoteDetailsState = SecondaryEcosystemState & {
	rnid: string;
	transportingCompany: TransportingCompanyState;
	vehicleDetails: VehicleDetailsState;
	wasteStreams: ReceptionNoteWasteStream[];
};

type LinkedRcidDetailsState = SecondaryEcosystemState & {
	id: number;
	rcid: string;
	cid: string;
	linkedRnidCount: number;
	linkedNotes: LinkedReceptionNoteDetailsState[];
	isLinkedNotesExpanded: boolean;
	producingCompany: ProducingCompanyState;
	transportingCompany: TransportingCompanyState;
	vehicleDetails: VehicleDetailsState;
	wasteStream: ReceptionNoteWasteStream;
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

function emptySecondaryEcosystem(): SecondaryEcosystemState {
	return {
		secondaryProduct: "",
		secondaryLoop: "",
	};
}

function blankLinkedRcidDetails(id: number): LinkedRcidDetailsState {
	return {
		id,
		rcid: "",
		cid: "",
		linkedRnidCount: 0,
		linkedNotes: [],
		isLinkedNotesExpanded: false,
		producingCompany: emptyProducingCompany(),
		transportingCompany: emptyTransportingCompany(),
		vehicleDetails: emptyVehicleDetails(),
		wasteStream: blankWasteStream(),
		...emptySecondaryEcosystem(),
	};
}

export default function AddCircularityCertificateForm({
	submitLabel = "Add Circularity Certificate",
}: AddCircularityCertificateFormProps) {
	const router = useRouter();
	const { session } = useAuth();
	const [receptionNotes, setReceptionNotes] = useState<ReceptionNoteRecord[]>([]);
	const [receptionCertificates, setReceptionCertificates] = useState<ReceptionCertificateRecord[]>([]);
	const [linkedRcidDetails, setLinkedRcidDetails] = useState<LinkedRcidDetailsState[]>([blankLinkedRcidDetails(0)]);
	const [sharedSecondaryEcosystem, setSharedSecondaryEcosystem] = useState<SecondaryEcosystemState>(emptySecondaryEcosystem());
	const [generatedCcid, setGeneratedCcid] = useState("");
	const [generatedCcidDate, setGeneratedCcidDate] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGeneratingCcid, setIsGeneratingCcid] = useState(false);
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

				setReceptionNotes(payload);
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

	useEffect(() => {
		let isMounted = true;

		async function loadReceptionCertificates() {
			try {
				const response = await apiFetch("/reception-certificates", {
					cache: "no-store",
				});
				const payload = (await response.json()) as ReceptionCertificateRecord[];

				if (!response.ok || !Array.isArray(payload) || !isMounted) {
					return;
				}

				setReceptionCertificates(payload.filter((certificate) => normalizeStatus(String(certificate.status ?? "Issued")) === "Issued"));
			} catch {
				if (isMounted) {
					setReceptionCertificates([]);
				}
			}
		}

		void loadReceptionCertificates();

		return () => {
			isMounted = false;
		};
	}, []);

	const cid = getPrimaryCid(linkedRcidDetails);
	const producingCompany = getPrimaryProducingCompany(linkedRcidDetails);
	const primaryRcid = getPrimaryRcid(linkedRcidDetails);
	const secondaryEcosystemMode = getSecondaryEcosystemMode(linkedRcidDetails);
	const showPerRcidSecondaryEcosystem = secondaryEcosystemMode === "by_rc";
	const verificationSectionNumber = showPerRcidSecondaryEcosystem ? "7" : "8";
	const certificateIdSectionNumber = showPerRcidSecondaryEcosystem ? "8" : "9";

	function handleRcidChange(entryId: number, event: ChangeEvent<HTMLInputElement>) {
		const nextRcid = event.target.value.toUpperCase();
		setErrorMessage("");
		setGeneratedCcid("");
		setGeneratedCcidDate("");

		const matchedReceptionCertificate = getReceptionCertificateByRcid(receptionCertificates, nextRcid);
		const linkedRnids = getLinkedRnidsFromCertificate(matchedReceptionCertificate);
		const linkedNotes = linkedRnids
			.map((rnid) => getReceptionNoteByRnid(receptionNotes, rnid))
			.filter((note): note is ReceptionNoteRecord => note !== null);
		const matchedReceptionNote = linkedNotes[0] ?? null;

		setLinkedRcidDetails((current) =>
			current.map((entry) => {
				if (entry.id !== entryId) {
					return entry;
				}

				const existingLinkedNotes = new Map(entry.linkedNotes.map((note) => [note.rnid, note]));

				if (!matchedReceptionCertificate || !matchedReceptionNote) {
					return {
						...blankLinkedRcidDetails(entryId),
						rcid: nextRcid,
					};
				}

				return {
					id: entryId,
					rcid: nextRcid,
					cid: matchedReceptionNote.customerId ?? parseCustomerIdFromRcid(nextRcid),
					linkedRnidCount: linkedRnids.length,
					linkedNotes: linkedNotes.map((note) => buildLinkedReceptionNoteDetails(note, existingLinkedNotes.get(note.rnid))),
					isLinkedNotesExpanded: false,
					producingCompany: {
						companyName: matchedReceptionNote.producingCompanyName ?? matchedReceptionCertificate.producingCompanyName ?? "",
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
					wasteStream: matchedReceptionNote.wasteStreams?.[0] ?? blankWasteStream(),
					secondaryProduct: entry.secondaryProduct,
					secondaryLoop: entry.secondaryLoop,
				};
			}),
		);
	}

	function handleToggleLinkedReceptionNotes(entryId: number) {
		setLinkedRcidDetails((current) =>
			current.map((entry) => (
				entry.id === entryId
					? { ...entry, isLinkedNotesExpanded: !entry.isLinkedNotesExpanded }
					: entry
			)),
		);
	}

	function handleAddRcid() {
		setGeneratedCcid("");
		setGeneratedCcidDate("");
		setLinkedRcidDetails((current) => [...current, blankLinkedRcidDetails(getNextLinkedRcidId(current))]);
	}

	function handleRemoveRcid(entryId: number) {
		setGeneratedCcid("");
		setGeneratedCcidDate("");
		setLinkedRcidDetails((current) => {
			if (current.length === 1) {
				return current;
			}

			return current.filter((entry) => entry.id !== entryId);
		});
	}

	function handleSecondaryProductChange(entryId: number, value: string) {
		setLinkedRcidDetails((current) =>
			current.map((entry) => (entry.id === entryId ? { ...entry, secondaryProduct: value } : entry)),
		);
	}

	function handleSecondaryLoopChange(entryId: number, value: string) {
		setLinkedRcidDetails((current) =>
			current.map((entry) => (entry.id === entryId ? { ...entry, secondaryLoop: value } : entry)),
		);
	}

	function handleSharedSecondaryProductChange(value: string) {
		setSharedSecondaryEcosystem((current) => ({ ...current, secondaryProduct: value }));
	}

	function handleSharedSecondaryLoopChange(value: string) {
		setSharedSecondaryEcosystem((current) => ({ ...current, secondaryLoop: value }));
	}

	function handleLinkedReceptionNoteSecondaryProductChange(entryId: number, rnid: string, value: string) {
		setLinkedRcidDetails((current) =>
			current.map((entry) => (
				entry.id === entryId
					? {
						...entry,
						linkedNotes: entry.linkedNotes.map((note) => (
							note.rnid === rnid ? { ...note, secondaryProduct: value } : note
						)),
					}
					: entry
			)),
		);
	}

	function handleLinkedReceptionNoteSecondaryLoopChange(entryId: number, rnid: string, value: string) {
		setLinkedRcidDetails((current) =>
			current.map((entry) => (
				entry.id === entryId
					? {
						...entry,
						linkedNotes: entry.linkedNotes.map((note) => (
							note.rnid === rnid ? { ...note, secondaryLoop: value } : note
						)),
					}
					: entry
			)),
		);
	}

	async function handleGenerateCcid() {
		setErrorMessage("");

		if (!primaryRcid.trim()) {
			setErrorMessage("Enter at least one issued reception certificate ID before generating a CCID.");
			return;
		}

		setIsGeneratingCcid(true);

		try {
			const response = await apiFetch(`/circularity-certificates/next-id?rcid=${encodeURIComponent(primaryRcid)}`, {
				cache: "no-store",
			});
			const payload = (await response.json()) as { detail?: string; ccid?: string };

			if (!response.ok || !payload.ccid) {
				throw new Error(payload.detail ?? "Unable to generate a circularity certificate ID right now.");
			}

			setGeneratedCcid(payload.ccid);
			setGeneratedCcidDate(formatDateForDisplay(new Date()));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to generate a circularity certificate ID right now.");
		} finally {
			setIsGeneratingCcid(false);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");

		if (!generatedCcid || !generatedCcidDate) {
			setErrorMessage("Generate a CCID before submitting.");
			return;
		}

		if (!issuedBy) {
			setErrorMessage("Only an employee session can issue a circularity certificate.");
			return;
		}

		const linkedRcids = linkedRcidDetails
			.map((entry) => entry.rcid.trim().toUpperCase())
			.filter(Boolean);

		if (linkedRcids.length === 0) {
			setErrorMessage("Add at least one issued reception certificate before submitting.");
			return;
		}

		setIsSubmitting(true);

		try {
			const secondaryEcosystemDetails = buildSecondaryEcosystemPayload(linkedRcidDetails, sharedSecondaryEcosystem);
			const secondarySummary = buildSecondaryEcosystemSummary(secondaryEcosystemDetails);

			const response = await apiFetch("/circularity-certificates", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ccidDate: generatedCcidDate,
					ccid: generatedCcid,
					rcid: linkedRcids.join(", "),
					linkedRcids,
					cid,
					producingCompanyName: producingCompany.companyName,
					wasteStreamQuantity: joinUniqueValues(linkedRcidDetails.map((entry) => entry.wasteStream.quantity)),
					secondaryProduct: secondarySummary.secondaryProduct,
					secondaryLoop: secondarySummary.secondaryLoop,
					secondaryEcosystemDetails,
					issuedBy,
					status: "Issued",
				}),
			});
			const payload = (await response.json()) as { detail?: string };

			if (!response.ok) {
				setErrorMessage(payload.detail ?? "Unable to add that circularity certificate right now.");
				return;
			}

			router.push("/employee/circularity-certificate");
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
					{linkedRcidDetails.map((entry, index) => (
						<div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="mb-4 flex items-center justify-between gap-3">
								<p className="text-sm font-semibold text-slate-700">RCID {index + 1}</p>
								<Button type="button" variant="danger" size="sm" className="min-h-6 rounded-lg px-1.5 py-0.5 text-[11px]" onClick={() => handleRemoveRcid(entry.id)} disabled={linkedRcidDetails.length === 1}>
									Remove
								</Button>
							</div>
							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">RCID (Reception Certificate ID)</span>
									<input
										type="text"
										value={entry.rcid}
										onChange={(event) => handleRcidChange(entry.id, event)}
										placeholder="Enter reception certificate ID"
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">CID</span>
									<input
										type="text"
										value={entry.cid}
										readOnly
										placeholder="Auto-filled CID"
										className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>
							</div>

								{entry.linkedRnidCount >= 2 ? (
									<div className="mt-4 flex flex-col gap-4">
										<div>
											<Button type="button" variant="secondary" onClick={() => handleToggleLinkedReceptionNotes(entry.id)}>
												{entry.isLinkedNotesExpanded ? "Hide Linked Reception Notes" : "Show Linked Reception Notes"}
											</Button>
										</div>

										{entry.isLinkedNotesExpanded ? (
											<div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4">
												{entry.linkedNotes.map((note, noteIndex) => (
													<div key={`${entry.id}-${note.rnid || noteIndex}`} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
														<div className="mb-4 flex flex-col gap-1">
															<p className="text-sm font-semibold text-slate-700">Reception Note {noteIndex + 1}</p>
															<p className="text-xs uppercase tracking-[0.12em] text-slate-500">Linked Reception Notes</p>
														</div>

														<div className="grid grid-cols-1 gap-4">
															<label className="flex flex-col gap-1.5">
																<span className="text-sm font-medium text-slate-700">RNID</span>
																<input type="text" value={note.rnid} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" />
															</label>

															<div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
																<p className="md:col-span-2 text-sm font-semibold text-slate-700">Transporting Company</p>
																{transportingCompanyFields.map((field) => (
																	<label key={`${entry.id}-${note.rnid}-${field.key}`} className="flex flex-col gap-1.5">
																		<span className="text-sm font-medium text-slate-700">{field.label}</span>
																		<input
																			type={field.key === "email" ? "email" : "text"}
																			value={note.transportingCompany[field.key]}
																			readOnly
																			className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none"
																		/>
																	</label>
																))}
															</div>

															<div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
																<p className="md:col-span-2 text-sm font-semibold text-slate-700">Vehicle Details</p>
																<label className="flex flex-col gap-1.5">
																	<span className="text-sm font-medium text-slate-700">Vehicle Plate No.</span>
																	<input type="text" value={note.vehicleDetails.vehiclePlateNo} readOnly className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none" />
																</label>
																<label className="flex flex-col gap-1.5">
																	<span className="text-sm font-medium text-slate-700">Driver Name</span>
																	<input type="text" value={note.vehicleDetails.driverName} readOnly className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none" />
																</label>
															</div>

															<div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4">
																<p className="text-sm font-semibold text-slate-700">Waste Stream Details</p>
																{note.wasteStreams.map((stream, streamIndex) => (
																	<div key={`${entry.id}-${note.rnid}-stream-${streamIndex}`} className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
																		<p className="md:col-span-2 text-sm font-semibold text-slate-700">Waste Stream {streamIndex + 1}</p>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Code</span><input type="text" value={stream.code} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Name</span><input type="text" value={stream.name} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Class</span><input type="text" value={stream.wasteClass ?? ""} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Physical State</span><input type="text" value={stream.physicalState ?? ""} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Quantity</span><input type="text" value={extractWasteStreamQuantityValue(stream.quantity ?? "", stream.quantityUnit ?? "")} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Quantity Unit</span><input type="text" value={stream.quantityUnit ?? ""} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Collection Emirate</span><input type="text" value={stream.collectionEmirate ?? ""} readOnly placeholder="Auto-filled emirate" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Collection Location</span><input type="text" value={stream.collectionLocation ?? ""} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																		<label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-slate-700">Date</span><input type="text" value={stream.receptionDate ?? ""} readOnly className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none" /></label>
																	</div>
																))}
															</div>
														</div>
													</div>
												))}
											</div>
										) : null}
									</div>
								) : null}
						</div>
					))}
				</div>

				<div>
					<Button type="button" variant="secondary" onClick={handleAddRcid}>
						+ Add RCID (Reception Certificate ID)
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
					{linkedRcidDetails.map((entry, index) => (
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
					{linkedRcidDetails.map((entry, index) => (
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
					{linkedRcidDetails.map((entry, index) => (
						<div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="mb-4">
								<p className="text-sm font-semibold text-slate-700">Waste Stream Details {index + 1}</p>
							</div>
							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Code</span>
									<input type="text" value={entry.wasteStream.code} readOnly placeholder="Auto-filled code" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Name</span>
									<input type="text" value={entry.wasteStream.name} readOnly placeholder="Auto-filled name" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Class</span>
									<input type="text" value={entry.wasteStream.wasteClass ?? ""} readOnly placeholder="Auto-filled class" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Physical State</span>
									<input type="text" value={entry.wasteStream.physicalState ?? ""} readOnly placeholder="Auto-filled physical state" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Quantity</span>
									<input type="text" value={extractWasteStreamQuantityValue(entry.wasteStream.quantity ?? "", entry.wasteStream.quantityUnit ?? "")} readOnly placeholder="Auto-filled quantity" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Quantity Unit</span>
									<input type="text" value={entry.wasteStream.quantityUnit ?? ""} readOnly placeholder="Auto-filled quantity unit" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Collection Emirate</span>
									<input type="text" value={entry.wasteStream.collectionEmirate ?? ""} readOnly placeholder="Auto-filled emirate" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Collection Location</span>
									<input type="text" value={entry.wasteStream.collectionLocation ?? ""} readOnly placeholder="Auto-filled collection location" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
								<label className="flex flex-col gap-1.5">
									<span className="text-sm font-medium text-slate-700">Reception Date</span>
									<input type="text" value={entry.wasteStream.receptionDate ?? ""} readOnly placeholder="Auto-filled quantity date" className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
								</label>
							</div>

							{showPerRcidSecondaryEcosystem && entry.rcid.trim() ? (
								<div className="mt-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4">
									<div className="flex flex-col gap-1">
										<p className="text-sm font-semibold text-slate-700">Secondary Ecosystem</p>
										<p className="text-xs uppercase tracking-[0.12em] text-slate-500">{entry.rcid}</p>
									</div>
									<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
										<SecondaryEcosystemSelectFields
											secondaryProduct={entry.secondaryProduct}
											secondaryLoop={entry.secondaryLoop}
											onSecondaryProductChange={(value) => handleSecondaryProductChange(entry.id, value)}
											onSecondaryLoopChange={(value) => handleSecondaryLoopChange(entry.id, value)}
										/>
									</div>
								</div>
							) : null}
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

			{showPerRcidSecondaryEcosystem ? null : (
			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 7</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Secondary Ecosystem</h2>
				</div>
				<div className="flex flex-col gap-5">
					{secondaryEcosystemMode === "shared" ? (
						<div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
							<div className="mb-4">
								<p className="text-sm font-semibold text-slate-700">Shared Secondary Ecosystem</p>
							</div>
							<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
								<SecondaryEcosystemSelectFields
									secondaryProduct={sharedSecondaryEcosystem.secondaryProduct}
									secondaryLoop={sharedSecondaryEcosystem.secondaryLoop}
									onSecondaryProductChange={handleSharedSecondaryProductChange}
									onSecondaryLoopChange={handleSharedSecondaryLoopChange}
								/>
							</div>
						</div>
					) : null}

					{secondaryEcosystemMode === "by_rn" ? linkedRcidDetails.filter((entry) => entry.rcid.trim()).flatMap((entry) => (
						entry.linkedNotes.map((note, noteIndex) => (
							<div key={`${entry.id}-${note.rnid}-secondary`} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
								<div className="mb-4 flex flex-col gap-1">
									<p className="text-sm font-semibold text-slate-700">Reception Note {noteIndex + 1}</p>
									<p className="text-xs uppercase tracking-[0.12em] text-slate-500">{note.rnid || entry.rcid}</p>
								</div>
								<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
									<SecondaryEcosystemSelectFields
										secondaryProduct={note.secondaryProduct}
										secondaryLoop={note.secondaryLoop}
										onSecondaryProductChange={(value) => handleLinkedReceptionNoteSecondaryProductChange(entry.id, note.rnid, value)}
										onSecondaryLoopChange={(value) => handleLinkedReceptionNoteSecondaryLoopChange(entry.id, note.rnid, value)}
									/>
								</div>
							</div>
						))
					)) : null}
				</div>
			</section>
			)}

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section {verificationSectionNumber}</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Circularity Certificate Verification</h2>
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
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section {certificateIdSectionNumber}</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Circularity Certificate ID</h2>
				</div>
				<div className="flex flex-col gap-4 md:flex-row md:items-end">
					<label className="flex flex-1 flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">CCID</span>
						<input type="text" value={generatedCcid} readOnly placeholder="CCID-0001-0001" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
					</label>
					<Button type="button" variant="secondary" onClick={handleGenerateCcid} disabled={!parseRcidParts(primaryRcid) || isGeneratingCcid}>
						{isGeneratingCcid ? "Generating..." : "Generate CCID"}
					</Button>
				</div>
				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">CCID Date</span>
					<input type="text" value={generatedCcidDate} readOnly placeholder="19-04-2026" className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20" />
				</label>
			</section>

			<div className="flex justify-center pt-2">
				<Button type="submit" disabled={!generatedCcid || !generatedCcidDate || !allSecondaryEcosystemsComplete(linkedRcidDetails, sharedSecondaryEcosystem, secondaryEcosystemMode) || isSubmitting}>
					{isSubmitting ? "Saving..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function getPrimaryRcid(linkedRcidDetails: LinkedRcidDetailsState[]) {
	return linkedRcidDetails.find((entry) => entry.rcid.trim())?.rcid ?? "";
}

function getPrimaryCid(linkedRcidDetails: LinkedRcidDetailsState[]) {
	return linkedRcidDetails.find((entry) => entry.cid.trim())?.cid ?? "";
}

function getPrimaryProducingCompany(linkedRcidDetails: LinkedRcidDetailsState[]) {
	return linkedRcidDetails.find((entry) => hasProducingCompany(entry.producingCompany))?.producingCompany ?? emptyProducingCompany();
}

function hasProducingCompany(producingCompany: ProducingCompanyState) {
	return Object.values(producingCompany).some((value) => value.trim());
}

function getNextLinkedRcidId(linkedRcidDetails: LinkedRcidDetailsState[]) {
	return linkedRcidDetails.reduce((maxValue, entry) => Math.max(maxValue, entry.id), -1) + 1;
}

function allSecondaryEcosystemsComplete(
	linkedRcidDetails: LinkedRcidDetailsState[],
	sharedSecondaryEcosystem: SecondaryEcosystemState,
	secondaryEcosystemMode: SecondaryEcosystemMode,
) {
	if (secondaryEcosystemMode === "shared") {
		return Boolean(sharedSecondaryEcosystem.secondaryProduct && sharedSecondaryEcosystem.secondaryLoop);
	}

	const activeEntries = linkedRcidDetails.filter((entry) => entry.rcid.trim());

	if (secondaryEcosystemMode === "by_rc") {
		return activeEntries.length > 0 && activeEntries.every((entry) => entry.secondaryProduct && entry.secondaryLoop);
	}

	return activeEntries.length === 1 && activeEntries[0].linkedNotes.length > 0 && activeEntries[0].linkedNotes.every((note) => note.secondaryProduct && note.secondaryLoop);
}

function getReceptionCertificateByRcid(receptionCertificates: ReceptionCertificateRecord[], rcid: string) {
	return receptionCertificates.find((certificate) => certificate.rcid.toUpperCase() === rcid.trim().toUpperCase()) ?? null;
}

function getLinkedRnidsFromCertificate(certificate: ReceptionCertificateRecord | null) {
	if (!certificate) {
		return [];
	}

	if (Array.isArray(certificate.linkedRnids) && certificate.linkedRnids.length > 0) {
		return certificate.linkedRnids.map((value) => String(value ?? "").trim()).filter(Boolean);
	}

	return certificate.rnid.split(",").map((value) => value.trim()).filter(Boolean);
}

function getReceptionNoteByRnid(receptionNotes: ReceptionNoteRecord[], rnid: string) {
	return receptionNotes.find((note) => note.rnid.toUpperCase() === rnid.trim().toUpperCase()) ?? null;
}

function buildLinkedReceptionNoteDetails(
	note: ReceptionNoteRecord,
	existingNote?: LinkedReceptionNoteDetailsState,
): LinkedReceptionNoteDetailsState {
	return {
		rnid: note.rnid,
		transportingCompany: {
			companyName: note.transportingCompanyName ?? "",
			contactPerson: note.transportingCompanyContactPerson ?? "",
			officePhone: note.transportingCompanyOfficePhone ?? "",
			email: note.transportingCompanyEmail ?? "",
		},
		vehicleDetails: {
			vehiclePlateNo: note.vehiclePlateNo ?? "",
			driverName: note.driverName ?? "",
		},
		wasteStreams: note.wasteStreams && note.wasteStreams.length > 0 ? [...note.wasteStreams] : [blankWasteStream()],
		secondaryProduct: existingNote?.secondaryProduct ?? "",
		secondaryLoop: existingNote?.secondaryLoop ?? "",
	};
}

function getSecondaryEcosystemMode(linkedRcidDetails: LinkedRcidDetailsState[]): SecondaryEcosystemMode {
	const activeEntries = linkedRcidDetails.filter((entry) => entry.rcid.trim());

	if (activeEntries.length > 1) {
		return "by_rc";
	}

	if (activeEntries.length === 1 && activeEntries[0].linkedRnidCount >= 2) {
		return "by_rn";
	}

	return "shared";
}

function buildSecondaryEcosystemPayload(
	linkedRcidDetails: LinkedRcidDetailsState[],
	sharedSecondaryEcosystem: SecondaryEcosystemState,
): SecondaryEcosystemPayload {
	const activeEntries = linkedRcidDetails.filter((entry) => entry.rcid.trim());
	const mode = getSecondaryEcosystemMode(linkedRcidDetails);

	if (mode === "shared") {
		return {
			mode,
			shared: sharedSecondaryEcosystem,
			entries: [],
		};
	}

	if (mode === "by_rc") {
		return {
			mode,
			shared: emptySecondaryEcosystem(),
			entries: activeEntries.map((entry) => ({
				rcid: entry.rcid.trim().toUpperCase(),
				rnid: "",
				secondaryProduct: entry.secondaryProduct,
				secondaryLoop: entry.secondaryLoop,
			})),
		};
	}

	const primaryEntry = activeEntries[0];
	return {
		mode,
		shared: emptySecondaryEcosystem(),
		entries: (primaryEntry?.linkedNotes ?? []).map((note) => ({
			rcid: primaryEntry.rcid.trim().toUpperCase(),
			rnid: note.rnid,
			secondaryProduct: note.secondaryProduct,
			secondaryLoop: note.secondaryLoop,
		})),
	};
}

function buildSecondaryEcosystemSummary(secondaryEcosystemPayload: SecondaryEcosystemPayload) {
	if (secondaryEcosystemPayload.mode === "shared") {
		return {
			secondaryProduct: secondaryEcosystemPayload.shared.secondaryProduct,
			secondaryLoop: secondaryEcosystemPayload.shared.secondaryLoop,
		};
	}

	return {
		secondaryProduct: joinUniqueValues(secondaryEcosystemPayload.entries.map((entry) => entry.secondaryProduct)),
		secondaryLoop: joinUniqueValues(secondaryEcosystemPayload.entries.map((entry) => entry.secondaryLoop)),
	};
}

type SecondaryEcosystemSelectFieldsProps = {
	secondaryProduct: string;
	secondaryLoop: string;
	onSecondaryProductChange: (value: string) => void;
	onSecondaryLoopChange: (value: string) => void;
};

function SecondaryEcosystemSelectFields({
	secondaryProduct,
	secondaryLoop,
	onSecondaryProductChange,
	onSecondaryLoopChange,
}: SecondaryEcosystemSelectFieldsProps) {
	return (
		<>
			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium text-slate-700">Secondary Product</span>
				<select value={secondaryProduct} onChange={(event) => onSecondaryProductChange(event.target.value)} className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20">
					<option value="" disabled>Select secondary product</option>
					<option value="Material">Material</option>
					<option value="Energy">Energy</option>
				</select>
			</label>
			<label className="flex flex-col gap-1.5">
				<span className="text-sm font-medium text-slate-700">Secondary Loop</span>
				<select value={secondaryLoop} onChange={(event) => onSecondaryLoopChange(event.target.value)} className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20">
					<option value="" disabled>Select secondary loop</option>
					<option value="Manufacturer">Manufacturer</option>
					<option value="Trader">Trader</option>
				</select>
			</label>
		</>
	);
}

function parseCustomerIdFromRcid(rcid: string) {
	const parsedRcid = parseRcidParts(rcid);
	return parsedRcid ? `CID-${parsedRcid.cidNumber.padStart(4, "0")}` : "";
}

function parseRcidParts(rcid: string) {
	const matchedRcid = /^(?:RCID|RC)-(\d+)-(\d+)$/.exec(rcid.trim().toUpperCase());

	if (!matchedRcid) {
		return null;
	}

	const cidNumber = Number.parseInt(matchedRcid[1], 10);
	const rcidNumber = Number.parseInt(matchedRcid[2], 10);

	if (!Number.isFinite(cidNumber) || !Number.isFinite(rcidNumber)) {
		return null;
	}

	return {
		cidNumber: matchedRcid[1].padStart(4, "0"),
		rcidNumber: String(rcidNumber),
	};
}

function joinUniqueValues(values: string[]) {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join(", ");
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

function normalizeStatus(status: string) {
	if (status === "Draft") {
		return status;
	}

	return "Issued";
}
