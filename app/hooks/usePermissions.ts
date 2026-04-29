"use client";

import type { AuthRole } from "@/app/hooks/useAuth";


const ROLE_PATH_PREFIXES: Record<AuthRole, string> = {
	admin: "/admin",
	employee: "/employee",
	customer: "/customer",
};


export function canAccessPath(role: AuthRole, pathname: string) {
	const prefix = ROLE_PATH_PREFIXES[role];
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
