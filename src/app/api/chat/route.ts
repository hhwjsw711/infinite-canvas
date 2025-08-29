import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a helpful assistant that can generate images and videos. When the user asks you to create or generate an image, use the generateTextToImage tool. When they ask for a video or animation, use the generateTextToVideo tool. For images, you can suggest different styles like anime, cartoon, realistic, etc. and the system will automatically apply the appropriate LoRA.",
    messages: convertToModelMessages(messages),
    tools: {
      generateTextToImage: {
        description: "Generate an image from a text prompt with optional style",
        inputSchema: z.object({
          prompt: z
            .string()
            .describe("The text prompt to generate an image from"),
          imageSize: z
            .enum(["square"])
            .default("square")
            .describe(
              "The aspect ratio of the generated image. Always use 'square' format.",
            ),
          style: z
            .enum([
              "simpsons",
              "lego",
              "anime",
              "pixel",
              "clay",
              "ghibli",
              "watercolor",
              "pencil_drawing",
              "minimalist",
              "3d",
              "plushie",
              "metallic",
              "snoopy",
              "jojo",
              "americancartoon",
            ])
            .optional()
            .describe("The artistic style to apply to the image"),
        }),
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
