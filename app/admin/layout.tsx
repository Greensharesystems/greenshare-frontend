"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AppShell from "@/app/components/layout/AppShell";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
import useProtectedModule from "@/app/hooks/useProtectedModule";

const adminLinks = [
	{ href: "/admin/dashboard", label: "Dashboard" },
	{ href: "/admin/users", label: "Users" },
	{ href: "/admin/customers", label: "Customers" },
	{ href: "/admin/access-control", label: "Access Control" },
	{ href: "/admin/records", label: "Records" },
	{ href: "/admin/certificates", label: "Certificates" },
];

export default function AdminLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const router = useRouter();
	const { session, isReady, logout, hasAccess } = useProtectedModule("admin");

	if (!isReady || !session || !hasAccess) {
		return null;
	}

	function handleLogout() {
		logout();
		router.replace("/");
	}

	return (
		<AppShell
			header={
				<Header
					profile={
						<div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
							<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#36B44D] text-xs font-semibold text-white">
								A
							</div>
							<div className="hidden text-left sm:block">
								<p className="text-xs font-semibold text-slate-900">{session.displayName}</p>
								<p className="text-xs text-slate-500">Administrator</p>
							</div>
						</div>
					}
				/>
			}
			sidebar={
				<Sidebar
					navigation={
						<nav className="flex w-full flex-col items-center gap-2">
							{adminLinks.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="flex min-h-11 w-full items-center justify-center rounded-2xl px-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#3CD05A]"
								>
									<span className={item.label === "Dashboard" ? "inline-flex -translate-x-2 items-center gap-1.25" : "inline-flex items-center gap-1.25"}>
										{item.label === "Dashboard" ? <Image src="/icons/dashboardicon.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
										<span className={item.label === "Dashboard" ? "text-[11px]" : undefined}>{item.label}</span>
									</span>
								</Link>
							))}
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
