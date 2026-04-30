"use client";

import Image from "next/image";
import { Globe, Mail, Phone } from "lucide-react";
import { type ComponentType, type FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import ForgotPasswordModal from "@/app/components/modals/ForgotPasswordModal";
import { API_BASE_URL } from "@/app/utils/api";
import useAuth, { getRoleHomeRoute, isAuthRole, writeAuthSession } from "@/app/hooks/useAuth";

type ConnectIconProps = Readonly<{
	className?: string;
	strokeWidth?: number;
}>;

type ConnectItem = Readonly<{
	key: string;
	href: string;
	label: string;
	icon: ComponentType<ConnectIconProps>;
	external?: boolean;
	iconOnly?: boolean;
}>;


function LinkedinIcon({ className }: ConnectIconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
			<path d="M6.94 8.5H3.56V20h3.38V8.5Zm.22-3.56c0-1.06-.8-1.94-1.92-1.94-1.13 0-1.92.88-1.92 1.94 0 1.04.78 1.93 1.89 1.93h.02c1.15 0 1.93-.89 1.93-1.93ZM20.44 12.99c0-3.46-1.85-5.07-4.31-5.07-1.99 0-2.88 1.1-3.38 1.87V8.5H9.38c.04.86 0 11.5 0 11.5h3.37v-6.42c0-.34.03-.68.12-.92.27-.68.88-1.39 1.91-1.39 1.35 0 1.89 1.03 1.89 2.54V20h3.37v-7.01Z" />
		</svg>
	);
}


function InstagramIcon({ className }: ConnectIconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
			<rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="17.35" cy="6.65" r="1.1" fill="currentColor" />
		</svg>
	);
}


function FacebookIcon({ className }: ConnectIconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
			<path d="M13.37 20v-6.74h2.28l.34-2.63h-2.62V8.95c0-.76.21-1.28 1.3-1.28h1.39V5.31c-.24-.03-1.06-.1-2.02-.1-2 0-3.37 1.22-3.37 3.47v1.95H8.69v2.63h1.98V20h2.7Z" />
		</svg>
	);
}


function YoutubeIcon({ className }: ConnectIconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
			<path d="M21.58 7.19a2.77 2.77 0 0 0-1.95-1.96C17.91 4.75 12 4.75 12 4.75s-5.91 0-7.63.48A2.77 2.77 0 0 0 2.42 7.2c-.47 1.72-.47 4.8-.47 4.8s0 3.08.47 4.8a2.77 2.77 0 0 0 1.95 1.96c1.72.48 7.63.48 7.63.48s5.91 0 7.63-.48a2.77 2.77 0 0 0 1.95-1.96c.47-1.72.47-4.8.47-4.8s0-3.08-.47-4.8Z" stroke="currentColor" strokeWidth="1.5" />
			<path d="M10.25 9.5 15 12l-4.75 2.5V9.5Z" fill="currentColor" />
		</svg>
	);
}


function TiktokIcon({ className }: ConnectIconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
			<path d="M14.47 3.75c.32 1.86 1.42 3.36 3.17 4.1.55.23 1.13.36 1.73.39v2.63a7.6 7.6 0 0 1-4.86-1.75v5.27a5.63 5.63 0 1 1-4.86-5.58v2.74a2.9 2.9 0 1 0 2.13 2.79V3.75h2.65Z" />
		</svg>
	);
}

const connectItems: ReadonlyArray<ConnectItem> = [
	{
		key: "website",
		href: "https://www.zerowaste.ae",
		label: "www.zerowaste.ae",
		icon: Globe,
		external: true,
	},
	{
		key: "email",
		href: "mailto:care@zerowaste.ae",
		label: "care@zerowaste.ae",
		icon: Mail,
	},
	{
		key: "phone",
		href: "tel:+971561422288",
		label: "+971 56 142 2288",
		icon: Phone,
	},
];

