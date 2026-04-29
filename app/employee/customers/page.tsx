"use client";

import { useRouter, useSearchParams } from "next/navigation";

import AddCustomerForm from "@/app/components/forms/AddCustomerForm";
import CustomersTable from "@/app/components/tables/CustomersTable";
import Button from "@/app/components/ui/Button";

export default function EmployeeCustomersPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isCreateView = searchParams.get("mode") === "new";
	const isEditView = searchParams.get("mode") === "edit";
	const customerId = searchParams.get("customerId");

	return (
		<section className="min-h-[calc(100vh-54px)] bg-white px-6 py-6">
			{isCreateView || isEditView ? (
				<div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-4">
					<div className="pt-1">
						<Button variant="secondary" onClick={() => router.push("/employee/customers")}>
							Back to Customers
						</Button>
					</div>
					<div className="w-full max-w-4xl pt-2">
						<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">{isEditView ? "Edit Customer" : "Add New Customer"}</h1>
					</div>
					<div aria-hidden="true" />
					<div className="w-full max-w-4xl">
						<AddCustomerForm submitLabel={isEditView ? "Save Customer" : "Add Customer"} mode={isEditView ? "edit" : "create"} customerId={customerId} />
					</div>
				</div>
			) : (
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
					<div className="flex items-center justify-between gap-4">
						<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Customers</h1>
						<Button className="min-w-40 justify-center" onClick={() => router.push("/employee/customers?mode=new")}>Add Customer</Button>
					</div>
					<CustomersTable showEmployeeCsvExport showRemoveAction={false} />
				</div>
			)}
		</section>
	);
}
