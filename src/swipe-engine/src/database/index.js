const Sequelize = require('sequelize');
const db_config = require('../config/database.js');
const CONFIG = require('../config');

const User = require('../models/user/user-model.js');
const Metadata = require('../models/user/metadata-model.js');
const ProfilePicture = require('../models/user/profilepicture-model.js');
const Statistic = require('../models/user/statistic-model.js');
const Contact = require('../models/user/contact-model.js');
const Block = require('../models/user/block-model.js');
const Coordinate = require('../models/user/coordinate-model.js');
const Follow = require('../models/user/follow-model.js');
const Report = require('../models/user/report-model.js');
const Relation = require('../models/user/relation-model.js');
const Notification = require('../models/user/notification-model.js');
const Moment = require('../models/moments/moment-model.js');
const Socket = require('../models/user/socket-model.js');
const Tag = require('../models/tags/tag-model.js');
const MomentStatistic = require('../models/moments/moment_statistic-model.js');
const MomentMidia = require('../models/moments/moment_midia-model.js');
const MomentTag = require('../models/moments/moment_tag-model.js');
const MomentMetadata = require('../models/moments/moment_metadata-model.js');
const Comment = require('../models/comments/comment-model.js');
const CommentStatistic = require('../models/comments/comment_statistics-model.js');
const Memory = require('../models/memories/memory-model.js');
const MemoryMoment = require('../models/memories/memory_moments-model.js');
const Like = require('../models/moments/like-model.js');
const View = require('../models/moments/view-model.js');
const Share = require('../models/moments/share-model.js');
const Skip = require('../models/moments/skip-model.js');
const ProfileClick = require('../models/moments/profile_click-model.js');
const MomentInteraction = require('../models/moments/moment_interaction-model.js')

let DB_CONFIG

if(CONFIG.default.NODE_ENV === 'development') DB_CONFIG = db_config.development
else if(CONFIG.default.NODE_ENV === 'test') DB_CONFIG = db_config.test
else if(CONFIG.default.NODE_ENV === 'production') DB_CONFIG = db_config.production
else DB_CONFIG = db_config.development

const connection =  new Sequelize(DB_CONFIG)
try{
    connection.authenticate()
    console.log('connection has been established successfully.')
} catch(err) {
    console.error('unable to connect to database: ', err)
}
//models connections
User.init(connection)
Metadata.init(connection)
ProfilePicture.init(connection)
Statistic.init(connection)
Contact.init(connection)
Block.init(connection)
Coordinate.init(connection)
Follow.init(connection)
Report.init(connection)
Relation.init(connection)
Notification.init(connection)
Socket.init(connection)
Moment.init(connection)
Tag.init(connection)
MomentStatistic.init(connection)
MomentMidia.init(connection)
MomentTag.init(connection)
MomentMetadata.init(connection)
Comment.init(connection)
CommentStatistic.init(connection)
Memory.init(connection)
MemoryMoment.init(connection)
Like.init(connection)
View.init(connection)
Share.init(connection)
Skip.init(connection)
ProfileClick.init(connection)
MomentInteraction.init(connection)

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
Socket.associate(connection.models)
Moment.associate(connection.models)
Tag.associate(connection.models)
MomentStatistic.associate(connection.models)
MomentMidia.associate(connection.models)
MomentTag.associate(connection.models)
MomentMetadata.associate(connection.models)
Comment.associate(connection.models)
CommentStatistic.associate(connection.models)
Memory.associate(connection.models)
MemoryMoment.associate(connection.models)
Like.associate(connection.models)
View.associate(connection.models)
Share.associate(connection.models)
Skip.associate(connection.models)
ProfileClick.associate(connection.models)
MomentInteraction.associate(connection.models)

module.exports = connection
