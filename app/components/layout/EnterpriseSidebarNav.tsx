"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

import type { SidebarFlyout, SidebarNavItem } from "@/app/config/sidebarNavigation";


type EnterpriseSidebarNavProps = Readonly<{
	items?: SidebarNavItem[];
	flyouts?: SidebarFlyout[];
	pathname: string;
	extraItems?: SidebarNavItem[];
}>;

type SidebarFooterActionProps = Readonly<{
	href?: string;
	label: string;
	icon: LucideIcon;
	pathname?: string;
	onClick?: () => void;
}>;

const ACTIVE_CLASSES = "bg-[#EAF8ED] font-semibold text-[#34B34D]";
const INACTIVE_CLASSES = "text-[#257632] hover:bg-[#EAF8ED] hover:text-[#34B34D]";
const BASE_ITEM_CLASSES = "flex min-h-11 w-full max-w-full items-center rounded-2xl px-1 py-2 text-left text-[12px] font-medium leading-tight transition-colors duration-200 ease-in-out";
const FLYOUT_ITEM_CLASSES = "grid min-h-11 w-full max-w-full grid-cols-[minmax(0,1fr)_8px] items-center gap-0.5 rounded-2xl px-1 py-2 text-left text-[12px] font-medium leading-tight transition-colors duration-200 ease-in-out";
const BASE_SUBMENU_CLASSES = "flex w-full min-w-0 items-center rounded-2xl px-3 py-2 text-left text-[12px] font-medium leading-tight transition-colors duration-200 ease-in-out";


export default function EnterpriseSidebarNav({ items = [], flyouts = [], pathname, extraItems = [] }: EnterpriseSidebarNavProps) {
	return (
		<nav className="flex w-full flex-col items-center gap-2">
			{items.map((item) => <SidebarLink key={item.href} item={item} pathname={pathname} />)}
			{flyouts.map((flyout) => <SidebarFlyoutMenu key={flyout.label} flyout={flyout} pathname={pathname} />)}
			{extraItems.map((item) => <SidebarLink key={item.href} item={item} pathname={pathname} />)}
		</nav>
	);
}


export function SidebarFooterAction({ href, label, icon: Icon, pathname, onClick }: SidebarFooterActionProps) {
	const isActive = href ? pathname === href : false;
	const className = getItemClassName(isActive);
	const content = <SidebarItemContent icon={Icon} label={label} />;

	if (href) {
		return (
			<Link href={href} className={className}>
				{content}
			</Link>
		);
	}

	return (
		<button type="button" onClick={onClick} className={className}>
			{content}
		</button>
	);
}


function SidebarLink({ item, pathname }: Readonly<{ item: SidebarNavItem; pathname: string }>) {
	const isActive = pathname === item.href;

	return (
		<Link key={item.href} href={item.href} className={getItemClassName(isActive)}>
			<SidebarItemContent icon={item.icon} label={item.label} />
		</Link>
	);
}


function SidebarFlyoutMenu({ flyout, pathname }: Readonly<{ flyout: SidebarFlyout; pathname: string }>) {
	const isActive = flyout.items.some((item) => pathname === item.href);
	const TriggerIcon = flyout.icon;

	return (
		<div className="group relative flex w-full justify-center">
			<div className={getFlyoutItemClassName(isActive)}>
				<SidebarItemContent icon={TriggerIcon} label={flyout.label} hasArrow />
				<ChevronRight aria-hidden="true" className="h-2 w-2 shrink-0 text-current transition-colors duration-200 ease-in-out" strokeWidth={2} />
			</div>
			<div className="pointer-events-none invisible absolute left-full top-0 z-40 flex pl-2 opacity-0 transition-opacity duration-200 ease-in-out group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100">
				<div className="flex min-w-56 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
					{flyout.items.map((item) => {
						const isSubmenuActive = pathname === item.href;
						const SubmenuIcon = item.icon;

						return (
							<Link key={item.href} href={item.href} className={getSubmenuItemClassName(isSubmenuActive)}>
								<SubmenuIcon aria-hidden="true" className="mr-2 h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
								<span className="min-w-0 whitespace-normal leading-tight [overflow-wrap:normal] [word-break:normal]">{item.label}</span>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}


function SidebarItemContent({ icon: Icon, label, hasArrow = false }: Readonly<{ icon: LucideIcon; label: string; hasArrow?: boolean }>) {
	const isSingleWord = !label.includes(" ");
	const contentClassName = hasArrow
		? "grid min-w-0 max-w-full flex-1 grid-cols-[14px_minmax(0,1fr)] items-center gap-x-0.5 gap-y-0.5 text-[10.5px]"
		: "flex min-w-0 max-w-full flex-1 items-center justify-start gap-1.5";

	return (
		<span className={contentClassName}>
			<Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
			<span className={isSingleWord ? "min-w-0 whitespace-nowrap leading-tight" : "min-w-0 whitespace-normal leading-tight [overflow-wrap:normal] [word-break:normal]"}>{label}</span>
		</span>
	);
}


function getItemClassName(isActive: boolean) {
	return [BASE_ITEM_CLASSES, isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES].join(" ");
}


function getFlyoutItemClassName(isActive: boolean) {
	return [FLYOUT_ITEM_CLASSES, isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES].join(" ");
}


function getSubmenuItemClassName(isActive: boolean) {
	return [BASE_SUBMENU_CLASSES, isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES].join(" ");
}