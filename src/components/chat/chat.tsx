"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import { styleModels } from "@/lib/models";

interface ChatProps {
  onImageGenerated?: (imageUrl: string) => void;
  customApiKey?: string;
}

interface GenerateImageInput {
  prompt: string;
  imageSize?: string;
}

interface GenerateImageOutput {
  url: string;
  width: number;
  height: number;
  seed?: number;
}

export default function Chat({ onImageGenerated, customApiKey }: ChatProps) {
  const { toast } = useToast();
  const trpc = useTRPC();
  const { mutateAsync: generateTextToImage } = useMutation(
    trpc.generateTextToImage.mutationOptions(),
  );

  const { messages, sendMessage, status, addToolResult } = useChat({
    id: "infinite-kanvas-chat", // This enables persistence
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),

    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // Handle client-side tool calls
    async onToolCall({ toolCall }) {
      // Check if it's a dynamic tool first for proper type narrowing
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === "generateTextToImage") {
        try {
          // Extract the tool input with style support
          const { prompt, style, imageSize } = toolCall.input as {
            prompt: string;
            style?: string;
            imageSize?: "square";
          };

          // Find the style model if specified
          let selectedStyle = styleModels.find((m) => m.id === "simpsons"); // default
          if (style) {
            const foundStyle = styleModels.find((m) => m.id === style);
            if (foundStyle) {
              selectedStyle = foundStyle;
            }
          }

          // Combine the style prompt with user prompt
          const finalPrompt = selectedStyle
            ? `${prompt}, ${selectedStyle.prompt}`
            : prompt;

          // Call the tRPC mutation with LoRA
          const result = await generateTextToImage({
            prompt: finalPrompt,
            imageSize: "square",
            loraUrl: selectedStyle?.loraUrl,
            apiKey: customApiKey,
          });

          // Notify parent component if callback provided
          if (onImageGenerated) {
            onImageGenerated(result.url);
          }

          // Tell the AI SDK the tool execution is complete
          addToolResult({
            tool: "generateTextToImage",
            toolCallId: toolCall.toolCallId,
            output: `Image generated in ${selectedStyle?.name || "default"} and added to canvas`,
          });
        } catch (error) {
          console.error("Error generating image:", error);

          toast({
            title: "Generation failed",
            description:
              error instanceof Error
                ? error.message
                : "Failed to generate image",
            variant: "destructive",
          });

          // Re-throw the error - the AI SDK will handle it
          throw error;
        }
      }
    },
  });

  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Response key={`${message.id}-${index}`}>
                          {part.text}
                        </Response>
                      );

                    case "tool-generateTextToImage": {
                      const callId = part.toolCallId;

                      switch (part.state) {
                        case "input-streaming":
                          return (
                            <div
                              key={callId}
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              <Loader />
                              Preparing to generate image...
                            </div>
                          );
                        case "input-available":
                          const input = part.input as {
                            prompt: string;
                            style?: string;
                          };
                          const styleName = input.style
                            ? styleModels.find((m) => m.id === input.style)
                                ?.name || input.style
                            : "Default";

                          return (
                            <div key={callId} className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader />
                                Generating image: "{input.prompt}"
                              </div>
                              {input.style && (
                                <div className="flex items-center gap-2 ml-6">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  <span className="text-purple-600 font-medium text-xs">
                                    Using {styleName} Lora
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        case "output-available":
                          const outputInput = part.input as { style?: string };
                          const outputStyleName = outputInput.style
                            ? styleModels.find(
                                (m) => m.id === outputInput.style,
                              )?.name || outputInput.style
                            : "Default";

                          return (
                            <div key={callId} className="space-y-2">
                              <p className="text-sm text-green-600">
                                ✓ Image generated in {outputStyleName} style and
                                added to canvas
                              </p>
                            </div>
                          );
                        case "output-error":
                          return (
                            <div key={callId} className="text-destructive">
                              Error: {part.errorText}
                            </div>
                          );
                      }
                      break;
                    }

                    default:
                      return null;
                  }
                })}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2">
                  <Loader />
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="border-t p-4">
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me to generate an image..."
        />
        <PromptInputSubmit disabled={!input} status={status} />
      </PromptInput>
    </div>
  );
}
