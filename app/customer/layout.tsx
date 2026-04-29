"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AppShell from "@/app/components/layout/AppShell";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
import useCustomerProfile from "@/app/hooks/useCustomerProfile";
import useProtectedModule from "@/app/hooks/useProtectedModule";
import {
	CUSTOMER_BACKGROUND_EVENT,
	CUSTOMER_BACKGROUND_STORAGE_KEY,
	resolveCustomerBackgroundOption,
} from "@/app/utils/customerBackground";

const customerLinks = [
	{ href: "/customer/dashboard", label: "Dashboard" },
	{ href: "/customer/certificates", label: "Certificates" },
	{ href: "/customer/traceability", label: "Traceability" },
	{ href: "/customer/reports", label: "Reports" },
];

export default function CustomerLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const router = useRouter();
	const { session, isReady, logout, hasAccess } = useProtectedModule("customer");
	const { profile } = useCustomerProfile();
	const [appBackgroundClassName, setAppBackgroundClassName] = useState(resolveCustomerBackgroundOption(undefined).appClassName);
	const companyName = profile?.companyName ?? "";

	useEffect(() => {
		function applyStoredBackground() {
			const storedValue = window.localStorage.getItem(CUSTOMER_BACKGROUND_STORAGE_KEY);
			setAppBackgroundClassName(resolveCustomerBackgroundOption(storedValue).appClassName);
		}

		applyStoredBackground();
		window.addEventListener("storage", applyStoredBackground);
		window.addEventListener(CUSTOMER_BACKGROUND_EVENT, applyStoredBackground);

		return () => {
			window.removeEventListener("storage", applyStoredBackground);
			window.removeEventListener(CUSTOMER_BACKGROUND_EVENT, applyStoredBackground);
		};
	}, []);

	if (!isReady || !session || !hasAccess) {
		return null;
	}

	function handleLogout() {
		logout();
		router.replace("/");
	}

	return (
		<AppShell
			className={appBackgroundClassName}
			headerClassName={appBackgroundClassName}
			header={
				<Header
					className={appBackgroundClassName}
					profile={
						<div className="flex min-w-44 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
							<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#36B44D] text-xs font-semibold text-white">
								C
							</div>
							<div className="hidden min-w-0 text-left sm:block">
								<p className="truncate text-xs font-semibold text-slate-900">{companyName}</p>
							</div>
						</div>
					}
				/>
			}
			sidebarClassName={appBackgroundClassName}
			sidebar={
				<Sidebar
					className={appBackgroundClassName}
					navigation={
						<nav className="flex w-full flex-col items-center gap-2">
							{customerLinks.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#3CD05A]"
								>
									<span className={item.label === "Dashboard" || item.label === "Certificates" || item.label === "Traceability" || item.label === "Reports" ? "inline-flex -translate-x-2 items-center gap-1.25" : "inline-flex items-center gap-1.25"}>
										{item.label === "Dashboard" ? <Image src="/icons/dashboardicon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
										{item.label === "Certificates" ? <Image src="/icons/certificates-icon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
										{item.label === "Traceability" ? <Image src="/icons/traceability-icon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
										{item.label === "Reports" ? <Image src="/icons/reports-icon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
										<span className={item.label === "Dashboard" || item.label === "Certificates" || item.label === "Traceability" || item.label === "Reports" ? "text-[11px]" : undefined}>{item.label}</span>
									</span>
								</Link>
							))}
						</nav>
					}
					footer={
						<div className="flex w-full flex-col items-center gap-2">
							<Link
								href="/customer/settings"
								className="flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#3CD05A]"
							>
								<span className="inline-flex -translate-x-2 items-center gap-1.25">
									<Image src="/icons/settings-icon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
									<span className="text-[11px]">Settings</span>
								</span>
							</Link>
							<button
								type="button"
								onClick={handleLogout}
								className="flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#3CD05A]"
							>
								<span className="inline-flex -translate-x-2 items-center gap-1.25">
									<Image src="/icons/logout-icon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
									<span className="text-[11px]">Logout</span>
								</span>
							</button>
						</div>
					}
				/>
			}
			contentClassName={appBackgroundClassName}
		>
			{children}
		</AppShell>
	);
}
