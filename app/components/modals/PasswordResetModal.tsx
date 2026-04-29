"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";

import Button from "@/app/components/ui/Button";

export type PasswordResetPayload = Readonly<{
	password: string;
}>;

type PasswordResetModalProps = Readonly<{
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (payload: PasswordResetPayload) => void | Promise<void>;
	userName?: string;
	userEmail?: string;
	isSubmitting?: boolean;
}>;

export default function PasswordResetModal({
	isOpen,
	onClose,
	onSubmit,
	userName,
	userEmail,
	isSubmitting = false,
}: PasswordResetModalProps) {
	const formRef = useRef<HTMLFormElement>(null);
	const passwordInputRef = useRef<HTMLInputElement>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	if (!isOpen) {
		return null;
	}

	function handleClose() {
		formRef.current?.reset();
		setErrorMessage(null);
		setShowPassword(false);
		onClose();
	}

	function handleGeneratePassword() {
		const generatedPassword = generatePassword();

		if (passwordInputRef.current) {
			passwordInputRef.current.value = generatedPassword;
		}

		setErrorMessage(null);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const password = String(formData.get("password") ?? "");

		if (password.length < 8) {
			setErrorMessage("Password must be at least 8 characters long.");
			return;
		}

		setErrorMessage(null);

		await onSubmit?.({ password });
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
			<div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-2">
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Security</p>
						<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Reset Password</h2>
						<p className="text-sm leading-6 text-slate-600">
							Set a new password for {userName ?? "this user"}
							{userEmail ? ` (${userEmail})` : ""}.
						</p>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
						aria-label="Close password reset modal"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
							<path d="M4 4 12 12M12 4 4 12" strokeLinecap="round" />
						</svg>
					</button>
				</div>

				<form ref={formRef} className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
					<label className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between gap-3">
							<span className="text-sm font-medium text-slate-700">New Password</span>
							<Button type="button" variant="ghost" size="sm" onClick={handleGeneratePassword} disabled={isSubmitting}>
								Auto Generate
							</Button>
						</div>
						<div className="relative">
							<input
								ref={passwordInputRef}
								name="password"
								type={showPassword ? "text" : "password"}
								onChange={() => setErrorMessage(null)}
								placeholder="Enter a new password"
								className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((current) => !current)}
								className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								<PasswordVisibilityIcon isVisible={showPassword} />
							</button>
						</div>
					</label>

					<p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
						Use at least 8 characters and avoid reusing previous passwords.
					</p>

					{errorMessage ? (
						<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
					) : null}

					<div className="flex flex-wrap justify-end gap-3 pt-2">
						<Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Resetting..." : "Reset Password"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function generatePassword(length = 12) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
	const randomValues = crypto.getRandomValues(new Uint32Array(length));

	return Array.from(randomValues, (value) => charset[value % charset.length]).join("");
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
