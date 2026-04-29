import Button from "@/app/components/ui/Button";

const generalSettings = [
	{
		label: "Organization Name",
		value: "Greenshare Recycling Hub",
		helperText: "Used across reports, dashboards, and generated certificate records.",
		type: "text",
	},
	{
		label: "Notification Email",
		value: "admin@greenshare.com",
		helperText: "Primary address for approvals, certificate status updates, and system alerts.",
		type: "email",
	},
	{
		label: "Certificate Prefix",
		value: "GSH-CERT",
		helperText: "Applied automatically when new reception or circularity certificates are created.",
		type: "text",
	},
] as const;

const recommendedSettings = [
	{
		title: "Enable approval checkpoint",
		description: "Require an admin review before reception certificates move to issued status.",
		badge: "Recommended",
	},
	{
		title: "Use weekly digest emails",
		description: "Send a summary of pending notes, certificates, and overdue reviews every Monday morning.",
		badge: "Recommended",
	},
	{
		title: "Archive completed records automatically",
		description: "Move closed records to the archive after 30 days to keep operational views focused.",
		badge: "Suggested",
	},
	{
		title: "Track circularity exceptions",
		description: "Flag records with missing recovery data so certificate issuance can be blocked early.",
		badge: "Suggested",
	},
] as const;

export default function AdminSettingsPage() {
	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">Settings</h1>
					<p className="max-w-3xl text-sm leading-6 text-slate-600">
						Manage the core admin configuration for reception notes, certificates, and review workflows.
					</p>
				</div>

				<div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
					<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex flex-col gap-2">
							<h2 className="text-xl font-semibold text-slate-950">General Settings</h2>
							<p className="text-sm leading-6 text-slate-600">
								Update the default administrative settings used across the platform.
							</p>
						</div>

						<div className="mt-6 grid gap-5 md:grid-cols-2">
							{generalSettings.map((setting) => (
								<label key={setting.label} className="flex flex-col gap-2">
									<span className="text-sm font-semibold text-slate-800">{setting.label}</span>
									<input
										type={setting.type}
										defaultValue={setting.value}
										className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/10"
									/>
									<span className="text-xs leading-5 text-slate-500">{setting.helperText}</span>
								</label>
							))}

							<label className="flex flex-col gap-2">
								<span className="text-sm font-semibold text-slate-800">Default Language</span>
								<select className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/10">
									<option>English</option>
									<option>Arabic</option>
								</select>
								<span className="text-xs leading-5 text-slate-500">
									Choose the default interface language for newly invited users.
								</span>
							</label>

							<label className="flex flex-col gap-2">
								<span className="text-sm font-semibold text-slate-800">Timezone</span>
								<select className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-[#36B44D] focus:bg-white focus:ring-4 focus:ring-[#36B44D]/10">
									<option>UTC+04:00 Dubai</option>
									<option>UTC+03:00 Riyadh</option>
									<option>UTC+00:00 London</option>
								</select>
								<span className="text-xs leading-5 text-slate-500">
									Timestamps on notes and certificates will follow this timezone.
								</span>
							</label>
						</div>

						<div className="mt-6 grid gap-4 md:grid-cols-2">
							<label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<input
									type="checkbox"
									defaultChecked
									className="mt-1 h-4 w-4 rounded border-slate-300 text-[#36B44D] focus:ring-[#36B44D]/20"
								/>
								<span className="flex flex-col gap-1">
									<span className="text-sm font-semibold text-slate-800">Auto-assign review owner</span>
									<span className="text-xs leading-5 text-slate-500">
										Assign a reviewer automatically when a new reception note is submitted.
									</span>
								</span>
							</label>

							<label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<input
									type="checkbox"
									defaultChecked
									className="mt-1 h-4 w-4 rounded border-slate-300 text-[#36B44D] focus:ring-[#36B44D]/20"
								/>
								<span className="flex flex-col gap-1">
									<span className="text-sm font-semibold text-slate-800">Send weekly digest</span>
									<span className="text-xs leading-5 text-slate-500">
										Summarize pending certificates and exceptions in a weekly admin digest.
									</span>
								</span>
							</label>
						</div>

						<div className="mt-6 flex flex-wrap gap-3">
							<Button>Save Changes</Button>
							<Button variant="secondary">Reset Defaults</Button>
						</div>
					</section>

					<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex flex-col gap-2">
							<h2 className="text-xl font-semibold text-slate-950">Recommended Settings</h2>
							<p className="text-sm leading-6 text-slate-600">
								Suggested defaults to keep approvals, status tracking, and certificate delivery consistent.
							</p>
						</div>

						<div className="mt-6 flex flex-col gap-4">
							{recommendedSettings.map((setting) => (
								<article key={setting.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<div className="flex items-start justify-between gap-3">
										<h3 className="text-sm font-semibold text-slate-900">{setting.title}</h3>
										<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
											{setting.badge}
										</span>
									</div>
									<p className="mt-2 text-sm leading-6 text-slate-600">{setting.description}</p>
								</article>
							))}
						</div>
					</section>
				</div>
			</div>
		</section>
	);
}
