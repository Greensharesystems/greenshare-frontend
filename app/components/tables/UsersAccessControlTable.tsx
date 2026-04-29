"use client";

import { useEffect, useState } from "react";

import AccessControl from "@/app/components/ui/AccessControl";
import { apiFetch } from "@/app/utils/api";
const columns = ["User ID", "User Name", "User Email", "Company", "Role", "Access Control"];

type UserAccessRow = Readonly<{
	userId: string;
	userName: string;
	email: string;
	company: string;
	role: string;
}>;

export default function EditUsersAccessTable() {
	const [rows, setRows] = useState<ReadonlyArray<UserAccessRow>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		let isActive = true;

		async function loadUsers() {
			setIsLoading(true);
			setErrorMessage("");

			try {
				const response = await apiFetch("/users", {
					cache: "no-store",
				});
				const payload = (await response.json()) as Array<{
					userId?: string;
					userName?: string;
					email?: string;
					company?: string;
					role?: string;
				}> & { detail?: string };

				if (!response.ok) {
					throw new Error((payload as { detail?: string }).detail ?? "Unable to load users.");
				}

				if (!isActive) {
					return;
				}

				setRows(
					Array.isArray(payload)
						? payload.map((user) => ({
							userId: String(user.userId ?? ""),
							userName: String(user.userName ?? ""),
							email: String(user.email ?? ""),
							company: String(user.company ?? ""),
							role: String(user.role ?? ""),
						}))
						: [],
				);
			} catch (error) {
				if (!isActive) {
					return;
				}

				setErrorMessage(error instanceof Error ? error.message : "Unable to load users.");
				setRows([]);
			} finally {
				if (isActive) {
					setIsLoading(false);
				}
			}
		}

		void loadUsers();

		return () => {
			isActive = false;
		};
	}, []);

	return (
		<>
			{errorMessage ? (
				<p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
			) : null}

			<div className="w-full overflow-x-auto">
				<table className="min-w-full border-collapse text-left text-xs text-slate-700">
					<thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-[0.16em] text-slate-500">
						<tr>
							{columns.map((column) => (
								<th key={column} className="px-3 py-2.5 font-semibold">
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									Loading users...
								</td>
							</tr>
						) : rows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									No users available.
								</td>
							</tr>
						) : rows.map((row) => (
							<tr key={row.userId} className="border-b border-slate-200 last:border-b-0">
								<td className="px-3 py-2.5 text-slate-600">{row.userId}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.userName}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.email}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.company}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.role}</td>
								<td className="px-3 py-2.5 text-slate-600">
									<AccessControl role={row.role} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	);
}
