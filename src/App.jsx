import { useEffect, useRef, useState } from 'react';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    async function fetchWithRetry(requestFn, retries = 2) {
        let lastError;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;

                if (attempt === retries) {
                    throw error;
                }

                await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
            }
        }

        throw lastError;
    }

    async function sendMessageToGemini(userMessage) {
        if (!API_KEY) {
            return 'Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file.';
        }

        const trimmed = userMessage.trim();
        const lastMessages = messages.slice(-3).map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.message }],
        }));

        const requestBody = {
            contents: [
                ...lastMessages,
                {
                    role: 'user',
                    parts: [{ text: trimmed }],
                },
            ],
            system_instruction: {
                parts: [{
                    text: 'Reply briefly and clearly. Keep answers concise, practical, and friendly. Avoid extra explanation. If you are unsure, say so in one sentence.'
                }],
            },
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 120,
            },
        };

        const response = await fetchWithRetry(async () => {
            const res = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(20000),
            });

            if (!res.ok) {
                const text = await res.text();

                if ([429, 500, 503].includes(res.status)) {
                    throw new Error(`Temporary Gemini error: ${res.status}`);
                }

                throw new Error(`API request failed: ${res.status} ${text}`);
            }

            return res;
        });

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error('No response returned from Gemini.');
        }

        return reply.trim();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const trimmed = input.trim();

        if (!trimmed || isLoading) {
            return;
        }

        const userMessage = {
            id: crypto.randomUUID(),
            message: trimmed,
            sender: 'user',
        };

        setMessages((current) => [...current, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const reply = await sendMessageToGemini(trimmed);
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    message: reply,
                    sender: 'bot',
                },
            ]);
        } catch (error) {
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    message: 'I could not reach the API right now. Please check your Gemini key and try again.',
                    sender: 'bot',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f7f7f8] text-slate-900">
            <div className="mx-auto flex h-screen w-full max-w-[720px] flex-col">
                <header className="flex items-center justify-center border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur">
                    <div className="text-sm font-medium text-slate-700">Chat</div>
                </header>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-6 sm:px-4">
                    {messages.length === 0 && !isLoading ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="text-sm text-slate-600">Start a conversation</div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatMessage key={message.id} message={message.message} sender={message.sender} />
                        ))
                    )}

                    {isLoading && <TypingIndicator />}
                </div>

                <ChatInput
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onSubmit={handleSubmit}
                    disabled={isLoading}
                />
            </div>
        </div>
    );
}

export default App;
