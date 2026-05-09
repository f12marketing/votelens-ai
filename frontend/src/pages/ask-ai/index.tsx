import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function AskAI() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I can help you analyze election data. Ask me anything about elections, constituencies, or voting patterns.' },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setMessages([...messages, { role: 'user', content: query }]);
    setQuery('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Ask AI</h1>
        <p className="text-muted-foreground">Query election data using natural language</p>
      </div>

      <div className="flex-1 rounded-lg border bg-card flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about election data..."
                className="w-full rounded-md border bg-background pl-10 pr-4 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Example: "What is the voter turnout in North Constituency?" or "Show me constituencies with turnout below 60%"
          </p>
        </div>
      </div>
    </div>
  );
}
