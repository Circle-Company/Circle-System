import { Candidate, InteractionType, UserEmbedding, EmbeddingVector } from "../core/types"

const createMockEmbedding = (): EmbeddingVector => ({
    dimension: 128,
    values: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    createdAt: new Date(),
    updatedAt: new Date(),
})

export const mockPosts: Candidate[] = [
    {
        id: "1",
        user_id: "101",
        created_at: new Date("2024-05-01T10:00:00Z"),
        tags: ["tecnologia", "programação", "desenvolvimento"],
        location: "São Paulo",
        statistics: {
            likes: 150,
            comments: 45,
            shares: 30,
            views: 1200,
        },
        embedding: {
            userId: "101",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["tecnologia", "programação"],
                engagement: 0.85,
            },
        },
    },
    {
        id: "2",
        user_id: "102",
        created_at: new Date("2024-05-02T15:30:00Z"),
        tags: ["esportes", "futebol", "saúde"],
        location: "Rio de Janeiro",
        statistics: {
            likes: 200,
            comments: 60,
            shares: 45,
            views: 2500,
        },
        embedding: {
            userId: "102",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["esportes", "saúde"],
                engagement: 0.92,
            },
        },
    },
    {
        id: "3",
        user_id: "103",
        created_at: new Date("2024-05-03T20:15:00Z"),
        tags: ["arte", "música", "cultura"],
        location: "Belo Horizonte",
        statistics: {
            likes: 180,
            comments: 55,
            shares: 35,
            views: 1800,
        },
        embedding: {
            userId: "103",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["arte", "cultura"],
                engagement: 0.88,
            },
        },
    },
]

export const mockInteractions: Array<{
    userId: string
    entityId: string
    type: InteractionType
    timestamp: Date
    metadata?: Record<string, any>
}> = [
    {
        userId: "201",
        entityId: "1",
        type: "like",
        timestamp: new Date("2024-05-01T11:00:00Z"),
        metadata: {
            engagementTime: 45,
            percentWatched: 100,
        },
    },
    {
        userId: "201",
        entityId: "2",
        type: "long_view",
        timestamp: new Date("2024-05-02T16:00:00Z"),
        metadata: {
            engagementTime: 120,
            percentWatched: 85,
        },
    },
    {
        userId: "201",
        entityId: "3",
        type: "share",
        timestamp: new Date("2024-05-03T21:00:00Z"),
        metadata: {
            engagementTime: 60,
            percentWatched: 90,
        },
    },
]

export const mockUserProfile = {
    userId: "201",
    interests: ["tecnologia", "esportes", "arte"],
    demographics: {
        ageRange: "25-34",
        location: "São Paulo",
        language: "pt-BR",
    },
    preferences: {
        contentTypes: ["posts", "videos", "articles"],
        notificationSettings: {
            email: true,
            push: true,
        },
    },
} 