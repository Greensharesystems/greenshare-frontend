const columns = [
	"Certificate ID",
	"Customer",
	"Recovery Batch",
	"Issue Date",
	"Circularity Score",
	"Status",
	"Verified By",
	"Last Update",
];

const rows = [
	["CC-5001", "Noor Trading", "RB-7101", "28 Mar 2026", "92%", "Issued", "Aisha Khan", "Today, 09:55"],
	["CC-5002", "Green Mart", "RB-7102", "27 Mar 2026", "88%", "Pending", "Omar Saeed", "Today, 08:58"],
	["CC-5003", "Eco Foods", "RB-7103", "26 Mar 2026", "85%", "Draft", "Fatima Noor", "Yesterday"],
	["CC-5004", "Palm Supplies", "RB-7104", "25 Mar 2026", "94%", "Issued", "Yousef Ali", "Today, 08:06"],
	["CC-5005", "Clean Loop", "RB-7105", "24 Mar 2026", "79%", "Rejected", "Mariam Adel", "2 days ago"],
	["CC-5006", "Urban Harvest", "RB-7106", "23 Mar 2026", "90%", "Pending", "Khalid Hassan", "Today, 10:28"],
	["CC-5007", "Blue Bay Cafe", "RB-7107", "22 Mar 2026", "87%", "Issued", "Lina Ahmed", "Today, 11:34"],
	["CC-5008", "Fresh Basket", "RB-7108", "21 Mar 2026", "83%", "Draft", "Rami Nasser", "Yesterday"],
	["CC-5009", "Sunrise Hotel", "RB-7109", "20 Mar 2026", "95%", "Issued", "Sara Ibrahim", "Today, 12:18"],
	["CC-5010", "Golden Spoon", "RB-7110", "19 Mar 2026", "86%", "Pending", "Huda Karim", "Today, 08:26"],
];

export default function CircularityCertificatesStatusTable() {
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
