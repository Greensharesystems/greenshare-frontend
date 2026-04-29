"use client";

import { useEffect, useState } from "react";

import useAuth from "@/app/hooks/useAuth";
import { getCustomerProfile, type CustomerProfile } from "@/app/services/customerProfile.service";


export default function useCustomerProfile() {
	const { isReady, session } = useAuth();
	const [profile, setProfile] = useState<CustomerProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!isReady) {
			return;
		}

		if (!session || session.role !== "customer") {
			setProfile(null);
			setError("");
			setLoading(false);
			return;
		}

		let isMounted = true;

		async function loadCustomerProfile() {
			setLoading(true);
			setError("");

			try {
				const nextProfile = await getCustomerProfile();

				if (!isMounted) {
					return;
				}

				setProfile(nextProfile);
			} catch (loadError) {
				if (!isMounted) {
					return;
				}

				setProfile(null);
				setError(loadError instanceof Error ? loadError.message : "Unable to load the customer profile.");
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		void loadCustomerProfile();

		return () => {
			isMounted = false;
		};
	}, [isReady, session]);

	return {
		profile,
		loading,
		error,
	};
}