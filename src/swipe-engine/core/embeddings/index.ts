/**
 * Exportação central dos serviços de embedding
 */

import { PostEmbeddingService } from "./PostEmbeddingService"
import { UserEmbeddingService } from "./UserEmbeddingService"

export * from "./PostEmbeddingService"
export * from "./UserEmbeddingService"

// Interface simplificada para agrupar os serviços
export interface EmbeddingServices {
    userEmbeddingService: UserEmbeddingService
    postEmbeddingService: PostEmbeddingService
}
