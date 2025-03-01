import Sequelize from "sequelize"
import CONFIG from "../config"
import db_config from "../config/database.js"
// all models imports
import Comment from "../models/comments/comment-model.js"
import CommentLike from "../models/comments/comment_likes-model.js"
import CommentStatistic from "../models/comments/comment_statistics-model.js"
import Memory from "../models/memories/memory-model"
import MemoryMoment from "../models/memories/memory_moments-model"
import Like from "../models/moments/like-model"
import Moment from "../models/moments/moment-model"
import MomentInteraction from "../models/moments/moment_interaction-model.js"
import MomentMetadata from "../models/moments/moment_metadata-model.js"
import MomentMidia from "../models/moments/moment_midia-model.js"
import MomentStatistic from "../models/moments/moment_statistic-model.js"
import MomentTag from "../models/moments/moment_tag-model.js"
import ProfileClick from "../models/moments/profile_click-model.js"
import Share from "../models/moments/share-model.js"
import Skip from "../models/moments/skip-model.js"
import View from "../models/moments/view-model.js"
import Notification from "../models/notification/notification-model"
import NotificationToken from "../models/notification/notification_token-model"
import Preference from "../models/preference/preference-model"
import Tag from "../models/tags/tag-model"
import Block from "../models/user/block-model.js"
import Contact from "../models/user/contact-model.js"
import Coordinate from "../models/user/coordinate-model"
import Follow from "../models/user/follow-model"
import Metadata from "../models/user/metadata-model.js"
import ProfilePicture from "../models/user/profilepicture-model"
import Relation from "../models/user/relation-model"
import Report from "../models/user/report-model.js"
import Statistic from "../models/user/statistic-model"
import User from "../models/user/user-model"
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

//models connections
User.initialize(connection)
Metadata.init(connection)
ProfilePicture.initialize(connection)
Statistic.initialize(connection)
Contact.init(connection)
Block.init(connection)
Coordinate.initialize(connection)
Follow.initialize(connection)
Report.init(connection)
Relation.initialize(connection)
Notification.initialize(connection)
Moment.initialize(connection)
Tag.initialize(connection)
MomentStatistic.init(connection)
MomentMidia.init(connection)
MomentTag.init(connection)
MomentMetadata.init(connection)
Comment.init(connection)
CommentLike.init(connection)
CommentStatistic.init(connection)
Memory.initialize(connection)
MemoryMoment.initialize(connection)
Like.initialize(connection)
View.init(connection)
Share.init(connection)
Skip.init(connection)
ProfileClick.init(connection)
MomentInteraction.init(connection)
NotificationToken.init(connection)
Preference.initialize(connection)

//models associations
User.associate(connection.models)
Metadata.associate(connection.models)
ProfilePicture.associate(connection.models)
Statistic.associate(connection.models)
Contact.associate(connection.models)
Block.associate(connection.models)
Coordinate.associate(connection.models)
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
