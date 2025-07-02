import { AgentRuntime } from "./runtime.ts";
import { embed, getEmbeddingZeroVector } from "./embedding.ts";
import { KnowledgeItem, UUID, type Memory } from "./types.ts";
import { stringToUuid } from "./uuid.ts";
import { splitChunks } from "./generation.ts";
import elizaLogger from "./logger.ts";
// import { PineconeKnowledgeManager } from "@elizaos/adapter-pinecone";

async function get(
    runtime: AgentRuntime,
    message: Memory
): Promise<KnowledgeItem[]> {
    elizaLogger.info("Debug - Starting knowledge retrieval:", {
        hasKnowledgeManager: !!runtime.knowledgeManager,
        knowledgeManagerType: runtime.knowledgeManager?.constructor.name,
        messageId: message.id
    });

    // Add validation for message
    if (!message?.content?.text) {
        elizaLogger.warn("Invalid message for knowledge query:", {
            message,
            content: message?.content,
            text: message?.content?.text,
        });
        return [];
    }

    const processed = preprocess(message.content.text);
    elizaLogger.info("Debug - Knowledge query:", {
        original: message.content.text,
        processed,
        length: processed?.length,
    });

    // Validate processed text
    if (!processed || processed.trim().length === 0) {
        elizaLogger.warn("Empty processed text for knowledge query");
        return [];
    }

    try {
        elizaLogger.info("Debug - Creating embedding for knowledge query");
        const embedding = await embed(runtime, processed);

        elizaLogger.info("Debug - About to search memories with embedding:", {
            embeddingLength: embedding.length,
            knowledgeManagerType: runtime.knowledgeManager?.constructor.name,
            managerMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(runtime.knowledgeManager))
        });

    const fragments = await runtime.knowledgeManager.searchMemoriesByEmbedding(
        embedding,
        {
            match_threshold: 0.55, //threshold for similarity search in vectorDB
            count: 15,
            roomId: message.agentId,
            text: processed,
            originalText: message.content.text
        } as any //to bypass type checking error
    );

    elizaLogger.info("Debug - Found knowledge fragments:", {
        fragmentCount: fragments.length,
        fragments: fragments.map(f => ({
            id: f.id,
            text: f.content.text?.slice(0, 100) + '...',
            similarity: f.similarity
        }))
    });

    const uniqueSources = [
        ...new Set(
            fragments.map((memory) => {
                // elizaLogger.log(
                //     `Matched fragment: Id: ${memory.id} -- ${memory.content.text} with similarity: ${memory.similarity}`
                // );
                return memory.content.source;
            })
        ),
    ];


        const result = fragments
            .filter((memory): memory is NonNullable<typeof memory> => {
                const isValid: boolean = memory !== null && !!memory.id && !!memory.content;
                if (!isValid) {
                    elizaLogger.warn("Found invalid memory item:", {
                        isNull: memory === null,
                        hasId: memory?.id ? true : false,
                        hasContent: memory?.content ? true : false
                    });
                }
                return isValid;
            })
            .map((memory) => ({ id: memory.id, content: memory.content }));

        elizaLogger.info("Debug - Final knowledge items being returned:", {
            count: result.length,
            items: result.map(item => ({
                id: item.id,
                text: item.content.text?.slice(0, 100) + '...'
            }))
        });

        return result;
    } catch (error) {
        elizaLogger.error("Error during knowledge retrieval:", {
            error: error,
            errorMessage: error.message,
            errorStack: error.stack,
            // Add runtime check
            knowledgeManager: !!runtime.knowledgeManager,
            processed: processed
        });
        return [];
    }
}

async function set(
    runtime: AgentRuntime,
    item: KnowledgeItem,
    chunkSize: number = 512,
    bleed: number = 20
) {
    await runtime.documentsManager.createMemory({
        id: item.id,
        agentId: runtime.agentId,
        roomId: runtime.agentId,
        userId: runtime.agentId,
        createdAt: Date.now(),
        content: item.content,
        embedding: getEmbeddingZeroVector(),
    });

    const preprocessed = preprocess(item.content.text);
    const fragments = await splitChunks(preprocessed, chunkSize, bleed);

    for (const fragment of fragments) {
        const embedding = await embed(runtime, fragment);
        await runtime.knowledgeManager.createMemory({
            // We namespace the knowledge base uuid to avoid id
            // collision with the document above.
            id: stringToUuid(item.id + fragment),
            roomId: runtime.agentId,
            agentId: runtime.agentId,
            userId: runtime.agentId,
            createdAt: Date.now(),
            content: {
                source: item.id,
                text: fragment,
            },
            embedding,
        });
    }
}

export function preprocess(content: string): string {
    elizaLogger.debug("Preprocessing text:", {
        input: content,
        length: content?.length,
    });

    if (!content || typeof content !== "string") {
        elizaLogger.warn("Invalid input for preprocessing");
        return "";
    }

    return (
        content
            // Remove code blocks and their content
            .replace(/```[\s\S]*?```/g, "")
            // Remove inline code
            .replace(/`.*?`/g, "")
            // Convert headers to plain text with emphasis
            .replace(/#{1,6}\s*(.*)/g, "$1")
            // Remove image links but keep alt text
            .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
            // Remove links but keep text
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            // Simplify URLs: remove protocol and simplify to domain+path
            .replace(/(https?:\/\/)?(www\.)?([^\s]+\.[^\s]+)/g, "$3")
            // Remove Discord mentions specifically
            .replace(/<@[!&]?\d+>/g, "")
            // Remove HTML tags
            .replace(/<[^>]*>/g, "")
            // Remove horizontal rules
            .replace(/^\s*[-*_]{3,}\s*$/gm, "")
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*/g, "")
            // Normalize whitespace
            .replace(/\s+/g, " ")
            // Remove multiple newlines
            .replace(/\n{3,}/g, "\n\n")
            // Remove special characters except those common in URLs
            .replace(/[^a-zA-Z0-9\s\-_./:?=&]/g, "")
            .trim()
            .toLowerCase()
    );
}

export default {
    get,
    set,
    preprocess,
};
