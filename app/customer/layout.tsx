"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppShell from "@/app/components/layout/AppShell";
import EnterpriseSidebarNav, { SidebarFooterAction } from "@/app/components/layout/EnterpriseSidebarNav";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
import { customerLinks, logoutIcon, settingsIcon } from "@/app/config/sidebarNavigation";
import useProtectedModule from "@/app/hooks/useProtectedModule";
import {
	CUSTOMER_BACKGROUND_EVENT,
	CUSTOMER_BACKGROUND_STORAGE_KEY,
	resolveCustomerBackgroundOption,
} from "@/app/utils/customerBackground";

export default function CustomerLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const pathname = usePathname();
	const router = useRouter();
	const { session, isReady, logout, hasAccess } = useProtectedModule("customer");
	const [appBackgroundClassName, setAppBackgroundClassName] = useState(resolveCustomerBackgroundOption(undefined).appClassName);

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

	const roleLetter = session.role === "admin" ? "A" : session.role === "customer" ? "C" : "E";

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
								{roleLetter}
							</div>
							<div className="hidden min-w-0 text-left sm:block">
								<p className="truncate text-xs font-semibold text-slate-900">{session.displayName}</p>
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
						<EnterpriseSidebarNav pathname={pathname} items={customerLinks} />
					}
					footer={
						<div className="flex w-full flex-col items-center gap-2">
							<SidebarFooterAction href="/customer/settings" label="Settings" icon={settingsIcon} pathname={pathname} />
							<SidebarFooterAction label="Logout" icon={logoutIcon} onClick={handleLogout} />
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
