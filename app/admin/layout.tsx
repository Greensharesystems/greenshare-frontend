"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppShell from "@/app/components/layout/AppShell";
import EnterpriseSidebarNav, { SidebarFooterAction } from "@/app/components/layout/EnterpriseSidebarNav";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
import {
	adminGrowthLinks,
	adminLinks,
	adminTraceabilityLinks,
	growthFlyoutIcon,
	logoutIcon,
	settingsIcon,
	traceabilityFlyoutIcon,
} from "@/app/config/sidebarNavigation";
import useProtectedModule from "@/app/hooks/useProtectedModule";

export default function AdminLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const pathname = usePathname();
	const router = useRouter();
	const { session, isReady, logout, hasAccess } = useProtectedModule("admin");

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
			sidebarClassName="overflow-visible"
			header={
				<Header
					profile={
						<div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
							<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#36B44D] text-xs font-semibold text-white">
								{roleLetter}
							</div>
							<div className="hidden text-left sm:block">
								<p className="text-xs font-semibold text-slate-900">{session.displayName}</p>
							</div>
						</div>
					}
				/>
			}
			sidebar={
				<Sidebar
					navigation={
						<EnterpriseSidebarNav
							pathname={pathname}
							items={adminLinks}
							flyouts={[
								{ label: "Growth", icon: growthFlyoutIcon, items: adminGrowthLinks },
								{ label: "Traceability", icon: traceabilityFlyoutIcon, items: adminTraceabilityLinks },
							]}
						/>
					}
					footer={
						<div className="flex w-full flex-col items-center gap-2">
							<SidebarFooterAction href="/admin/settings" label="Settings" icon={settingsIcon} pathname={pathname} />
							<SidebarFooterAction label="Logout" icon={logoutIcon} onClick={handleLogout} />
						</div>
					}
				/>
			}
			contentClassName="bg-white"
		>
			{children}
		</AppShell>
	);
}
