import {
	Award,
	Bot,
	Building2,
	ClipboardList,
	Database,
	FileCheck,
	FileText,
	LayoutDashboard,
	LogOut,
	Recycle,
	Settings,
	ShieldCheck,
	Target,
	TrendingUp,
	Users,
	type LucideIcon,
} from "lucide-react";


export type SidebarNavItem = Readonly<{
	href: string;
	label: string;
	icon: LucideIcon;
}>;

export type SidebarFlyout = Readonly<{
	label: string;
	icon: LucideIcon;
	items: SidebarNavItem[];
}>;

export const adminLinks: SidebarNavItem[] = [
	{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/users", label: "Users", icon: Users },
	{ href: "/admin/customers", label: "Customers", icon: Building2 },
	{ href: "/admin/access-control", label: "Access Control", icon: ShieldCheck },
];

export const adminGrowthLinks: SidebarNavItem[] = [
	{ href: "/admin/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/crm/leads", label: "Leads", icon: Target },
	{ href: "/admin/crm/stream-codes", label: "Stream Codes", icon: Database },
	{ href: "/admin/crm/proposals", label: "Proposals", icon: FileText },
];

export const adminTraceabilityLinks: SidebarNavItem[] = [
	{ href: "/admin/traceability/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/traceability/reception-notes", label: "Reception Notes", icon: ClipboardList },
	{ href: "/admin/traceability/reception-certificates", label: "Reception Certificates", icon: FileCheck },
	{ href: "/admin/traceability/circularity-certificates", label: "Circularity Certificates", icon: Award },
];

export const employeeGrowthLinks: SidebarNavItem[] = [
	{ href: "/employee/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/employee/crm/leads", label: "Leads", icon: Target },
	{ href: "/employee/crm/proposals", label: "Proposals", icon: FileText },
];

export const employeeTraceabilityLinks: SidebarNavItem[] = [
	{ href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/employee/reception-notes", label: "Reception Notes", icon: ClipboardList },
	{ href: "/employee/reception-certificate", label: "Reception Certificate", icon: FileCheck },
	{ href: "/employee/circularity-certificate", label: "Circularity Certificate", icon: Award },
];

export const customerLinks: SidebarNavItem[] = [
	{ href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/customer/certificates", label: "Certificates", icon: FileCheck },
	{ href: "/customer/traceability", label: "Traceability", icon: Recycle },
	{ href: "/customer/reports", label: "Reports", icon: FileText },
];

export const growthFlyoutIcon = TrendingUp;
export const traceabilityFlyoutIcon = Recycle;
export const greeIcon = Bot;
export const settingsIcon = Settings;
export const logoutIcon = LogOut;