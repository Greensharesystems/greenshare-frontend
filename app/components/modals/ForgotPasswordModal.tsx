"use client";

import Button from "@/app/components/ui/Button";

type ForgotPasswordModalProps = Readonly<{
	isOpen: boolean;
	onClose: () => void;
}>;

export default function ForgotPasswordModal({
	isOpen,
	onClose,
}: ForgotPasswordModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
			<div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-2">
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#36B44D]">Support</p>
						<h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Forgot Password</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
						aria-label="Close forgot password modal"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
							<path d="M4 4 12 12M12 4 4 12" strokeLinecap="round" />
						</svg>
					</button>
				</div>

				<div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
					<p>Please contact us to reset your password.</p>
					<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
						<p>
							<span className="font-medium text-slate-700">Email:</span>{" "}
							<a href="mailto:care@zerowaste.ae" className="transition hover:text-[#00A779]">
								care@zerowaste.ae
							</a>
						</p>
						<p className="mt-2">
							<span className="font-medium text-slate-700">Phone:</span>{" "}
							<a href="tel:+971561422288" className="transition hover:text-[#00A779]">
								+971 56 142 2288
							</a>
						</p>
					</div>
				</div>

				<div className="mt-6 flex justify-end">
					<Button type="button" variant="secondary" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
