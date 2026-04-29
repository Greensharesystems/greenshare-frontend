"use client";

import { apiFetch } from "@/app/utils/api";


export type CustomerProfile = Readonly<{
	id: number;
	customerIdDate: string;
	customerId: string;
	companyName: string;
	companyEmirate: string;
	area: string;
	officeAddress: string;
	website: string;
	sector: string;
	contactPersonName: string;
	contactPersonPosition: string;
	contactPersonDepartment: string;
	contactPersonEmail: string;
	contactPersonOfficePhone: string;
	contactPersonMobilePhone: string;
	lastActive: string;
}>;

type CustomerProfileResponse = CustomerProfile | Readonly<{
	detail?: string;
}>;


export async function getCustomerProfile(): Promise<CustomerProfile> {
	const response = await apiFetch("/customers/me", {
		cache: "no-store",
	});
	const payload = (await response.json()) as CustomerProfileResponse;

	if (!response.ok || !isCustomerProfile(payload)) {
		throw new Error("detail" in payload ? payload.detail ?? "Unable to load the customer profile." : "Unable to load the customer profile.");
	}

	return payload;
}


function isCustomerProfile(payload: CustomerProfileResponse): payload is CustomerProfile {
	return typeof payload === "object"
		&& payload !== null
		&& "companyName" in payload
		&& typeof payload.companyName === "string"
		&& "customerId" in payload
		&& typeof payload.customerId === "string";
}