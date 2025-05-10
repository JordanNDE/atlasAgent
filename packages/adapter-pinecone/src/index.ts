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

        // Test connection on initialization
        this.testConnection().catch(err => {
            elizaLogger.error("Failed to connect to Pinecone:", {
                error: err.message,
                indexName: this.indexName
            });
        });
    }

    async testConnection(): Promise<boolean> {
        try {
            const index = this.client.index(this.indexName);

            // Try to describe the index to test connection
            const description = await index.describeIndexStats();

            elizaLogger.info("Successfully connected to Pinecone:", {
                indexName: this.indexName,
                totalRecordCount: description.totalRecordCount,
                dimensions: description.dimension,
                namespaces: description.namespaces,
                fullStats: description // Log the full stats object
            });

            return true;
        } catch (error: any) {
            throw new Error(`Pinecone connection test failed: ${error?.message || 'Unknown error'}`);
        }
    }

    async createMemory(memory: Memory, unique?: boolean): Promise<void> {
        // const index = this.client.index(this.indexName);
        // const chunkSize = 1000;  // Match the chunk size used in your Pinecone index
        // const bleed = 20;

        // // Store the full document first
        // const documentVector = await embed(this.runtime, memory.content.text);
        // elizaLogger.info("Debug - Document vector dimensions:", {
        //     vectorLength: documentVector.length,
        //     indexName: this.indexName,
        //     memoryId: memory.id
        // });

        // await index.upsert([{
        //     id: memory.id!,
        //     values: documentVector,
        //     metadata: {
        //         type: 'document',
        //         text: memory.content.text,
        //         agentId: this.runtime.agentId
        //     }
        // }]);

        // // Split and store chunks
        // const chunks = await splitChunks(memory.content.text, chunkSize, bleed);

        // for (const chunk of chunks) {
        //     const chunkEmbedding = await embed(this.runtime, chunk);
        //     elizaLogger.info("Debug - Chunk vector dimensions:", {
        //         vectorLength: chunkEmbedding.length,
        //         chunkLength: chunk.length,
        //         memoryId: memory.id
        //     });

        //     const chunkId = stringToUuid(memory.id + chunk);

        //     await index.upsert([{
        //         id: chunkId,
        //         values: chunkEmbedding,
        //         metadata: {
        //             type: 'chunk',
        //             text: chunk,
        //             sourceId: memory.id!,
        //             agentId: this.runtime.agentId
        //         }
        //     }]);
        // }
        throw new Error('Method not implemented - database is populated externally');
    }

    // The only supported search method is searchMemoriesByEmbedding - as a RAG system
    async searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
            roomId?: string;
            text?: string;
            originalText?: string;
        }
    ): Promise<Memory[]> {
        const index = this.client.index(this.indexName);

        // Debug index info
        elizaLogger.info("Pinecone - Search request:", {
            indexName: this.indexName,
            runtime: {
                agentId: this.runtime.agentId
            },
            searchText: params.text,
            originalText: params.originalText,
            vectorDimensions: embedding.length
        });

        try {
            // First try without filter
            // const unfiltered = await index.query({
            //     topK: params.count || 5,
            //     includeMetadata: true,
            //     vector: embedding
            // });

            //to delete
            // elizaLogger.info("Pinecone - Unfiltered search results:", {
            //     matchCount: unfiltered?.matches?.length || 0,
            //     matches: unfiltered?.matches?.map(m => ({
            //         score: m.score,
            //         metadata: m.metadata,
            //         id: m.id,
            //         text: typeof m.metadata?.text === 'string' ? m.metadata.text.slice(0, 100) + '...' : String(m.metadata?.text || '')
            //     }))
            // });

            // Then try with filter
            const filtered = await index.query({
                topK: params.count || 5,
                includeMetadata: true,
                vector: embedding
                // filter: {
                //     agentId: this.runtime.agentId
                // }
            });

            elizaLogger.info("Pinecone - Filtered search results:", {
                matchCount: filtered?.matches?.length || 0,
                matches: filtered?.matches?.map(m => ({
                    score: m.score,
                    metadata: m.metadata,
                    id: m.id,
                    text: typeof m.metadata?.text === 'string' ? m.metadata.text.slice(0, 100) + '...' : String(m.metadata?.text || '')
                }))
            });

            // Use the filtered results for actual processing
            const results = filtered;

            if (!results?.matches) {
                throw new Error('Invalid response from Pinecone: missing matches array');
            }

            // Add detailed logging for each match
            results.matches.forEach((match, index) => {
                elizaLogger.debug(`Processing match ${index}:`, {
                    id: match.id,
                    metadata: match.metadata,
                    score: match.score,
                    hasSourceId: !!match.metadata?.sourceId,
                    hasDocumentId: !!match.metadata?.document_id,
                    hasText: !!match.metadata?.text
                });
            });

            // Rest of the processing remains the same...
            const documentIds = [...new Set(
                results.matches
                    .map(match => {
                        // Log each match's metadata structure
                        elizaLogger.debug("Match metadata:", {
                            id: match.id,
                            metadata: match.metadata,
                            score: match.score
                        });
                        return match.metadata?.sourceId as string || match.id as string;
                    })
                    .filter(Boolean)
            )];

            elizaLogger.info("Pinecone - Found documents jojo:", {
                documentCount: documentIds.length,
                documentIds
            });

            const memories = results.matches
                .filter((match): match is NonNullable<typeof match> => {
                    const isValid = match !== null;
                    if (!isValid) {
                        elizaLogger.warn("Found null match in results");
                    }
                    return isValid;
                })
                .map(match => {
                    // Ensure we have a valid ID by either using sourceId, document_id from metadata, or the match id
                    const documentId = (match.metadata?.sourceId as string) ||
                                     (match.metadata?.document_id as string) ||
                                     match.id;

                    // Log the ID resolution process
                    elizaLogger.info("Document ID resolution:", {
                        sourceId: match.metadata?.sourceId,
                        documentId: match.metadata?.document_id,
                        matchId: match.id,
                        finalDocumentId: documentId
                    });

                    // Convert to UUID or generate a deterministic UUID from the string
                    const id = stringToUuid(documentId);

                    const memory = {
                        id,
                        content: {
                            text: (match.metadata?.text as string) || '',
                            title: String(match.metadata?.document_title || ''),
                            source: String(match.metadata?.source || ''),
                            category: String(match.metadata?.category || ''),
                            date: String(match.metadata?.date || '')
                        },
                        embedding: undefined,
                        agentId: this.runtime.agentId,
                        roomId: this.runtime.agentId,
                        userId: this.runtime.agentId,
                        createdAt: Date.now(),
                        similarity: match.score || 0
                    };

                    // Log the created memory object
                    elizaLogger.info("Created memory object:", {
                        id: memory.id,
                        hasText: !!memory.content.text,
                        textLength: memory.content.text.length,
                        similarity: memory.similarity
                    });

                    return memory;
                });

            // Log final memories array
            elizaLogger.info("Returning memories array:", {
                count: memories.length,
                memoryIds: memories.map(m => m.id)
            });

            return memories;
        } catch (error: any) {
            elizaLogger.error("Pinecone - Search failed:", {
                error: error.message,
                stack: error.stack,
                indexName: this.indexName,
                searchText: params.text
            });
            throw error;
        }
    }

    async addEmbeddingToMemory(memory: Memory): Promise<Memory> {
        throw new Error('Method not implemented - database is populated externally');
    }

    async getMemories(params: { roomId: UUID; count?: number; }): Promise<Memory[]> {
        throw new Error('Method not implemented - use searchMemoriesByEmbedding instead');
    }

    async getCachedEmbeddings(params: any): Promise<any[]> {
        throw new Error('Method not implemented - database is populated externally');
    }

    async getMemoryById(id: UUID): Promise<Memory | null> {
        throw new Error('Method not implemented - database is populated externally');
    }

    async removeMemory(id: UUID): Promise<void> {
        throw new Error('Method not implemented - database is managed externally');
    }

    async removeAllMemories(roomId: UUID): Promise<void> {
        throw new Error('Method not implemented - database is managed externally');
    }

    async getMemoriesByRoomIds(params: { roomIds: UUID[]; }): Promise<Memory[]> {
        throw new Error('Method not implemented - use searchMemoriesByEmbedding instead');
    }

    async init(): Promise<void> {
        // Keep this empty or just add connection test
        await this.testConnection();
    }

    async countMemories(roomId: UUID): Promise<number> {
        throw new Error('Method not implemented - database is managed externally');
    }

    // Implement other required IMemoryManager methods...
}