export default function Home() {
	const router = useRouter();
	const { session, isReady } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!isReady || !session) {
			return;
		}

		router.replace(getRoleHomeRoute(session.role));
	}, [isReady, router, session]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");

		try {
			const response = await fetch(`${API_BASE_URL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const payload = (await response.json()) as {
				detail?: string;
				access_token?: string;
				token_type?: string;
				role?: string;
				user_id?: string;
				cid?: string | null;
			};

			if (!response.ok) {
				setErrorMessage(payload.detail ?? "Unable to sign in with those credentials.");
				return;
			}

			if (
				typeof payload.role !== "string"
				|| !isAuthRole(payload.role)
				|| typeof payload.user_id !== "string"
				|| typeof payload.access_token !== "string"
			) {
				setErrorMessage("Your account role is not recognized.");
				return;
			}

			writeAuthSession({
				email,
				displayName: email,
				identifier: payload.user_id,
				accountType: "user",
				role: payload.role,
				accessToken: payload.access_token,
				customerId: typeof payload.cid === "string" ? payload.cid : null,
			});

			const authenticatedRole = payload.role;

			startTransition(() => {
				router.push(getRoleHomeRoute(authenticatedRole));
			});
		} catch {
			setErrorMessage("Unable to reach the Greenshare backend.");
		}
	}

	if (isReady && session) {
		return null;
	}

	return (
		<>
			<main className="flex min-h-dvh flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(107,197,74,0.24),transparent_38%),linear-gradient(135deg,#f6faef_0%,#ffffff_44%,#f4f7f1_100%)] text-slate-900">
			<div className="mx-auto flex w-full max-w-400 flex-1 flex-col lg:flex-row">
				<section className="relative flex min-h-80 flex-1 overflow-hidden bg-white px-6 pb-12 pt-8 sm:px-10 lg:px-14 lg:pb-10 lg:pt-10">
					<div className="relative flex w-full flex-col">
						<div className="flex items-start justify-between gap-4">
							<div>
								<a
									href="https://www.zerowaste.ae"
									target="_blank"
									rel="noreferrer"
									aria-label="Visit Zero Waste website"
								>
									<Image
										src="/zerowastecolorlogo.png"
										alt="Zero Waste"
										width={320}
										height={52}
										priority
										className="h-auto w-20 sm:w-28"
									/>
								</a>
							</div>
						</div>

						<div className="flex flex-1 items-center justify-center py-8 lg:py-0">
							<Image
								src="/greensharemodel.png"
								alt="Green model illustration"
								width={520}
								height={520}
								priority
								className="h-auto w-full max-w-80 object-contain sm:max-w-95 lg:max-w-115"
							/>
						</div>
					</div>
				</section>

				<section className="flex flex-1 items-center justify-center bg-white px-6 pb-8 pt-2 sm:px-10 lg:px-14 lg:py-8">
					<div className="flex w-full max-w-md flex-col justify-center py-8">
						<div className="mb-10">
							<h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
								Welcome
							</h2>
							<p className="mt-2 text-lg font-normal text-slate-500">
								Log into Greenshare
							</p>
						</div>

						<div className="flex items-center justify-center">
							<form className="w-full space-y-4" onSubmit={handleSubmit}>
								<label className="block">
									<span className="mb-2 block text-sm font-medium text-slate-600">
										Email Address
									</span>
									<input
										type="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="Enter your registered email"
										autoComplete="email"
										required
										className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
									/>
								</label>

								<label className="block">
									<span className="mb-2 block text-sm font-medium text-slate-600">
										Password
									</span>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Enter your password"
											autoComplete="current-password"
											required
											className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-14 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/20"
										/>
										<button
											type="button"
											onClick={() => setShowPassword((current) => !current)}
											className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-600"
											aria-label={showPassword ? "Hide password" : "Show password"}
										>
											{showPassword ? (
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
													<path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
													<path d="M10.58 10.58A2 2 0 0012 16a2 2 0 001.42-.58" strokeLinecap="round" strokeLinejoin="round" />
													<path d="M9.88 5.09A9.77 9.77 0 0112 4.8c5.4 0 9.27 4.63 10 6.2a11.68 11.68 0 01-4.04 4.77" strokeLinecap="round" strokeLinejoin="round" />
													<path d="M6.61 6.61A11.69 11.69 0 002 11c.73 1.57 4.6 6.2 10 6.2 1.55 0 2.98-.38 4.24-1.01" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											) : (
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
													<path d="M2 12c.73-1.57 4.6-6.2 10-6.2s9.27 4.63 10 6.2c-.73 1.57-4.6 6.2-10 6.2S2.73 13.57 2 12z" strokeLinecap="round" strokeLinejoin="round" />
													<circle cx="12" cy="12" r="3" />
												</svg>
											)}
										</button>
									</div>
								</label>

								{errorMessage ? (
									<p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
										{errorMessage}
									</p>
								) : null}

								<div className="flex items-center justify-between gap-4 pt-1 text-sm">
									<label className="flex items-center gap-2 text-slate-500">
										<input
											type="checkbox"
											className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-200"
										/>
										Keep me signed in
									</label>
									<button
										type="button"
										onClick={() => setIsForgotPasswordOpen(true)}
										className="cursor-pointer font-medium text-emerald-700 transition hover:text-emerald-800"
									>
										Forgot password?
									</button>
								</div>

								<button
									type="submit"
									disabled={isPending}
									className="w-full rounded-2xl bg-[#36B44D] px-4 py-3.5 text-base font-semibold text-white shadow-[0_16px_32px_rgba(54,180,77,0.22)] transition hover:bg-[#2fa044] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-[#8ad39a]"
								>
									{isPending ? "Opening dashboard..." : "Log in"}
								</button>
							</form>
						</div>
					</div>
				</section>
			</div>

			<div className="bg-white px-6 pb-6 pt-8 sm:px-10 lg:px-14 lg:pt-10">
				<div className="mx-auto flex w-full max-w-400 justify-center">
					<div className="flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center text-sm text-slate-500">
						<span className="font-medium text-slate-500">Connect:</span>
						{connectItems.map((item) => {
							const Icon = item.icon;

							return (
								<a
									key={item.key}
									href={item.href}
									target={item.external ? "_blank" : undefined}
									rel={item.external ? "noreferrer" : undefined}
									aria-label={item.label}
									className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#00A779]"
								>
									<Icon strokeWidth={1.75} className="h-4 w-4 shrink-0" />
									{item.iconOnly ? null : <span>{item.label}</span>}
								</a>
							);
						})}
						<a
							href="https://www.linkedin.com/company/zerowasteme/"
							target="_blank"
							rel="noreferrer"
							aria-label="Zero Waste LinkedIn"
							className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#00A779]"
						>
							<span>Zero Waste</span>
							<LinkedinIcon className="h-4 w-4 shrink-0" />
						</a>
						<div className="inline-flex items-center gap-2 text-sm text-slate-500">
							<span>Greenshare</span>
							<a
								href="https://www.linkedin.com/company/greenshareme/"
								target="_blank"
								rel="noreferrer"
								aria-label="Greenshare LinkedIn"
								className="transition hover:text-[#00A779]"
							>
								<LinkedinIcon className="h-4 w-4 shrink-0" />
							</a>
							<a
								href="https://www.instagram.com/greenshareme"
								target="_blank"
								rel="noreferrer"
								aria-label="Greenshare Instagram"
								className="transition hover:text-[#00A779]"
							>
								<InstagramIcon className="h-4 w-4 shrink-0" />
							</a>
							<a
								href="https://www.facebook.com/greenshareme"
								target="_blank"
								rel="noreferrer"
								aria-label="Greenshare Facebook"
								className="transition hover:text-[#00A779]"
							>
								<FacebookIcon className="h-4 w-4 shrink-0" />
							</a>
							<a
								href="https://www.youtube.com/@greenshareme"
								target="_blank"
								rel="noreferrer"
								aria-label="Greenshare YouTube"
								className="transition hover:text-[#00A779]"
							>
								<YoutubeIcon className="h-4 w-4 shrink-0" />
							</a>
							<a
								href="https://www.tiktok.com/@greenshareme"
								target="_blank"
								rel="noreferrer"
								aria-label="Greenshare TikTok"
								className="transition hover:text-[#00A779]"
							>
								<TiktokIcon className="h-4 w-4 shrink-0" />
							</a>
						</div>
					</div>
				</div>
			</div>
			</main>
			<ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
		</>
	);
}
