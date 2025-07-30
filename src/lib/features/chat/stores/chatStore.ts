import { writable, get } from 'svelte/store';
import { env } from '$env/dynamic/public';
import type { Message } from '$lib/features/chat/types';

const defaultSystemPrompt =
	'You are a helpful AI assistant. You must format your responses using Markdown.';
const LOCAL_STORAGE_KEY = 'chat_session_v2';

const getStoredSession = (): { messages: Message[]; systemPrompt: string } | null => {
	if (typeof window === 'undefined') return null;
	const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
	return stored ? JSON.parse(stored) : null;
};

const createInitialMessages = (): Message[] => {
	const storedSession = getStoredSession();
	if (storedSession && storedSession.messages.length > 0) {
		return storedSession.messages;
	}
	return [
		{ id: crypto.randomUUID(), role: 'assistant', content: 'Hello! How can I help you today?' }
	];
};

function createChatStore() {
	const storedSession = getStoredSession();
	const { subscribe, update } = writable({
		messages: createInitialMessages(),
		systemPrompt: storedSession?.systemPrompt || defaultSystemPrompt,
		isLoading: false
	});

	let abortController: AbortController | null = null;

	subscribe(({ messages, systemPrompt }) => {
		if (typeof window !== 'undefined') {
			const sessionToSave = { messages, systemPrompt };
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionToSave));
		}
	});

	const sendMessage = async (userInput: string, history: Message[]) => {
		if (!userInput.trim()) return;

		const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: userInput };
		const thinkingMessage: Message = { id: crypto.randomUUID(), role: 'thinking', content: '' };

		update((s) => ({
			...s,
			isLoading: true,
			messages: [...history, userMessage, thinkingMessage]
		}));

		abortController = new AbortController();
		const currentSystemPrompt = get({ subscribe }).systemPrompt; // Safely get current value

		try {
			const backendUrl = env.PUBLIC_NGROK_API_URL || 'http://localhost:5000/api/chat';

			const response = await fetch(backendUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [...history, userMessage].map(({ role, content }) => ({ role, content })),
					system_prompt: currentSystemPrompt
				}),
				signal: abortController.signal
			});

			if (!response.ok || !response.body) throw new Error(`Server error: ${response.status}`);

			update((s) => {
				s.messages[s.messages.length - 1] = {
					id: s.messages[s.messages.length - 1].id,
					role: 'assistant',
					content: '',
					isGenerating: true
				};
				return s;
			});

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				const chunk = decoder.decode(value, { stream: true });
				update((s) => {
					s.messages[s.messages.length - 1].content += chunk;
					return s;
				});
			}
		} catch (error: unknown) {
			update((s) => {
				const isAbortError = error instanceof Error && error.name === 'AbortError';
				const errorMessage = error instanceof Error ? error.message : String(error);
				const errorMsg = isAbortError ? '*Generation stopped.*' : `**Error:** ${errorMessage}`;
				s.messages[s.messages.length - 1] = {
					...s.messages[s.messages.length - 1],
					content: errorMsg,
					role: 'error'
				};
				return s;
			});
		} finally {
			update((s) => {
				if (s.messages.length > 0) {
					delete s.messages[s.messages.length - 1].isGenerating;
				}
				return { ...s, isLoading: false };
			});
			abortController = null;
		}
	};

	const editAndResubmit = (messageId: string, newContent: string) => {
		let history: Message[] = [];
		update((s) => {
			const messageIndex = s.messages.findIndex((m) => m.id === messageId);
			if (messageIndex !== -1) {
				history = s.messages.slice(0, messageIndex);
			}
			return s;
		});
		sendMessage(newContent, history);
	};

	const toggleEditMode = (messageId: string) => {
		update((s) => {
			const message = s.messages.find((m) => m.id === messageId);
			if (message) {
				message.isEditing = !message.isEditing;
			}
			return { ...s };
		});
	};

	const regenerateLastResponse = () => {
		// **THIS IS THE FIX**
		// We use the `update` function to safely get the current state
		// and then call the side-effect (sendMessage) outside of it.
		let history: Message[] = [];
		let lastUserMessage: Message | undefined;

		update((s) => {
			if (s.isLoading) return s;
			const lastUserMessageIndex = s.messages.findLastIndex((m) => m.role === 'user');
			if (lastUserMessageIndex !== -1) {
				history = s.messages.slice(0, lastUserMessageIndex);
				lastUserMessage = s.messages[lastUserMessageIndex];
			}
			return s;
		});

		if (lastUserMessage) {
			sendMessage(lastUserMessage.content, history);
		}
	};

	const newChat = () => {
		update((s) => {
			if (s.isLoading) return s;
			return {
				...s,
				messages: [
					{
						id: crypto.randomUUID(),
						role: 'assistant',
						content: 'Hello! How can I help you today?'
					}
				]
			};
		});
	};

	const stopGeneration = () => abortController?.abort();

	const updateSystemPrompt = (newPrompt: string) => {
		update((s) => ({ ...s, systemPrompt: newPrompt.trim() || defaultSystemPrompt }));
	};

	return {
		subscribe,
		sendMessage,
		regenerateLastResponse,
		newChat,
		stopGeneration,
		updateSystemPrompt,
		editAndResubmit,
		toggleEditMode
	};
}

export const chat = createChatStore();
