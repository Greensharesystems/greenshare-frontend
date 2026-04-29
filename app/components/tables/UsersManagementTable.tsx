"use client";

import { useRouter } from "next/navigation";

import Button from "@/app/components/ui/Button";

const columns = ["User ID", "Name", "Role", "Access Level", "Status", "Actions"];

const rows = [
	["USR-001", "Aisha Khan", "Admin", "Full Access", "Active"],
	["USR-002", "Omar Saeed", "Employee", "Limited Access", "Active"],
	["USR-003", "Fatima Noor", "Customer", "View Only", "Pending"],
	["USR-004", "Yousef Ali", "Employee", "Limited Access", "Active"],
	["USR-005", "Mariam Adel", "Customer", "View Only", "Inactive"],
	["USR-006", "Khalid Hassan", "Admin", "Full Access", "Active"],
	["USR-007", "Lina Ahmed", "Employee", "Limited Access", "Active"],
	["USR-008", "Rami Nasser", "Customer", "View Only", "Pending"],
	["USR-009", "Sara Ibrahim", "Employee", "Limited Access", "Active"],
	["USR-010", "Huda Karim", "Customer", "View Only", "Active"],
];

export default function UsersManagementTable() {
	const router = useRouter();

	return (
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
					{rows.map((row) => (
						<tr key={row[0]} className="border-b border-slate-200 last:border-b-0">
							{row.map((cell) => (
								<td key={`${row[0]}-${cell}`} className="px-3 py-2.5 text-slate-600">
									{cell}
								</td>
							))}
							<td className="px-3 py-2.5 text-slate-600">
								<Button
									variant="secondary"
									size="sm"
									className="min-h-6 rounded-lg px-1.5 py-0.5 text-[11px]"
									onClick={() => router.push("/admin/access-control")}
								>
									Edit Access
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
