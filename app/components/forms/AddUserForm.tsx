"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Button from "@/app/components/ui/Button";
import { apiFetch } from "@/app/utils/api";
import { formatDateForDisplay } from "@/app/utils/dateFormat";

type AddUserFormProps = Readonly<{
	submitLabel?: string;
	mode?: "create" | "edit";
	userId?: string | null;
}>;

type CustomerRecord = Readonly<{
	customerId: string;
	companyName: string;
}>;

type FocalPersonRecord = Readonly<{
	name: string;
	position: string;
	department: string;
	email: string;
	officePhone: string;
	mobilePhone: string;
	hasUserAccount?: boolean;
}>;

type CustomerDetails = Readonly<{
	customerId: string;
	companyName: string;
	focalPersons?: FocalPersonRecord[];
}>;

type UserRecord = Readonly<{
	userIdDate: string;
	userId: string;
	userName: string;
	company: string;
	role: string;
	lastActive: string;
	email: string;
	position?: string | null;
	department?: string | null;
	mobile?: string | null;
	customerId?: string | null;
}>;

const sectionOneFields = [
	{ id: "firstName", label: "First Name", type: "text", placeholder: "Enter first name" },
	{ id: "lastName", label: "Last Name", type: "text", placeholder: "Enter last name" },
	{ id: "email", label: "Email", type: "email", placeholder: "Enter email address" },
] as const;

const focalPersonFields = [
	{ id: "position", label: "Position", type: "text", placeholder: "Enter position" },
	{ id: "department", label: "Department", type: "text", placeholder: "Enter department" },
	{ id: "mobile", label: "Mobile", type: "tel", placeholder: "Enter mobile number" },
] as const;

