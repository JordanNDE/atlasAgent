import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TextResponse } from "@/api";
import { useSendMessageMutation } from "@/api";
import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import "./App.css";

// Replace the marked imports with react-markdown
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// New MarkdownRenderer using react-markdown
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold mb-2 mt-4 border-b border-gray-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-2 mt-4 border-b border-gray-200 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3">
              {children}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-list-outside mb-4 space-y-2 pl-9">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside mb-4 space-y-2 pl-9">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-0 pl-2">
              {children}
            </li>
          ),
          p: ({ children }) => (
            <p className="mb-4">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">
              {children}
            </strong>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className={className}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400 mb-4">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Improved fixMarkdown function to handle list formatting issues
function fixMarkdown(md: string): string {
    if (!md) return md;
    // console.log("md input: ", md);
    let fixed = md;

    // // Fix bullet points that are separated from their content
    // // This handles cases where bullet points appear on their own line
    fixed = fixed.replace(/^(\s*[\-\*\+])\s*\n(\s*)([^\n\-\*\+])/gm, '$1 $3');

    // // Fix numbered lists that are separated from their content
    // fixed = fixed.replace(/^(\s*\d+\.)\s*\n(\s*)([^\n\d])/gm, '$1 $3');

    // // Add a blank line before numbered lists after 'References:'
    // fixed = fixed.replace(/(References:)\n(\d+\.)/g, '$1\n\n$2');

    // // Ensure single blank line before any numbered or bulleted list
    // fixed = fixed.replace(/([^\n])\n(\s*([\-*]|\d+\.) )/g, '$1\n\n$2');

    // // Remove trailing spaces on each line
    // fixed = fixed.replace(/ +$/gm, '');

    // // Ensure proper spacing around headers
    // fixed = fixed.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');

    // // Clean up any double newlines that might have been created
    // fixed = fixed.replace(/\n{3,}/g, '\n\n');

    return fixed;
}

export default function Chat() {
    const { agentId } = useParams();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<TextResponse[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { mutate: sendMessage, isPending } = useSendMessageMutation({ setMessages, setSelectedFile });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !selectedFile) || !agentId) return;

        // Add user message immediately to state
        const userMessage: TextResponse = {
            text: input,
            user: "user",
            attachments: selectedFile ? [{ url: URL.createObjectURL(selectedFile), contentType: selectedFile.type, title: selectedFile.name }] : undefined,
        };
        setMessages((prev) => [...prev, userMessage]);

        sendMessage({ text: input, agentId, selectedFile });
        setInput("");
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen w-full">
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length > 0 ? (
                        messages.map((message, index) => (
                            <div
                                key={index}
                                className={`text-left flex ${
                                    message.user === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <article
                                    className={`max-w-[80%] rounded-lg px-4 py-2 break-words ${
                                        message.user === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    }`}
                                >
                                    <MarkdownRenderer content={fixMarkdown(message.text)} />
                                    {message.attachments?.map((attachment, i) => (
                                        attachment.contentType.startsWith('image/') && (
                                            <img
                                                key={i}
                                                src={message.user === "user"
                                                    ? attachment.url
                                                    : attachment.url.startsWith('http')
                                                        ? attachment.url
                                                        : `http://localhost:3000/media/generated/${attachment.url.split('/').pop()}`
                                                }
                                                alt={attachment.title || "Attached image"}
                                                className="mt-2 max-w-full rounded-lg"
                                            />
                                        )
                                    ))}
                                </article>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground">
                            No messages yet. Start a conversation!
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="border-t p-4 bg-background">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                            disabled={isPending}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleFileSelect}
                            disabled={isPending}
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "..." : "Send"}
                        </Button>
                    </form>
                    {selectedFile && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Selected file: {selectedFile.name}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}