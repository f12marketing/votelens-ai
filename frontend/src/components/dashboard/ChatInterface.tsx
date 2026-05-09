import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, X, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  charts?: any[];
  followUpQuestions?: string[];
}

interface ChatInterfaceProps {
  electionId?: string;
  constituencyId?: string;
  state?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  electionId,
  constituencyId,
  state,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [expandedCharts, setExpandedCharts] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Which constituencies flipped parties?',
    'Where was turnout highest?',
    'Which races are closest?',
    'Which candidate gained momentum?',
    'Compare regions by turnout',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          context: {
            electionId,
            constituencyId,
            state,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response.message,
        timestamp: new Date(),
        data: data.response.data,
        charts: data.response.charts,
        followUpQuestions: data.response.followUpQuestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const toggleChart = (chartId: string) => {
    setExpandedCharts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chartId)) {
        newSet.delete(chartId);
      } else {
        newSet.add(chartId);
      }
      return newSet;
    });
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Election Analytics Chat</h3>
            <p className="text-xs text-gray-500">Ask about constituencies, candidates, and trends</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Clear chat"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">
                Welcome to Election Analytics
              </h4>
              <p className="text-gray-500 mb-6">
                Ask me anything about election data, trends, and analysis
              </p>
              {showSuggestions && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-3">Try asking:</p>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(suggestion)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>

                {/* Charts */}
                {message.charts && message.charts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <BarChart3 className="w-4 h-4" />
                      <span>Visualizations</span>
                    </div>
                    {message.charts.map((chart, index) => {
                      const chartId = `${message.id}-chart-${index}`;
                      const isExpanded = expandedCharts.has(chartId);
                      return (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 border border-gray-200"
                        >
                          <button
                            onClick={() => toggleChart(chartId)}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {chart.title}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="mt-3 h-48 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">
                              Chart visualization would render here
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Follow-up questions */}
                {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold opacity-75">
                      Follow-up questions:
                    </p>
                    {message.followUpQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSend(question)}
                        className="block w-full text-left px-3 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about election data..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
