import EditUsersAccessTable from "@/app/components/tables/UsersAccessControlTable";

export default function AdminAccessControlPage() {
	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">Users Access Control</h1>
				<EditUsersAccessTable />
			</div>
		</section>
	);
}