import React, { useState, useEffect, FormEvent } from 'react';
import { getAIInsightStream } from '../services/geminiService';
import type { Client, Project, FieldData } from '../types';

interface Conversation {
  id: string;
  question: string;
  response: string;
  timestamp: number;
  analytics?: any;
}

interface AiDataScientistProps {
  client: Client;
  project: Project;
  fieldData: FieldData[];
  onClose: () => void;
}

const AiDataScientist: React.FC<AiDataScientistProps> = ({ client, project, fieldData, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingProgress, setThinkingProgress] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  // Load saved conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`ai_conversations_${project.id}`);
    if (saved) {
      setConversations(JSON.parse(saved));
    }
  }, [project.id]);

  // Save conversations to localStorage
  const saveConversations = (newConversations: Conversation[]) => {
    localStorage.setItem(`ai_conversations_${project.id}`, JSON.stringify(newConversations));
    setConversations(newConversations);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim()) return;

    const question = currentQuestion;
    setCurrentQuestion('');
    setLoading(true);
    setIsThinking(true);
    setThinkingProgress(0);

    try {
      const stream = await getAIInsightStream(client, project, fieldData, question);
      let modelResponse = '';
      const newConversation: Conversation = {
        id: Date.now().toString(),
        question,
        response: '',
        timestamp: Date.now()
      };

      // Start progress animation
      const progressInterval = setInterval(() => {
        setThinkingProgress(prev => Math.min(prev + Math.random() * 15, 85));
      }, 200);

      for await (const chunk of stream) {
        const text = chunk.text;
        modelResponse += text;
        newConversation.response = modelResponse;
      }

      clearInterval(progressInterval);
      setThinkingProgress(100);

      // Save the completed conversation
      saveConversations([...conversations, newConversation]);

      // Small delay to show completion
      setTimeout(() => {
        setThinkingProgress(0);
        setIsThinking(false);
        setShowCompletion(true);
        setTimeout(() => setShowCompletion(false), 2000);
      }, 500);

    } catch (error) {
      console.error(error);
      const errorConversation: Conversation = {
        id: Date.now().toString(),
        question,
        response: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      saveConversations([...conversations, errorConversation]);
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  };

  const clearConversations = () => {
    saveConversations([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-1 sm:p-2 md:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-6xl h-[98vh] sm:h-[95vh] md:h-[90vh] flex flex-col max-h-screen">
        {/* Header */}
        <header className="p-3 sm:p-4 md:p-6 border-b dark:border-gray-700 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg sm:rounded-t-xl flex-shrink-0">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-brain text-lg sm:text-xl md:text-2xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg md:text-2xl font-bold truncate leading-tight">AI XAMU Data Scientist</h2>
                <p className="text-green-100 text-xs sm:text-sm md:text-base truncate leading-tight">{project.projectName} - Chat with AI</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-lg sm:text-xl md:text-2xl self-end sm:self-auto flex-shrink-0 w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Conversations List */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-8 sm:py-12 md:py-16">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 shadow-lg">
                  <i className="fas fa-brain text-white text-xl sm:text-2xl md:text-3xl"></i>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3">Welcome to AI Data Scientist</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-2">Your intelligent wetlands data analysis assistant</p>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-xs sm:text-sm md:text-base px-2 sm:px-4">Ask me questions about your field data, get insights, analytics, and recommendations for your wetlands monitoring project.</p>
                <div className="mt-3 sm:mt-4 md:mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">Data Analysis</span>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">Insights</span>
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">Recommendations</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {conversations.map((conv) => (
                  <div key={conv.id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-2.5 sm:p-3 md:p-6">
                    {/* User Question */}
                    <div className="flex items-start space-x-2.5 sm:space-x-3 md:space-x-4 mb-2.5 sm:mb-3 md:mb-4">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <i className="fas fa-user text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1.5 sm:mb-2">
                          <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">You</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-auto">{new Date(conv.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium leading-relaxed text-xs sm:text-sm md:text-base break-words">{conv.question}</p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex items-start space-x-2.5 sm:space-x-3 md:space-x-4">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <i className="fas fa-brain text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 sm:mb-2.5 md:mb-3">
                          <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">AI Data Scientist</span>
                          <div className="flex items-center space-x-1 sm:ml-auto">
                            {conv.response ? (
                              <>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Response Ready</span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">XAMU Assistant</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-md sm:rounded-lg p-2.5 sm:p-3 md:p-4 border-l-4 border-green-500 transition-all duration-500 ${conv.response ? 'opacity-100 shadow-md animate-in fade-in-0 slide-in-from-bottom-2' : 'opacity-70'}`}>
                          {conv.response ? (
                            <div className="relative">
                              <div className="prose prose-xs sm:prose-sm md:prose-base dark:prose-invert max-w-none">
                                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words m-0 text-xs sm:text-sm md:text-base">{conv.response}</p>
                              </div>
                              <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                <i className="fas fa-check text-white text-xs"></i>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                              </div>
                              <span className="text-xs sm:text-sm">Generating response...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Thinking Indicator */}
                {isThinking && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border-2 border-green-200 dark:border-green-700 p-4 sm:p-6 animate-pulse">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-bounce">
                        <i className="fas fa-brain text-white text-sm sm:text-base"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-3 sm:mb-4">
                          <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">AI Data Scientist</span>
                          <div className="flex items-center space-x-2 sm:ml-auto">
                            <div className="flex space-x-1">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Processing...</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg p-4 sm:p-6 border-l-4 border-green-500 shadow-inner">
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                              </div>
                              <span className="text-sm sm:text-base font-medium">Analyzing your wetlands field data...</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 sm:h-4 shadow-inner">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 sm:h-4 rounded-full transition-all duration-300 ease-out shadow-sm"
                                  style={{ width: `${thinkingProgress}%` }}
                                ></div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                                {thinkingProgress < 30 && "🔍 Analyzing data patterns..."}
                                {thinkingProgress >= 30 && thinkingProgress < 60 && "📊 Processing insights..."}
                                {thinkingProgress >= 60 && thinkingProgress < 90 && "💡 Generating recommendations..."}
                                {thinkingProgress >= 90 && "✨ Finalizing response..."}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Completion Indicator */}
                {showCompletion && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border-2 border-green-300 dark:border-green-600 p-4 sm:p-6 animate-in fade-in-0 slide-in-from-bottom-2">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <i className="fas fa-check text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mb-1">Response Complete!</h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Your AI analysis is ready</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 sm:p-4 md:p-6 border-t dark:border-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex-shrink-0">
            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4">
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Ask me about your field data..."
                    className="w-full p-2.5 sm:p-3 md:p-4 pr-8 sm:pr-10 md:pr-12 border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg md:rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm sm:text-base"
                    disabled={loading}
                  />
                  <div className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2">
                    <i className="fas fa-search text-gray-400 dark:text-gray-500 text-sm sm:text-base"></i>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 md:gap-3">
                  <button
                    type="submit"
                    disabled={loading || !currentQuestion.trim()}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md sm:rounded-lg md:rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] sm:min-w-[120px] shadow-lg transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                        <span>{isThinking ? 'Thinking...' : 'Sending...'}</span>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-1.5 sm:mr-2"></i>
                        Ask AI
                      </>
                    )}
                  </button>
                  {conversations.length > 0 && (
                    <button
                      type="button"
                      onClick={clearConversations}
                      className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md sm:rounded-lg md:rounded-xl hover:from-red-600 hover:to-red-700 flex items-center justify-center shadow-lg transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      <i className="fas fa-trash mr-1.5 sm:mr-2"></i>
                      Clear Chat
                    </button>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
                  <span className="hidden sm:inline">Try asking about data trends, vegetation analysis, or impact assessments</span>
                  <span className="sm:hidden">Ask about trends, analysis, or assessments</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDataScientist;