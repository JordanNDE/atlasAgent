import { Pinecone } from '@pinecone-database/pinecone';
import {
    IMemoryManager,
    Memory,
    KnowledgeItem,
    UUID,
    IAgentRuntime,
    elizaLogger,
    splitChunks,
    embed,
    stringToUuid
} from "@elizaos/core";

export class PineconeKnowledgeManager implements IMemoryManager {
    private client: Pinecone;
    private indexName: string;
    tableName: string = 'fragments'; // Required by IMemoryManager
    runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime, apiKey: string, indexName: string) {
        this.runtime = runtime;
        this.client = new Pinecone({ apiKey });
        this.indexName = indexName;
    }

    async createMemory(memory: Memory, unique?: boolean): Promise<void> {
        const index = this.client.index(this.indexName);
        const chunkSize = 512;
        const bleed = 20;

        // Store the full document first
        const documentVector = await embed(this.runtime, memory.content.text);
        await index.upsert([{
            id: memory.id!,
            values: documentVector,
            metadata: {
                type: 'document',
                text: memory.content.text,
                agentId: this.runtime.agentId
            }
        }]);

        // Split and store chunks
        const chunks = await splitChunks(memory.content.text, chunkSize, bleed);

        for (const chunk of chunks) {
            const chunkEmbedding = await embed(this.runtime, chunk);
            const chunkId = stringToUuid(memory.id + chunk);

            await index.upsert([{
                id: chunkId,
                values: chunkEmbedding,
                metadata: {
                    type: 'chunk',
                    text: chunk,
                    sourceId: memory.id!,
                    agentId: this.runtime.agentId
                }
            }]);
        }
    }

    async searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
        }
    ): Promise<Memory[]> {
        const index = this.client.index(this.indexName);

        // Search chunks first
        const chunkResults = await index.query({
            vector: embedding,
            topK: params.count || 5,
            filter: {
                type: 'chunk',
                agentId: this.runtime.agentId
            },
            includeMetadata: true
        });

        // Get unique source documents
        const sourceIds = [...new Set(
            chunkResults.matches
                .map(match => match.metadata?.sourceId as string)
                .filter((id): id is string => id != null)
        )];

        // Fetch full documents
        const documents = await Promise.all(
            sourceIds.map(async (sourceId) => {
                const docResult = await index.fetch([sourceId]);
                return docResult.records[sourceId];
            })
        );

        return documents
            .filter(Boolean)
            .map(doc => ({
                id: doc.id as UUID,
                content: { text: doc.metadata?.text as string },
                embedding: doc.values,
                agentId: this.runtime.agentId,
                roomId: this.runtime.agentId,
                userId: this.runtime.agentId,
                createdAt: Date.now()
            }));
    }

    async addEmbeddingToMemory(memory: Memory): Promise<Memory> {
        if (!memory.embedding) {
            memory.embedding = await embed(this.runtime, memory.content.text);
        }
        return memory;
    }

    async getMemories(params: { roomId: UUID; count?: number; }): Promise<Memory[]> {
        return [];
    }

    async getCachedEmbeddings(params: any): Promise<any[]> {
        return [];
    }

    async getMemoryById(id: UUID): Promise<Memory | null> {
        return null;
    }

    async removeMemory(id: UUID): Promise<void> {}

    async removeAllMemories(roomId: UUID): Promise<void> {}

    async getMemoriesByRoomIds(params: { roomIds: UUID[]; }): Promise<Memory[]> {
        return [];
    }

    async init(): Promise<void> {}

    async countMemories(roomId: UUID): Promise<number> {
        return 0; // Basic implementation - modify as needed
    }

    // Implement other required IMemoryManager methods...
}