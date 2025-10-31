
import React, { useState, FormEvent } from 'react';
import { getAIInsightStream } from '../services/geminiService';
import type { Client, Project, FieldData } from '../types';
import Spinner from './Spinner';

interface AiAssistantProps {
    client: Client;
    project: Project;
    fieldData: FieldData[];
    onClose: () => void;
}

interface Message {
    role: 'user' | 'model';
    content: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ client, project, fieldData, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const stream = await getAIInsightStream(client, project, fieldData, input);
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                const text = chunk.text;
                modelResponse += text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">AI Assistant</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </header>

                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                             <div className="flex justify-start">
                                <div className="max-w-lg p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                                   <Spinner />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-4 border-t dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="flex space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask about this project's data..."
                            className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            disabled={loading}
                        />
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400" disabled={loading}>
                           Send
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default AiAssistant;
