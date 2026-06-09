"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import AppShell from "@/app/components/layout/AppShell";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
import useProtectedModule from "@/app/hooks/useProtectedModule";

const adminLinks = [
	{ href: "/admin/dashboard", label: "Dashboard" },
	{ href: "/admin/users", label: "Users" },
	{ href: "/admin/customers", label: "Customers" },
	{ href: "/admin/access-control", label: "Access Control" },
];

const adminGrowthLinks = [
	{ href: "/admin/crm/dashboard", label: "Dashboard" },
	{ href: "/admin/crm/leads", label: "Leads" },
	{ href: "/admin/crm/stream-codes", label: "Stream Codes" },
	{ href: "/admin/crm/proposals", label: "Proposals" },
];

const adminTraceabilityLinks = [
	{ href: "/admin/traceability/dashboard", label: "Dashboard" },
	{ href: "/admin/traceability/reception-notes", label: "Reception Notes" },
	{ href: "/admin/traceability/reception-certificates", label: "Reception Certificates" },
	{ href: "/admin/traceability/circularity-certificates", label: "Circularity Certificates" },
];

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

	function getNavItemClassName(isActive: boolean) {
		return [
			"flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium transition",
			isActive ? "font-semibold text-green-600" : "text-slate-600 hover:bg-slate-100 hover:text-[#3CD05A]",
		].join(" ");
	}

	function getSubmenuItemClassName(isActive: boolean) {
		return [
			"flex w-full items-center rounded-2xl px-4 py-2 text-left text-xs font-medium transition",
			isActive ? "font-semibold text-green-600" : "text-slate-600 hover:bg-slate-100 hover:text-[#3CD05A]",
		].join(" ");
	}

	function getFlyoutTriggerClassName() {
		return "flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#3CD05A] group-hover:bg-slate-100 group-hover:text-[#3CD05A]";
	}

	function renderNavLink(item: { href: string; label: string }) {
		const isActive = pathname === item.href;

		return (
			<Link key={item.href} href={item.href} className={getNavItemClassName(isActive)}>
				<span className={item.label === "Dashboard" ? "inline-flex -translate-x-2 items-center gap-1.25" : "inline-flex items-center gap-1.25"}>
					{item.label === "Dashboard" ? <Image src="/icons/dashboardicon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
					<span className={item.label === "Dashboard" ? "text-[11px]" : undefined}>{item.label}</span>
				</span>
			</Link>
		);
	}

	function renderSubmenuLink(item: { href: string; label: string }) {
		const isActive = pathname === item.href;

		return (
			<Link key={item.href} href={item.href} className={getSubmenuItemClassName(isActive)}>
				<span>{item.label}</span>
			</Link>
		);
	}

	function renderFlyoutMenu(label: string, items: Array<{ href: string; label: string }>) {
		return (
			<div className="group relative flex w-full justify-center">
				<div className={getFlyoutTriggerClassName()}>
					<span className="inline-flex items-center gap-1.5">
						<span>{label}</span>
						<span aria-hidden="true" className="text-[10px] text-slate-400 transition group-hover:text-[#3CD05A]">
							&gt;
						</span>
					</span>
				</div>
				<div className="pointer-events-none invisible absolute left-full top-0 z-40 flex pl-2 opacity-0 transition group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100">
					<div className="flex min-w-44 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
						{items.map(renderSubmenuLink)}
					</div>
				</div>
			</div>
		);
	}

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
						<nav className="flex w-full flex-col items-center gap-2">
							{adminLinks.map(renderNavLink)}
							{renderFlyoutMenu("Growth", adminGrowthLinks)}
							{renderFlyoutMenu("Traceability", adminTraceabilityLinks)}
						</nav>
					}
					footer={
						<div className="flex w-full flex-col items-center gap-2">
							<Link
								href="/admin/settings"
								className="flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#3CD05A]"
							>
								Settings
							</Link>
							<button
								type="button"
								onClick={handleLogout}
								className="flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 hover:text-[#3CD05A]"
							>
								Logout
							</button>
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
