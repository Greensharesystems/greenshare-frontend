"use client";

type StepperProps = Readonly<{
	steps: string[];
	currentStep: string;
	className?: string;
	onStepClick?: (step: string, mode: "readOnly" | "editable" | "disabled") => void;
}>;

export default function Stepper({ steps, currentStep, className, onStepClick }: StepperProps) {
	const currentIndex = steps.findIndex((step) => normalizeStep(step) === normalizeStep(currentStep));

	return (
		<div className={joinClasses("w-full", className)}>
			<div className="flex flex-nowrap items-start gap-1.5">
				{steps.map((step, index) => {
					const isComplete = currentIndex >= 0 && index < currentIndex;
					const isCurrent = currentIndex >= 0 && index === currentIndex;
					const isUpcoming = !isComplete && !isCurrent;
					const interactionMode = isCurrent ? "editable" : isComplete ? "readOnly" : "disabled";

					return (
						<div key={step} className="relative flex min-w-0 flex-1 flex-col items-start gap-1.5">
							<div className="relative flex w-full items-start px-1">
								{index < steps.length - 1 ? (
									<div
										aria-hidden="true"
										className={joinClasses(
											"absolute left-5 -right-1.5 top-1/2 h-px -translate-y-1/2",
											isComplete ? "bg-emerald-300" : isCurrent ? "bg-sky-200" : "bg-slate-200",
										)}
									/>
								) : null}
								<div
									className={joinClasses(
										"relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold transition",
										isComplete
											? "border-emerald-500 bg-emerald-500 text-white"
											: isCurrent
												? "border-sky-500 bg-sky-50 text-sky-700"
												: "border-slate-200 bg-white text-slate-400",
									)}
								>
									{isComplete ? <CompletedIcon /> : index + 1}
								</div>
							</div>
							<button
								type="button"
								onClick={() => onStepClick?.(step, interactionMode)}
								className={joinClasses(
									"w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-left transition",
									"focus:outline-none focus:ring-2 focus:ring-slate-200",
									onStepClick ? "cursor-pointer hover:border-slate-300 hover:bg-white" : "cursor-default",
									isUpcoming ? "opacity-80" : undefined,
								)}
								aria-label={`${toTitleCase(step)} step ${interactionMode}`}
							>
								<p className={joinClasses("text-[10px] font-semibold leading-4", isUpcoming ? "text-slate-500" : "text-slate-900")}>{toTitleCase(step)}</p>
								<p className={joinClasses("mt-0.5 text-[10px] leading-4", isComplete ? "text-emerald-600" : isCurrent ? "text-sky-600" : "text-slate-400")}>
									{isComplete ? "Completed" : isCurrent ? "Current" : "Upcoming"}
								</p>
							</button>
							</div>
					);
				})}
			</div>
		</div>
	);
}

function normalizeStep(step: string) {
	return step.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function toTitleCase(step: string) {
	return normalizeStep(step).replace(/\b\w/g, (character) => character.toUpperCase());
}

function CompletedIcon() {
	return (
		<svg viewBox="0 0 16 16" aria-hidden="true" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2.4]">
			<path d="M3.5 8.25 6.5 11 12.5 5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function joinClasses(...values: Array<string | undefined>) {
	return values.filter(Boolean).join(" ");
}
