"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MessageRole = "assistant" | "user";

type ChatMessage = Readonly<{
	id: string;
	role: MessageRole;
	content: string;
}>;

const suggestedPrompts = [
	"How do I create a lead?",
	"What is the next step after proposal?",
	"How does LID connect to PID?",
	"Explain reception note workflow",
] as const;

const initialMessages: ChatMessage[] = [
	{
		id: "welcome-message",
		role: "assistant",
		content: "Hi, I’m Gree. I can help you understand workflows, leads, proposals, traceability, and system actions.",
	},
];

const DUMMY_RESPONSE = "This is a sample guidance response. Full AI integration will be added later.";

export default function GreeInterface() {
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
	const [draft, setDraft] = useState("");
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const latestMessageRef = useRef<HTMLDivElement | null>(null);
	const nextMessageIdRef = useRef(1);

	useEffect(() => {
		latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages]);

	const canSend = useMemo(() => draft.trim().length > 0, [draft]);

	function handlePromptClick(prompt: string) {
		void sendMessage(prompt);
	}

	async function sendMessage(rawMessage: string) {
		const trimmedMessage = rawMessage.trim();

		if (!trimmedMessage) {
			return;
		}

		const userMessageId = `user-${nextMessageIdRef.current}`;
		nextMessageIdRef.current += 1;
		const assistantMessageId = `assistant-${nextMessageIdRef.current}`;
		nextMessageIdRef.current += 1;

		const userMessage: ChatMessage = {
			id: userMessageId,
			role: "user",
			content: trimmedMessage,
		};

		const assistantMessage: ChatMessage = {
			id: assistantMessageId,
			role: "assistant",
			content: DUMMY_RESPONSE,
		};

		setMessages((currentMessages) => [...currentMessages, userMessage, assistantMessage]);
		setDraft("");
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		void sendMessage(draft);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void sendMessage(draft);
		}
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
				<header className="border-b border-slate-200 px-6 py-5 sm:px-7">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-1">
							<h1 className="text-3xl font-light tracking-[-0.04em] text-slate-950">Gree</h1>
						</div>
						<span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
							Internal Assistant
						</span>
					</div>
				</header>

				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
						<div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
							{messages.map((message, index) => {
								const isAssistant = message.role === "assistant";
								const isLatest = index === messages.length - 1;

								return (
									<div
										key={message.id}
										ref={isLatest ? latestMessageRef : null}
										className={isAssistant ? "flex justify-start" : "flex justify-end"}
									>
										<div
											className={[
												"max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%]",
												isAssistant
													? "border border-slate-200 bg-slate-50 text-slate-700"
													: "bg-[#36B44D] text-white",
											].join(" ")}
										>
											<p className="whitespace-pre-wrap">{message.content}</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
						<div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
							<div className="flex flex-wrap gap-2">
								{suggestedPrompts.map((prompt) => (
									<button
										key={prompt}
										type="button"
										onClick={() => handlePromptClick(prompt)}
										className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
									>
										{prompt}
									</button>
								))}
							</div>

							<form onSubmit={handleSubmit} className="sticky bottom-0 flex items-end gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-3">
								<textarea
									value={draft}
									onChange={(event) => setDraft(event.target.value)}
									onKeyDown={handleKeyDown}
									rows={1}
									placeholder="Ask Gree anything about Greenshare..."
									className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#36B44D] focus:ring-4 focus:ring-[#36B44D]/15"
								/>
								<button
									type="submit"
									disabled={!canSend}
									className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#36B44D] bg-[#36B44D] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(54,180,77,0.18)] transition hover:bg-[#2fa044] hover:border-[#2fa044] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
								>
									Send
								</button>
							</form>
						</div>
					</div>
				</div>
		</div>
	);
}
