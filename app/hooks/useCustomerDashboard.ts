"use client";

import { useEffect, useState } from "react";

import useAuth from "@/app/hooks/useAuth";
import { getCustomerDashboard, type CustomerDashboardData } from "@/app/services/customerDashboard.service";


export default function useCustomerDashboard() {
	const { session, isReady } = useAuth();
	const [data, setData] = useState<CustomerDashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!isReady) {
			return;
		}

		if (!session) {
			setData(null);
			setError("");
			setLoading(false);
			return;
		}

		if (session.role !== "customer") {
			setData(null);
			setError("");
			setLoading(false);
			return;
		}

		let isMounted = true;

		async function loadCustomerDashboard() {
			setError("");
			setLoading(true);

			try {
				const dashboardData = await getCustomerDashboard();

				if (!isMounted) {
					return;
				}

				setData(dashboardData);
			} catch (loadError) {
				if (!isMounted) {
					return;
				}

				setData(null);
				setError(loadError instanceof Error ? loadError.message : "Unable to load customer dashboard data.");
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		void loadCustomerDashboard();

		return () => {
			isMounted = false;
		};
	}, [isReady, session]);

	return {
		data,
		loading,
		error,
	};
}
