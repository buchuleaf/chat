export type Message = {
	id: string;
	role: 'user' | 'assistant' | 'error' | 'thinking'; // Add 'thinking' role
	content: string;
	isGenerating?: boolean;
	isEditing?: boolean; // Flag to handle the editing UI state
};
