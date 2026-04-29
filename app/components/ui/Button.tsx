import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Readonly<
	ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		fullWidth?: boolean;
	}
>;

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"border border-[#36B44D] bg-[#36B44D] text-white shadow-[0_12px_24px_rgba(54,180,77,0.18)] hover:bg-[#2fa044] hover:border-[#2fa044] focus:ring-[#36B44D]/25",
	secondary:
		"border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-200",
	ghost:
		"border border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
	danger:
		"border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-200",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "min-h-9 rounded-xl px-3 py-2 text-sm",
	md: "min-h-11 rounded-2xl px-4 py-3 text-sm",
	lg: "min-h-12 rounded-2xl px-5 py-3.5 text-base",
};

export default function Button({
	variant = "primary",
	size = "md",
	fullWidth = false,
	className,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			className={joinClasses(
				"inline-flex items-center justify-center gap-2 font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none",
				variantClasses[variant],
				sizeClasses[size],
				fullWidth ? "w-full" : undefined,
				className,
			)}
			{...props}
		/>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
