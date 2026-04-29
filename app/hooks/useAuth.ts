"use client";

import { useEffect, useState } from "react";


export type AuthRole = "admin" | "employee" | "customer";
export type AccountType = "user";

export type AuthSession = Readonly<{
	email: string;
	displayName: string;
	identifier: string;
	accountType: AccountType;
	role: AuthRole;
	accessToken: string;
	customerId?: string | null;
}>;

const AUTH_STORAGE_KEY = "greenshare.auth";
const AUTH_EVENT_NAME = "greenshare:auth-changed";

const ROLE_HOME_ROUTES: Record<AuthRole, string> = {
	admin: "/admin/dashboard",
	employee: "/employee/dashboard",
	customer: "/customer/dashboard",
};


export function getRoleHomeRoute(role: AuthRole) {
	return ROLE_HOME_ROUTES[role];
}


export function isAuthRole(value: string): value is AuthRole {
	return value === "admin" || value === "employee" || value === "customer";
}


export function readAuthSession(): AuthSession | null {
	if (typeof window === "undefined") {
		return null;
	}

	const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

	if (!storedValue) {
		return null;
	}

	try {
		const parsedValue = JSON.parse(storedValue) as Partial<AuthSession>;

		if (
			typeof parsedValue.email !== "string"
			|| typeof parsedValue.displayName !== "string"
			|| typeof parsedValue.identifier !== "string"
			|| parsedValue.accountType !== "user"
			|| typeof parsedValue.role !== "string"
			|| typeof parsedValue.accessToken !== "string"
			|| !isAuthRole(parsedValue.role)
		) {
			return null;
		}

		return {
			email: parsedValue.email,
			displayName: parsedValue.displayName,
			identifier: parsedValue.identifier,
			accountType: parsedValue.accountType,
			role: parsedValue.role,
			accessToken: parsedValue.accessToken,
			customerId: typeof parsedValue.customerId === "string" ? parsedValue.customerId : null,
		};
	} catch {
		return null;
	}
}


export function writeAuthSession(session: AuthSession) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
	window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}


export function clearAuthSession() {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.removeItem(AUTH_STORAGE_KEY);
	window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}


export default function useAuth() {
	const [session, setSession] = useState<AuthSession | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		function syncSession() {
			setSession(readAuthSession());
			setIsReady(true);
		}

		syncSession();
		window.addEventListener("storage", syncSession);
		window.addEventListener(AUTH_EVENT_NAME, syncSession);

		return () => {
			window.removeEventListener("storage", syncSession);
			window.removeEventListener(AUTH_EVENT_NAME, syncSession);
		};
	}, []);

	return {
		session,
		isReady,
		login: writeAuthSession,
		logout: clearAuthSession,
	};
}
