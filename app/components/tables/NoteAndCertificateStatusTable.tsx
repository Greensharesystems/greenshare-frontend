const columns = [
	"Status ID",
	"Customer",
	"Reception Note",
	"Certificate Type",
	"Submission Date",
	"Current Status",
	"Reviewed By",
	"Last Update",
];

const rows = [
	["STS-001", "Noor Trading", "RN-2101", "Reception Certificate", "27 Mar 2026", "Approved", "Aisha Khan", "Today, 09:10"],
	["STS-002", "Green Mart", "RN-2102", "Circularity Certificate", "26 Mar 2026", "Pending", "Omar Saeed", "Today, 08:45"],
	["STS-003", "Eco Foods", "RN-2103", "Reception Certificate", "25 Mar 2026", "Draft", "Fatima Noor", "Yesterday"],
	["STS-004", "Palm Supplies", "RN-2104", "Circularity Certificate", "24 Mar 2026", "Approved", "Yousef Ali", "Today, 07:55"],
	["STS-005", "Clean Loop", "RN-2105", "Reception Certificate", "23 Mar 2026", "Rejected", "Mariam Adel", "2 days ago"],
	["STS-006", "Urban Harvest", "RN-2106", "Circularity Certificate", "22 Mar 2026", "Pending", "Khalid Hassan", "Today, 10:20"],
	["STS-007", "Blue Bay Cafe", "RN-2107", "Reception Certificate", "21 Mar 2026", "Approved", "Lina Ahmed", "Today, 11:05"],
	["STS-008", "Fresh Basket", "RN-2108", "Circularity Certificate", "20 Mar 2026", "Draft", "Rami Nasser", "Yesterday"],
	["STS-009", "Sunrise Hotel", "RN-2109", "Reception Certificate", "19 Mar 2026", "Approved", "Sara Ibrahim", "Today, 12:00"],
	["STS-010", "Golden Spoon", "RN-2110", "Circularity Certificate", "18 Mar 2026", "Pending", "Huda Karim", "Today, 08:15"],
];

export default function NoteAndCertificateStatusTable() {
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
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
