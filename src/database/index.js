const Sequelize = require('sequelize')
const db_config = require('../config/database.js')

// all models imports
const User = require('../models/user/user-model.js')
const ProfilePicture = require('../models/user/profilepicture-model.js')
const Statistic = require('../models/user/statistic-model.js')
const Contact = require('../models/user/contact-model.js')
const Block = require('../models/user/block-model.js')
const Coordinate = require('../models/user/coordinate-model.js')
const Follow = require('../models/user/follow-model.js')
const Report = require('../models/user/report-model.js')
const Relation = require('../models/user/relation-model.js')
const Notification = require('../models/user/notification-model.js')
const Socket = require('..//models/user/socket-model.js')


//mysql database connection
export const connection =  new Sequelize({...db_config, logging: false})

try{
    connection.authenticate()
    console.log('connection has been established successfully.')
} catch(err) {
    console.error('unable to connect to database: ', err)
}

//models connections
User.init(connection)
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

//models associations
User.associate(connection.models)
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

