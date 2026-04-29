const columns = [
	"Record ID",
	"Customer",
	"Reception Note",
	"Certificate No.",
	"Material",
	"Weight",
	"Issued Date",
	"Status",
	"Handled By",
	"Remarks",
];

const rows = [
	["REC-001", "Noor Trading", "RN-1101", "CERT-5001", "Plastic", "1,250 kg", "27 Mar 2026", "Issued", "Aisha Khan", "Verified"],
	["REC-002", "Green Mart", "RN-1102", "CERT-5002", "Paper", "980 kg", "26 Mar 2026", "Pending", "Omar Saeed", "Awaiting sign-off"],
	["REC-003", "Eco Foods", "RN-1103", "CERT-5003", "Glass", "1,430 kg", "25 Mar 2026", "Issued", "Fatima Noor", "Delivered"],
	["REC-004", "Palm Supplies", "RN-1104", "CERT-5004", "Metal", "2,100 kg", "24 Mar 2026", "Draft", "Yousef Ali", "Review needed"],
	["REC-005", "Clean Loop", "RN-1105", "CERT-5005", "Organic", "760 kg", "23 Mar 2026", "Issued", "Mariam Adel", "Completed"],
	["REC-006", "Urban Harvest", "RN-1106", "CERT-5006", "Cardboard", "1,120 kg", "22 Mar 2026", "Pending", "Khalid Hassan", "Customer follow-up"],
	["REC-007", "Blue Bay Cafe", "RN-1107", "CERT-5007", "Plastic", "890 kg", "21 Mar 2026", "Issued", "Lina Ahmed", "Archived"],
	["REC-008", "Fresh Basket", "RN-1108", "CERT-5008", "Paper", "1,050 kg", "20 Mar 2026", "Draft", "Rami Nasser", "Data check"],
	["REC-009", "Sunrise Hotel", "RN-1109", "CERT-5009", "Glass", "1,670 kg", "19 Mar 2026", "Issued", "Sara Ibrahim", "Approved"],
	["REC-010", "Golden Spoon", "RN-1110", "CERT-5010", "Metal", "1,310 kg", "18 Mar 2026", "Pending", "Huda Karim", "Ready to issue"],
];

export default function NoteAndCertificatesTable() {
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
