"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import useAuth, { getRoleHomeRoute, type AuthRole } from "@/app/hooks/useAuth";
import { canAccessPath } from "@/app/hooks/usePermissions";


export default function useProtectedModule(expectedRole: AuthRole) {
	const router = useRouter();
	const pathname = usePathname();
	const auth = useAuth();
	const { isReady, session } = auth;
	const sessionRole = session?.role;
	const hasAccess = sessionRole !== undefined && canAccessPath(sessionRole, pathname) && sessionRole === expectedRole;

	useEffect(() => {
		if (!isReady) {
			return;
		}

		if (!session) {
			router.replace("/");
			return;
		}

		if (session.role !== expectedRole || !canAccessPath(session.role, pathname)) {
			router.replace(getRoleHomeRoute(session.role));
		}
	}, [expectedRole, isReady, pathname, router, session]);

	return {
		...auth,
		hasAccess,
	};
}