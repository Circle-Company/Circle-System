const dotenv = require('dotenv')
import emails from './emails'
import metadata from './metadata'

// Load env file
if (require.resolve) {
    try {
        dotenv.config({ path: require.resolve('../../.env') })
    } catch (error: any) {
        // This error is thrown when the .env is not found
        if (error.code !== 'MODULE_NOT_FOUND') {
            throw error
        }
    }
}

// Use Cypress env or process.env
declare let Cypress: any | undefined
const env = typeof Cypress !== 'undefined' ? Cypress.env() : process.env // eslint-disable-line no-undef


const environment = {
    API_VERSION: env.API_VERSION,
    NODE_ENV: env.NODE_ENV || process.env.NODE_ENV,
    DEBUG: env.NODE_ENV !== 'production' && env.DEBUG,
    TEST: env.NODE_ENV === 'test',
    PRODUCTION: env.NODE_ENV === 'production'? true : false,
    // used for staging enviroments if 'PRODUCTION=true' and 'PRODUCTION_DB_CLEAN_ALLOW=true'
    PRODUCTION_DB_CLEAN_ALLOW: env.PRODUCTION_DB_CLEAN_ALLOW === 'true' || false, // default = false
}

const server = {
    SOCKET_PORT: env.SOCKET_PORT || 3001,
    PORT: env.PORT || 3000,
    CLIENT_URI: (env.HOST || 'http://localhost:') && (env.PORT || 3000) ,
    JWT_EXPIRES: env.JWT_EXPIRES || 31557600 // one year,
}

const circleapis = {
    CIRCLE_SWIPE_ENGINE_API: env.CIRCLE_SWIPE_ENGINE_API
}

const mysql = {
    development: {
        DB_HOST: env.DEVELOPMENT_DB_HOST || 'localhost',
        DB_USERNAME: env.DEVELOPMENT_DB_USERNAME || 'host',
        DB_PASSWORD: env.DEVELOPMENT_DB_PASSWORD || 'admin',
        DB_NAME: env.DEVELOPMENT_DB_NAME        
    },
    test: {
        DB_HOST: env.TEST_DB_HOST || 'localhost',
        DB_USERNAME: env.TEST_DB_USERNAME || 'host',
        DB_PASSWORD: env.TEST_DB_PASSWORD || 'admin',
        DB_NAME: env.TEST_DB_NAME        
    },
    production: {
        DB_HOST: env.PRODUCTION_DB_HOST || 'localhost',
        DB_USERNAME: env.PRODUCTION_DB_USERNAME || 'host',
        DB_PASSWORD: env.PRODUCTION_DB_PASSWORD || 'admin',
        DB_NAME: env.PRODUCTION_DB_NAME        
    }
}
const required = {
    JWT_SECRET: env.JWT_SECRET,
    PRIVATE_KEY_PASSPHRASE: env.PRIVATE_KEY_PASSPHRASE,
}
const s3 = {
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
    AWS_ENDPOINT: env.AWS_ENDPOINT,
    AWS_REGION: env.AWS_REGION,
    AWS_MIDIA_BUCKET: environment.PRODUCTION? env.AWS_MIDIA_BUCKET_PRODUCTION : env.AWS_MIDIA_BUCKET_DEVELOPMENT,
    AWS_PROFILE_MIDIA_BUCKET: environment.PRODUCTION? env.AWS_PROFILE_MIDIA_BUCKET_DEVELOPMENT : env.AWS_PROFILE_MIDIA_BUCKET_PRODUCTION,
    S3_CONFIGURED:
        env.AWS_ACCESS_KEY_ID &&
        env.AWS_SECRET_ACCESS_KEY &&
        env.AWS_ENDPOINT &&
        env.AWS_REGION &&
        env.AWS_MIDIA_BUCKET | env.AWS_PROFILE_MIDIA_BUCKET,
}

const sms = {
    TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
    TWILIO_MESSAGE_SERVICE_SID: env.TWILIO_MESSAGE_SERVICE_SID,
    TWILIO_PHONE_NUMBER: env.TWILIO_PHONE_NUMBER
}
const options = {
    EMAIL_DEFAULT_SENDER: env.EMAIL_DEFAULT_SENDER,
    SUPPORT_URL: emails.SUPPORT_LINK,
    APPLICATION_NAME: metadata.APPLICATION_NAME,
    ORGANIZATION_URL: emails.ORGANIZATION_LINK,
    PUBLIC_REGISTRATION: env.PUBLIC_REGISTRATION === 'true' || false,
    INVITE_REGISTRATION: env.INVITE_REGISTRATION !== 'false', // default = true
}

  // Check if all required configs are present
Object.entries(required).map((entry) => {
    if (!entry[1]) {
      throw new Error(`ERROR: "${entry[0]}" env variable is missing.`)
    }
    return entry
})

export default {
    ...circleapis,
    ...environment,
    ...server,
    ...required,
    ...s3,
    ...sms,
    ...options,
    ...mysql
  }