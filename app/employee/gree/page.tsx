import GreeInterface from "@/components/gree/GreeInterface";

export default function EmployeeGreePage() {
	return (
		<section className="h-[calc(100vh-54px)] overflow-hidden bg-white py-6">
			<div className="mx-auto flex h-full w-full max-w-7xl min-h-0 px-6">
				<GreeInterface />
			</div>
		</section>
	);
}