export default function AddUserForm({ submitLabel = "Add User", mode = "create", userId }: AddUserFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [customers, setCustomers] = useState<CustomerRecord[]>([]);
	const [customerFocalPersons, setCustomerFocalPersons] = useState<FocalPersonRecord[]>([]);
	const [generatedUserId, setGeneratedUserId] = useState("");
	const [generatedUserIdDate, setGeneratedUserIdDate] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [emailValue, setEmailValue] = useState("");
	const [position, setPosition] = useState("");
	const [department, setDepartment] = useState("");
	const [mobile, setMobile] = useState("");
	const [selectedRole, setSelectedRole] = useState(searchParams.get("role") ?? "");
	const [companyName, setCompanyName] = useState("");
	const [customerId, setCustomerId] = useState(searchParams.get("customerId")?.toUpperCase() ?? "");
	const [selectedFocalPersonEmail, setSelectedFocalPersonEmail] = useState(searchParams.get("focalPersonEmail")?.toLowerCase() ?? "");
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGeneratingUserId, setIsGeneratingUserId] = useState(false);
	const [isLoadingCustomerDetails, setIsLoadingCustomerDetails] = useState(false);
	const [isLoadingUser, setIsLoadingUser] = useState(mode === "edit");
	const [showPasswords, setShowPasswords] = useState(false);
	const isEditMode = mode === "edit";

	useEffect(() => {
		if (!isEditMode || !userId) {
			setIsLoadingUser(false);
			return;
		}

		let isMounted = true;

		async function loadUser() {
			setErrorMessage("");
			setIsLoadingUser(true);
			const normalizedUserId = userId?.trim();

			if (!normalizedUserId) {
				setIsLoadingUser(false);
				return;
			}

			try {
				const response = await apiFetch(`/users/${encodeURIComponent(normalizedUserId)}`, {
					cache: "no-store",
				});
				const payload = (await response.json()) as UserRecord & { detail?: string };

				if (!response.ok) {
					throw new Error(payload.detail ?? "Unable to load that user.");
				}

				if (!isMounted) {
					return;
				}

				const { firstName: nextFirstName, lastName: nextLastName } = splitName(String(payload.userName ?? ""));
				setGeneratedUserId(String(payload.userId ?? ""));
				setGeneratedUserIdDate(String(payload.userIdDate ?? ""));
				setFirstName(nextFirstName);
				setLastName(nextLastName);
				setEmailValue(String(payload.email ?? ""));
				setPosition(String(payload.position ?? ""));
				setDepartment(String(payload.department ?? ""));
				setMobile(String(payload.mobile ?? ""));
				setSelectedRole(String(payload.role ?? ""));
				setCompanyName(String(payload.company ?? ""));
				setCustomerId(String(payload.customerId ?? ""));
				setSelectedFocalPersonEmail("");
			} catch (error) {
				if (isMounted) {
					setErrorMessage(error instanceof Error ? error.message : "Unable to load that user.");
				}
			} finally {
				if (isMounted) {
					setIsLoadingUser(false);
				}
			}
		}

		void loadUser();

		return () => {
			isMounted = false;
		};
	}, [isEditMode, userId]);

	useEffect(() => {
		let isMounted = true;

		async function loadCustomers() {
			try {
				const response = await apiFetch("/customers", {
					cache: "no-store",
				});
				const payload = (await response.json()) as Array<{ customerId?: string; companyName?: string }>;

				if (!response.ok || !Array.isArray(payload) || !isMounted) {
					return;
				}

				setCustomers(payload.map((customer) => ({
					customerId: String(customer.customerId ?? ""),
					companyName: String(customer.companyName ?? ""),
				})));
			} catch {
				if (isMounted) {
					setCustomers([]);
				}
			}
		}

		void loadCustomers();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (selectedRole !== "Customer") {
			setCompanyName(selectedRole ? "Zero Waste" : "");
			setCustomerFocalPersons([]);
			setSelectedFocalPersonEmail("");
			return;
		}

		setCompanyName(getCompanyNameFromCustomerId(customerId, customers));
	}, [customerId, customers, selectedRole]);

	useEffect(() => {
		if (selectedRole !== "Customer" || !customerId.trim()) {
			setCustomerFocalPersons([]);
			setSelectedFocalPersonEmail("");
			return;
		}

		let isMounted = true;

		async function loadCustomerDetails() {
			setIsLoadingCustomerDetails(true);
			try {
				const response = await apiFetch(`/customers/${encodeURIComponent(customerId.trim())}`, {
					cache: "no-store",
				});
				const payload = (await response.json()) as CustomerDetails & { detail?: string };

				if (!response.ok) {
					throw new Error(payload.detail ?? "Unable to load customer focal persons.");
				}

				if (!isMounted) {
					return;
				}

				setCompanyName(String(payload.companyName ?? ""));
				setCustomerFocalPersons(Array.isArray(payload.focalPersons) ? payload.focalPersons : []);
			} catch {
				if (isMounted) {
					setCustomerFocalPersons([]);
				}
			} finally {
				if (isMounted) {
					setIsLoadingCustomerDetails(false);
				}
			}
		}

		void loadCustomerDetails();

		return () => {
			isMounted = false;
		};
	}, [customerId, selectedRole]);

	useEffect(() => {
		if (selectedRole !== "Customer" || !selectedFocalPersonEmail) {
			return;
		}

		const selectedFocalPerson = customerFocalPersons.find(
			(focalPerson) => focalPerson.email.toLowerCase() === selectedFocalPersonEmail.toLowerCase(),
		);

		if (!selectedFocalPerson) {
			return;
		}

		const { firstName: nextFirstName, lastName: nextLastName } = splitName(selectedFocalPerson.name);
		setFirstName(nextFirstName);
		setLastName(nextLastName);
		setEmailValue(selectedFocalPerson.email);
		setPosition(selectedFocalPerson.position);
		setDepartment(selectedFocalPerson.department);
		setMobile(selectedFocalPerson.mobilePhone);
	}, [customerFocalPersons, selectedFocalPersonEmail, selectedRole]);

	async function handleGenerateUserId() {
		setErrorMessage("");
		setIsGeneratingUserId(true);

		try {
			const response = await apiFetch("/users/next-id", {
				cache: "no-store",
			});
			const payload = (await response.json()) as { detail?: string; userId?: string };

			if (!response.ok || !payload.userId) {
				throw new Error(payload.detail ?? "Unable to generate a user ID right now.");
			}

			setGeneratedUserId(payload.userId);
			setGeneratedUserIdDate(formatDateForDisplay(new Date()));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to generate a user ID right now.");
		} finally {
			setIsGeneratingUserId(false);
		}
	}

	function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
		const nextRole = event.target.value;
		setErrorMessage("");
		setSelectedRole(nextRole);

		if (nextRole === "Admin" || nextRole === "Employee") {
			setCompanyName("Zero Waste");
			setCustomerId("");
			setCustomerFocalPersons([]);
			setSelectedFocalPersonEmail("");
			return;
		}

		setCompanyName(getCompanyNameFromCustomerId(customerId, customers));
	}

	function handleCustomerIdChange(event: ChangeEvent<HTMLInputElement>) {
		setErrorMessage("");
		const nextCustomerId = event.target.value.toUpperCase();
		setCustomerId(nextCustomerId);
		setSelectedFocalPersonEmail("");

		if (selectedRole !== "Customer") {
			return;
		}

		setCompanyName(getCompanyNameFromCustomerId(nextCustomerId, customers));
	}

	function handleFocalPersonSelection(event: ChangeEvent<HTMLSelectElement>) {
		setErrorMessage("");
		setSelectedFocalPersonEmail(event.target.value);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");

		if (!generatedUserId || !generatedUserIdDate) {
			setErrorMessage("Generate a user ID before submitting.");
			return;
		}

		const formData = new FormData(event.currentTarget);
		const password = String(formData.get("password") ?? "").trim();
		const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();
		const role = String(formData.get("role") ?? "").trim();

		if (!firstName.trim() || !lastName.trim() || !emailValue.trim() || !role || !companyName) {
			setErrorMessage("Complete all required fields before submitting.");
			return;
		}

		if (!isEditMode && (!password || !confirmPassword)) {
			setErrorMessage("Complete all required fields before submitting.");
			return;
		}

		if (role === "Customer" && !customerId.trim()) {
			setErrorMessage("Customer users must be linked to a customer CID.");
			return;
		}

		if (role === "Customer" && (!position.trim() || !department.trim() || !mobile.trim())) {
			setErrorMessage("Customer focal person users must include position, department, and mobile details.");
			return;
		}

		if (!isEditMode && password.length < 8) {
			setErrorMessage("Password must be at least 8 characters long.");
			return;
		}

		if (!isEditMode && password !== confirmPassword) {
			setErrorMessage("Passwords do not match.");
			return;
		}

		setIsSubmitting(true);

		try {
			const endpoint = isEditMode ? `/users/${encodeURIComponent(generatedUserId)}` : "/users";
			const response = await apiFetch(endpoint, {
				method: isEditMode ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(
					isEditMode
						? {
							firstName: firstName.trim(),
							lastName: lastName.trim(),
							email: emailValue.trim(),
							position: position.trim() || null,
							department: department.trim() || null,
							mobile: mobile.trim() || null,
							company: companyName,
							role,
							customerId: selectedRole === "Customer" ? customerId.trim() || null : null,
						}
						: {
							userIdDate: generatedUserIdDate,
							userId: generatedUserId,
							firstName: firstName.trim(),
							lastName: lastName.trim(),
							email: emailValue.trim(),
							position: position.trim() || null,
							department: department.trim() || null,
							mobile: mobile.trim() || null,
							password,
							company: companyName,
							role,
							customerId: selectedRole === "Customer" ? customerId.trim() || null : null,
						},
				),
			});

			const payload = (await response.json()) as UserRecord & { detail?: string };

			if (!response.ok) {
				setErrorMessage(payload.detail ?? `Unable to ${isEditMode ? "update" : "add"} that user right now.`);
				return;
			}

			router.push("/admin/users");
			router.refresh();
		} catch {
			setErrorMessage("Unable to reach the backend. Check that the API is running.");
		} finally {
			setIsSubmitting(false);
		}
	}

	const availableFocalPersons = customerFocalPersons.filter((focalPerson) => !focalPerson.hasUserAccount);

	return (
		<form className="flex w-full max-w-4xl flex-col gap-5 p-6" onSubmit={handleSubmit}>
			{errorMessage ? (
				<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 1</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">User Information</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					{sectionOneFields.map((field) => (
						<label key={field.id} className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">{field.label}</span>
							<input
								id={field.id}
								name={field.id}
								type={field.type}
								required
								value={field.id === "firstName" ? firstName : field.id === "lastName" ? lastName : emailValue}
								onChange={(event) => {
									setErrorMessage("");
									if (field.id === "firstName") {
										setFirstName(event.target.value);
										return;
									}

									if (field.id === "lastName") {
										setLastName(event.target.value);
										return;
									}

									setEmailValue(event.target.value);
								}}
								placeholder={field.placeholder}
								className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					))}

					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">User Role</span>
						<select
							id="role"
							name="role"
							value={selectedRole}
							onChange={handleRoleChange}
							required
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						>
							<option value="" disabled>
								Select user role
							</option>
							<option value="Admin">Admin</option>
							<option value="Employee">Employee</option>
							<option value="Customer">Customer</option>
						</select>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Company Name</span>
						<input
							id="companyName"
							name="companyName"
							type="text"
							value={companyName}
							readOnly
							placeholder={selectedRole === "Customer" ? "Auto-filled from CID" : "Zero Waste"}
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">CID</span>
						<input
							id="cid"
							name="cid"
							type="text"
							value={customerId}
							onChange={handleCustomerIdChange}
							required={selectedRole === "Customer"}
							disabled={selectedRole !== "Customer"}
							placeholder="Enter customer CID"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>
				</div>
			</section>

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 2</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Focal Person Details</h2>
				</div>

				<p className="text-sm leading-6 text-slate-600">
					Customer-role users are the focal persons who receive login access for a company. Use the linked CID to attach one or more focal persons to the same customer record.
				</p>

				{selectedRole === "Customer" ? (
					<div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<label className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">Use Existing Customer Focal Person</span>
							<select
								value={selectedFocalPersonEmail}
								onChange={handleFocalPersonSelection}
								disabled={!customerId || isLoadingCustomerDetails || availableFocalPersons.length === 0}
								className="h-10 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							>
								<option value="">Select focal person</option>
								{availableFocalPersons.map((focalPerson) => (
									<option key={focalPerson.email} value={focalPerson.email}>
										{`${focalPerson.name} (${focalPerson.email})`}
									</option>
								))}
							</select>
						</label>

						{customerId && !isLoadingCustomerDetails && customerFocalPersons.length === 0 ? (
							<p className="text-sm text-slate-500">No focal persons were found for that customer yet.</p>
						) : null}

						{customerId && !isLoadingCustomerDetails && customerFocalPersons.length > 0 && availableFocalPersons.length === 0 ? (
							<p className="text-sm text-slate-500">All stored focal persons already have registered customer user accounts.</p>
						) : null}
					</div>
				) : null}

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					{focalPersonFields.map((field) => (
						<label key={field.id} className="flex flex-col gap-1.5">
							<span className="text-sm font-medium text-slate-700">{field.label}</span>
							<input
								id={field.id}
								name={field.id}
								type={field.type}
								required={selectedRole === "Customer"}
								value={field.id === "position" ? position : field.id === "department" ? department : mobile}
								onChange={(event) => {
									setErrorMessage("");
									if (field.id === "position") {
										setPosition(event.target.value);
										return;
									}

									if (field.id === "department") {
										setDepartment(event.target.value);
										return;
									}

									setMobile(event.target.value);
								}}
								placeholder={field.placeholder}
								className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
						</label>
					))}
				</div>
			</section>

			{isEditMode ? null : (
			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">Section 3</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">Access Credentials</h2>
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Password</span>
						<div className="relative">
							<input
								id="password"
								name="password"
								type={showPasswords ? "text" : "password"}
								required
								minLength={8}
								placeholder="Enter password"
								className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
							<button
								type="button"
								onClick={() => setShowPasswords((current) => !current)}
								className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
								aria-label={showPasswords ? "Hide password" : "Show password"}
							>
								<PasswordVisibilityIcon isVisible={showPasswords} />
							</button>
						</div>
					</label>

					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-slate-700">Confirm Password</span>
						<div className="relative">
							<input
								id="confirmPassword"
								name="confirmPassword"
								type={showPasswords ? "text" : "password"}
								required
								minLength={8}
								placeholder="Re-enter password"
								className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
							<button
								type="button"
								onClick={() => setShowPasswords((current) => !current)}
								className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
								aria-label={showPasswords ? "Hide password" : "Show password"}
							>
								<PasswordVisibilityIcon isVisible={showPasswords} />
							</button>
						</div>
					</label>
				</div>
			</section>
			)}

			<section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#36B44D]">{isEditMode ? "Section 3" : "Section 4"}</p>
					<h2 className="text-xl font-light tracking-[-0.04em] text-slate-950">User ID</h2>
				</div>

				<div className="flex flex-col gap-4 md:flex-row md:items-end">
					<label className="flex flex-1 flex-col gap-1.5">
						<input
							id="userId"
							name="userId"
							type="text"
							value={generatedUserId}
							readOnly
							placeholder="UID-0001"
							className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
						/>
					</label>

					{isEditMode ? null : (
						<Button type="button" variant="secondary" onClick={() => void handleGenerateUserId()} disabled={isGeneratingUserId}>
							{isGeneratingUserId ? "Generating..." : "Generate UID"}
						</Button>
					)}
				</div>

				<label className="flex flex-col gap-1.5">
					<span className="text-sm font-medium text-slate-700">UID Date</span>
					<input
						id="userIdDate"
						name="userIdDate"
						type="text"
						value={generatedUserIdDate}
						readOnly
						placeholder="19-04-2026"
						className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
					/>
				</label>
			</section>

			<div className="flex justify-center pt-2">
				<Button type="submit" disabled={isSubmitting || isGeneratingUserId || !generatedUserId || !generatedUserIdDate || isLoadingCustomerDetails || isLoadingUser}>
					{isSubmitting ? "Saving User..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function getCompanyNameFromCustomerId(customerId: string, customers: CustomerRecord[]) {
	const normalizedCustomerId = customerId.trim().toUpperCase();
	return customers.find((customer) => customer.customerId.toUpperCase() === normalizedCustomerId)?.companyName ?? "";
}


function splitName(fullName: string) {
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return { firstName: "", lastName: "" };
	}

	if (parts.length === 1) {
		return { firstName: parts[0], lastName: parts[0] };
	}

	return {
		firstName: parts[0],
		lastName: parts.slice(1).join(" "),
	};
}

function PasswordVisibilityIcon({ isVisible }: Readonly<{ isVisible: boolean }>) {
	if (isVisible) {
		return (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
				<path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
				<path d="M10.58 10.58A2 2 0 0012 16a2 2 0 001.42-.58" strokeLinecap="round" strokeLinejoin="round" />
				<path d="M9.88 5.09A9.77 9.77 0 0112 4.8c5.4 0 9.27 4.63 10 6.2a11.68 11.68 0 01-4.04 4.77" strokeLinecap="round" strokeLinejoin="round" />
				<path d="M6.61 6.61A11.69 11.69 0 002 11c.73 1.57 4.6 6.2 10 6.2 1.55 0 2.98-.38 4.24-1.01" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		);
	}

	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
			<path d="M2 12c.73-1.57 4.6-6.2 10-6.2s9.27 4.63 10 6.2c-.73 1.57-4.6 6.2-10 6.2S2.73 13.57 2 12z" strokeLinecap="round" strokeLinejoin="round" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}