// all models imports
import Block from "../models/user/block-model"
import CONFIG from "../config"
import Comment from "../models/comments/comment-model"
import CommentLike from "../models/comments/comment_likes-model"
import CommentStatistic from "../models/comments/comment_statistics-model"
import Contact from "../models/user/contact-model"
import Coordinate from "../models/user/coordinate-model"
import Follow from "../models/user/follow-model"
import Like from "../models/moments/like-model"
import Memory from "../models/memories/memory-model"
import MemoryMoment from "../models/memories/memory_moments-model"
import Metadata from "../models/user/metadata-model"
import Moment from "../models/moments/moment-model"
import MomentInteraction from "../models/moments/moment_interaction-model"
import MomentMetadata from "../models/moments/moment_metadata-model"
import MomentMidia from "../models/moments/moment_midia-model"
import MomentStatistic from "../models/moments/moment_statistic-model"
import MomentTag from "../models/moments/moment_tag-model"
import Notification from "../models/notification/notification-model"
import NotificationToken from "../models/notification/notification_token-model"
import Preference from "../models/preference/preference-model"
import ProfileClick from "../models/moments/profile_click-model"
import ProfilePicture from "../models/user/profilepicture-model"
import Relation from "../models/user/relation-model"
import Report from "../models/user/report-model"
import Sequelize from "sequelize"
import Share from "../models/moments/share-model"
import Skip from "../models/moments/skip-model"
import Statistic from "../models/user/statistic-model"
import Tag from "../models/tags/tag-model"
import User from "../models/user/user-model"
import View from "../models/moments/view-model"
import db_config from "../config/database"
// swipe-engine models
import { initializeModels as initializeSwipeEngineModels } from "../swipe-engine"
//mysql database connection

const DB_CONFIG =
    CONFIG.NODE_ENV === "development"
        ? db_config.development
        : CONFIG.NODE_ENV === "production"
        ? db_config.production
        : CONFIG.NODE_ENV === "test"
        ? db_config.test
        : db_config.development

const enableLogging = CONFIG.NODE_ENV === "development" ? true : false

export const connection = new Sequelize({ ...DB_CONFIG, logging: enableLogging })
try {
    connection.authenticate()
    console.log("✅ MYSQL connection has been established.")
} catch (err) {
    console.error("unable to connect to database: ", err)
}

// Inicializar modelos do Swipe Engine primeiro
initializeSwipeEngineModels()

// Inicializar modelos na ordem correta
// Primeiro inicializar os modelos básicos sem dependências
User.initialize(connection)
Coordinate.initialize(connection) // Garantir que Coordinate seja inicializado antes de ser usado
Metadata.initialize(connection)
ProfilePicture.initialize(connection)
Statistic.initialize(connection)
Contact.initialize(connection)
Block.initialize(connection)
Follow.initialize(connection)
Report.initialize(connection)
Relation.initialize(connection)
Notification.initialize(connection)
Moment.initialize(connection)
Tag.initialize(connection)
MomentStatistic.initialize(connection)
MomentMidia.initialize(connection)
MomentTag.initialize(connection)
MomentMetadata.initialize(connection)
Comment.initialize(connection)
CommentLike.initialize(connection)
CommentStatistic.initialize(connection)
Memory.initialize(connection)
MemoryMoment.initialize(connection)
Like.initialize(connection)
View.initialize(connection)
Share.initialize(connection)
Skip.initialize(connection)
ProfileClick.initialize(connection)
MomentInteraction.initialize(connection)
NotificationToken.initialize(connection)
Preference.initialize(connection)

// Criar índices FULLTEXT de forma assíncrona
User.ensureFullTextIndex(connection).catch(error => {
    console.error("❌ Erro ao criar índice FULLTEXT:", error)
})

// Configurar associações APÓS todos os modelos serem inicializados
User.associate(connection.models)
Coordinate.associate(connection.models) // Garantir que Coordinate associe corretamente
Metadata.associate(connection.models)
ProfilePicture.associate(connection.models)
Statistic.associate(connection.models)
Contact.associate(connection.models)
Block.associate(connection.models)
Follow.associate(connection.models)
Report.associate(connection.models)
Relation.associate(connection.models)
Notification.associate(connection.models)
Moment.associate(connection.models)
Tag.associate(connection.models)
MomentStatistic.associate(connection.models)
MomentMidia.associate(connection.models)
MomentTag.associate(connection.models)
MomentMetadata.associate(connection.models)
Comment.associate(connection.models)
CommentLike.associate(connection.models)
CommentStatistic.associate(connection.models)
Memory.associate(connection.models)
MemoryMoment.associate(connection.models)
Like.associate(connection.models)
View.associate(connection.models)
Share.associate(connection.models)
Skip.associate(connection.models)
ProfileClick.associate(connection.models)
MomentInteraction.associate(connection.models)
NotificationToken.associate(connection.models)
Preference.associate(connection.models)
