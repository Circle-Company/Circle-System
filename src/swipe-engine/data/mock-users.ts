import { EmbeddingVector, UserEmbedding } from "../core/types"

import { createMockEmbedding } from "./mock-posts"

interface ExtendedUserProfile {
    id: string
    username: string
    interests: string[]
    demographics: {
        ageRange: string
        location: string
        language: string
    }
    preferences: {
        contentTypes: string[]
        topics: string[]
    }
    engagement: {
        averageWatchTime: number
        interactionRate: number
        activeHours: number[]
        activeDays: number[]
    }
}

export const mockUsers: ExtendedUserProfile[] = [
    {
        id: "101",
        username: "techdev_br",
        interests: ["tecnologia", "programação", "desenvolvimento"],
        demographics: {
            ageRange: "25-34",
            location: "São Paulo",
            language: "pt-BR",
        },
        preferences: {
            contentTypes: ["posts", "videos", "articles"],
            topics: ["tecnologia", "inovação", "programação"],
        },
        engagement: {
            averageWatchTime: 45,
            interactionRate: 0.85,
            activeHours: [9, 10, 11, 14, 15, 16],
            activeDays: [1, 2, 3, 4, 5],
        },
    },
    {
        id: "102",
        username: "esporte_saude",
        interests: ["esportes", "futebol", "saúde"],
        demographics: {
            ageRange: "18-24",
            location: "Rio de Janeiro",
            language: "pt-BR",
        },
        preferences: {
            contentTypes: ["posts", "shorts", "lives"],
            topics: ["esportes", "fitness", "nutrição"],
        },
        engagement: {
            averageWatchTime: 60,
            interactionRate: 0.92,
            activeHours: [6, 7, 8, 17, 18, 19],
            activeDays: [1, 3, 5, 6],
        },
    },
    {
        id: "103",
        username: "arte_cultura",
        interests: ["arte", "música", "cultura"],
        demographics: {
            ageRange: "35-44",
            location: "Belo Horizonte",
            language: "pt-BR",
        },
        preferences: {
            contentTypes: ["posts", "articles", "galleries"],
            topics: ["arte", "música", "exposições"],
        },
        engagement: {
            averageWatchTime: 55,
            interactionRate: 0.88,
            activeHours: [10, 11, 14, 15, 20, 21],
            activeDays: [2, 4, 6, 7],
        },
    },
]

export const mockUserEmbeddings: UserEmbedding[] = mockUsers.map(user => ({
    userId: user.id,
    vector: createMockEmbedding(),
    metadata: {
        interests: user.interests,
        engagement: user.engagement.interactionRate,
        lastUpdated: new Date(),
    },
}))

interface UserInteraction {
    contentId: string
    type: string
    duration: number
    timestamp: Date
}

interface UserInteractionSummary {
    totalViews: number
    totalLikes: number
    totalShares: number
    averageWatchTime: number
    topInterests: string[]
}

interface UserInteractionData {
    userId: string
    interactionHistory: UserInteraction[]
    interactionSummary: UserInteractionSummary
}

export const mockUserInteractions: UserInteractionData[] = [
    {
        userId: "101",
        interactionHistory: [
            {
                contentId: "1",
                type: "view",
                duration: 45,
                timestamp: new Date("2024-05-01T10:30:00Z"),
            },
            {
                contentId: "2",
                type: "like",
                duration: 30,
                timestamp: new Date("2024-05-01T11:00:00Z"),
            },
        ],
        interactionSummary: {
            totalViews: 150,
            totalLikes: 45,
            totalShares: 20,
            averageWatchTime: 40,
            topInterests: ["tecnologia", "programação"],
        },
    },
    {
        userId: "102",
        interactionHistory: [
            {
                contentId: "3",
                type: "share",
                duration: 60,
                timestamp: new Date("2024-05-02T15:30:00Z"),
            },
            {
                contentId: "4",
                type: "comment",
                duration: 90,
                timestamp: new Date("2024-05-02T16:00:00Z"),
            },
        ],
        interactionSummary: {
            totalViews: 200,
            totalLikes: 60,
            totalShares: 30,
            averageWatchTime: 55,
            topInterests: ["esportes", "saúde"],
        },
    },
    {
        userId: "103",
        interactionHistory: [
            {
                contentId: "5",
                type: "view",
                duration: 75,
                timestamp: new Date("2024-05-03T20:15:00Z"),
            },
            {
                contentId: "6",
                type: "like",
                duration: 45,
                timestamp: new Date("2024-05-03T21:00:00Z"),
            },
        ],
        interactionSummary: {
            totalViews: 180,
            totalLikes: 55,
            totalShares: 25,
            averageWatchTime: 50,
            topInterests: ["arte", "música"],
        },
    },
]

interface UserCluster {
    id: string
    name: string
    users: string[]
    centroid: EmbeddingVector
    metadata: {
        dominantInterests: string[]
        averageEngagement: number
    }
}

export const mockUserClusters: UserCluster[] = [
    {
        id: "cluster_1",
        name: "Tech Enthusiasts",
        users: ["101"],
        centroid: createMockEmbedding(),
        metadata: {
            dominantInterests: ["tecnologia", "programação"],
            averageEngagement: 0.85,
        },
    },
    {
        id: "cluster_2",
        name: "Sports & Health",
        users: ["102"],
        centroid: createMockEmbedding(),
        metadata: {
            dominantInterests: ["esportes", "saúde"],
            averageEngagement: 0.92,
        },
    },
    {
        id: "cluster_3",
        name: "Arts & Culture",
        users: ["103"],
        centroid: createMockEmbedding(),
        metadata: {
            dominantInterests: ["arte", "música"],
            averageEngagement: 0.88,
        },
    },
] 