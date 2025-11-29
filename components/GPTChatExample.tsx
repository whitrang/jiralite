"use client";

import { useState } from "react";
import { askGPT, streamChatCompletion, ChatMessage, isGPTConfigured } from "@/lib/api/gpt";
import { Spinner } from "@/components/ui/spinner";

export default function GPTChatExample() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useStreaming, setUseStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      if (!isGPTConfigured()) {
        throw new Error("OpenAI API key is not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env file.");
      }

      if (useStreaming) {
        // Streaming response
        const messages: ChatMessage[] = [
          {
            role: "system",
            content: "You are a helpful assistant for a project management application.",
          },
          {
            role: "user",
            content: prompt,
          },
        ];

        await streamChatCompletion(
          messages,
          (chunk) => {
            setResponse((prev) => prev + chunk);
          }
        );
      } else {
        // Regular response
        const result = await askGPT(
          prompt,
          "You are a helpful assistant for a project management application."
        );
        setResponse(result);
      }
    } catch (err: any) {
      console.error("Error calling GPT:", err);
      setError(err.message || "Failed to get response from GPT");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPrompt("");
    setResponse("");
    setError("");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">GPT Chat Example</h2>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">📝 Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
            <li>Add <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY=your_key</code> to your .env file</li>
            <li>Restart your development server</li>
          </ol>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Ask GPT anything:
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              placeholder="e.g., Summarize this project requirement..."
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                disabled={loading}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Use streaming (real-time response)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Spinner size="sm" variant="white" />}
              {loading ? "Thinking..." : "Ask GPT"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </form>

        {response && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Response:</h3>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800 border border-gray-200">
              {response}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-3">Example Use Cases</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <button
            onClick={() => setPrompt("Generate 3 creative project names for a mobile fitness app")}
            className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            💡 Generate project names
          </button>
          <button
            onClick={() => setPrompt("Write a brief description for a bug: The login button doesn't work on mobile Safari")}
            className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            🐛 Generate issue description
          </button>
          <button
            onClick={() => setPrompt("Create a list of 5 tasks needed to implement user authentication")}
            className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✅ Break down tasks
          </button>
          <button
            onClick={() => setPrompt("Suggest improvements for this team name: 'Team Alpha'")}
            className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            🎯 Get suggestions
          </button>
        </div>
      </div>
    </div>
  );
}
