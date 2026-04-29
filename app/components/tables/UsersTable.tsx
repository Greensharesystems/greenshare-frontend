"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import PasswordResetModal, { type PasswordResetPayload } from "@/app/components/modals/PasswordResetModal";
import { downloadUsersCsv } from "@/app/services/users.service";
import Button from "@/app/components/ui/Button";
import TableFilters, { sortTableRows, type TableFilterOption, type TableSortValue } from "@/app/components/ui/TableFilters";
import { apiFetch } from "@/app/utils/api";

const columns = ["User ID Date", "User ID", "User Name", "User Email", "Company", "Role", "Last Active", "Reset Password", "Actions"];

const userTableSortOptions: ReadonlyArray<TableFilterOption> = [
	{ label: "Date: Newest first", value: "date-desc" },
	{ label: "Date: Oldest first", value: "date-asc" },
	{ label: "User Name: A-Z", value: "customer-asc" },
	{ label: "User Name: Z-A", value: "customer-desc" },
];

type UserRow = Readonly<{
	userIdDate: string;
	userId: string;
	name: string;
	company: string;
	email: string;
	role: string;
	lastActive: string;
}>;

export default function UsersTable() {
	const pathname = usePathname();
	const router = useRouter();
	const [rows, setRows] = useState<ReadonlyArray<UserRow>>([]);
	const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [removingUserId, setRemovingUserId] = useState<string | null>(null);
	const [sortValue, setSortValue] = useState<TableSortValue>("date-desc");

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
					userIdDate?: string;
					userId?: string;
					userName?: string;
					company?: string;
					email?: string;
					role?: string;
					lastActive?: string;
				}> & { detail?: string };

				if (!response.ok) {
					throw new Error((payload as { detail?: string }).detail ?? "Unable to load users.");
				}

				if (!isActive) {
					return;
				}

				setRows(Array.isArray(payload) ? payload.map((user) => ({
					userIdDate: String(user.userIdDate ?? ""),
					userId: String(user.userId ?? ""),
					name: String(user.userName ?? ""),
					company: String(user.company ?? ""),
					email: String(user.email ?? ""),
					role: String(user.role ?? ""),
					lastActive: String(user.lastActive ?? ""),
				})) : []);
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

	async function loadUsers() {
		setIsLoading(true);
		setErrorMessage("");

		try {
			const response = await apiFetch("/users", {
				cache: "no-store",
			});
			const payload = (await response.json()) as Array<{
				userIdDate?: string;
				userId?: string;
				userName?: string;
				company?: string;
				email?: string;
				role?: string;
				lastActive?: string;
			}> & { detail?: string };

			if (!response.ok) {
				throw new Error((payload as { detail?: string }).detail ?? "Unable to load users.");
			}

			setRows(Array.isArray(payload) ? payload.map((user) => ({
				userIdDate: String(user.userIdDate ?? ""),
				userId: String(user.userId ?? ""),
				name: String(user.userName ?? ""),
				company: String(user.company ?? ""),
				email: String(user.email ?? ""),
				role: String(user.role ?? ""),
				lastActive: String(user.lastActive ?? ""),
			})) : []);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to load users.");
			setRows([]);
		} finally {
			setIsLoading(false);
		}
	}

	async function handleResetPassword(payload: PasswordResetPayload) {
		if (!selectedUser) {
			return;
		}

		setIsSubmitting(true);
		setErrorMessage("");

		try {
			const response = await apiFetch(`/users/${encodeURIComponent(selectedUser.userId)}/password`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ password: payload.password }),
			});

			if (!response.ok) {
				const responsePayload = (await response.json()) as { detail?: string };
				throw new Error(responsePayload.detail ?? "Unable to reset that password.");
			}

			setSelectedUser(null);
			await loadUsers();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to reset that password.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleRemoveUser(userId: string) {
		setRemovingUserId(userId);
		setErrorMessage("");

		try {
			const response = await apiFetch(`/users/${encodeURIComponent(userId)}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const payload = (await response.json()) as { detail?: string };
				throw new Error(payload.detail ?? "Unable to remove that user.");
			}

			await loadUsers();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to remove that user.");
		} finally {
			setRemovingUserId(null);
		}
	}

	async function handleDownloadCsv() {
		setErrorMessage("");
		setIsDownloadingCsv(true);

		try {
			await downloadUsersCsv(visibleRows.map((user) => user.userId));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to download the user dataset right now.");
		} finally {
			setIsDownloadingCsv(false);
		}
	}

	const visibleRows = sortTableRows(rows, sortValue, {
		date: (row) => row.userIdDate,
		customerName: (row) => row.name,
	});

	return (
		<>
			<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<TableFilters
					title="Table Filters"
					controls={[
						{
							key: "sort",
							type: "select",
							label: "Sort by",
							options: userTableSortOptions,
						},
					]}
					values={{ sort: sortValue }}
					onChange={(_, value) => setSortValue(value as TableSortValue)}
					className="flex-1"
				/>
				<div className="flex justify-start md:justify-end">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							void handleDownloadCsv();
						}}
						disabled={isLoading || isDownloadingCsv || visibleRows.length === 0}
						className="min-h-10 rounded-2xl px-4"
					>
						{isDownloadingCsv ? "Downloading..." : "Download CSV"}
					</Button>
				</div>
			</div>

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
						) : visibleRows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
									No users added yet.
								</td>
							</tr>
						) : visibleRows.map((row) => (
							<tr key={row.userId} className="border-b border-slate-200 last:border-b-0">
								<td className="px-3 py-2.5 text-slate-600">{row.userIdDate}</td>
								<td className="px-3 py-2.5 font-medium text-slate-900">{row.userId}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.name}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.email}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.company}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.role}</td>
								<td className="px-3 py-2.5 text-slate-600">{row.lastActive}</td>
								<td className="px-3 py-2.5">
									<Button variant="secondary" size="sm" className="min-h-6 rounded-lg px-1.5 py-0.5 text-[11px]" onClick={() => setSelectedUser(row)}>
										Reset Password
									</Button>
								</td>
								<td className="px-3 py-2.5">
									<div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
										<Button
											variant="secondary"
											size="sm"
											className="min-h-6 shrink-0 rounded-lg px-1.5 py-0.5 text-[11px]"
											onClick={() => router.push(`${pathname}?mode=edit&userId=${encodeURIComponent(row.userId)}`)}
										>
											Edit
										</Button>
										<Button
											variant="danger"
											size="sm"
											className="min-h-6 shrink-0 rounded-lg px-1.5 py-0.5 text-[11px]"
											onClick={() => void handleRemoveUser(row.userId)}
											disabled={removingUserId === row.userId}
										>
											{removingUserId === row.userId ? "Removing..." : "Remove"}
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<PasswordResetModal
				isOpen={selectedUser !== null}
				onClose={() => setSelectedUser(null)}
				onSubmit={handleResetPassword}
				userName={selectedUser?.name}
				userEmail={selectedUser?.email}
				isSubmitting={isSubmitting}
			/>
		</>
	);
}
