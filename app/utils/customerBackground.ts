export const CUSTOMER_BACKGROUND_STORAGE_KEY = "greenshare.customer.background";
export const CUSTOMER_BACKGROUND_EVENT = "greenshare:customer-background-change";

export type CustomerBackgroundOption = Readonly<{
	id: "white" | "sage" | "mist";
	label: string;
	description: string;
	appClassName: string;
	previewClassName: string;
}>;

export const CUSTOMER_BACKGROUND_OPTIONS: ReadonlyArray<CustomerBackgroundOption> = [
	{
		id: "white",
		label: "Classic White",
		description: "Clean neutral background for the customer workspace.",
		appClassName: "bg-white",
		previewClassName: "bg-white",
	},
	{
		id: "sage",
		label: "Soft Sage",
		description: "A muted green tint that keeps the workspace calm.",
		appClassName: "bg-[#f4f8f1]",
		previewClassName: "bg-[#e7f1df]",
	},
	{
		id: "mist",
		label: "Silver Mist",
		description: "A light grey surface with a softer contrast.",
		appClassName: "bg-[#f7f8fb]",
		previewClassName: "bg-[#eceff5]",
	},
];

export function resolveCustomerBackgroundOption(backgroundId: string | null | undefined): CustomerBackgroundOption {
	return CUSTOMER_BACKGROUND_OPTIONS.find((option) => option.id === backgroundId) ?? CUSTOMER_BACKGROUND_OPTIONS[0];
}