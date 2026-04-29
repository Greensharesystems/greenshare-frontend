type AccessControlProps = Readonly<{
	role: string;
}>;

const rolePermissions = {
	admin: ["View", "Edit", "Download"],
	employee: ["View", "Edit", "Download"],
	customer: ["View", "Download"],
} as const;

export default function AccessControl({ role }: AccessControlProps) {
	const permissions = rolePermissions[role.trim().toLowerCase() as keyof typeof rolePermissions] ?? [];

	return (
		<div className="flex flex-wrap gap-2">
			{permissions.map((permission) => (
				<span
					key={`${role}-${permission}`}
					className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
				>
					{permission}
				</span>
			))}
		</div>
	);
}
