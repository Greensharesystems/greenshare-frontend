const columns = [
	"Certificate ID",
	"Customer",
	"Reception Note",
	"Issue Date",
	"Material Type",
	"Status",
	"Approved By",
	"Last Update",
];

const rows = [
	["RC-4001", "Noor Trading", "RN-3001", "28 Mar 2026", "Plastic", "Issued", "Aisha Khan", "Today, 09:40"],
	["RC-4002", "Green Mart", "RN-3002", "27 Mar 2026", "Paper", "Pending", "Omar Saeed", "Today, 08:50"],
	["RC-4003", "Eco Foods", "RN-3003", "26 Mar 2026", "Glass", "Draft", "Fatima Noor", "Yesterday"],
	["RC-4004", "Palm Supplies", "RN-3004", "25 Mar 2026", "Metal", "Issued", "Yousef Ali", "Today, 07:58"],
	["RC-4005", "Clean Loop", "RN-3005", "24 Mar 2026", "Organic", "Rejected", "Mariam Adel", "2 days ago"],
	["RC-4006", "Urban Harvest", "RN-3006", "23 Mar 2026", "Cardboard", "Pending", "Khalid Hassan", "Today, 10:18"],
	["RC-4007", "Blue Bay Cafe", "RN-3007", "22 Mar 2026", "Plastic", "Issued", "Lina Ahmed", "Today, 11:22"],
	["RC-4008", "Fresh Basket", "RN-3008", "21 Mar 2026", "Paper", "Draft", "Rami Nasser", "Yesterday"],
	["RC-4009", "Sunrise Hotel", "RN-3009", "20 Mar 2026", "Glass", "Issued", "Sara Ibrahim", "Today, 12:12"],
	["RC-4010", "Golden Spoon", "RN-3010", "19 Mar 2026", "Metal", "Pending", "Huda Karim", "Today, 08:20"],
];

export default function ReceptionCertificatesStatusTable() {
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
