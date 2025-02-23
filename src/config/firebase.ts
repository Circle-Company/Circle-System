import config from "config"
import admin from "firebase-admin"

const credential: any = {
    type: "service_account",
    project_id: `${config.FIREBASE_PROJECT_ID}`,
    private_key_id: `${config.FIREBASE_PRIVATE_KEY_ID}`,
    private_key: `${config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")}`, // Corrige quebras de linha
    client_email: `${config.FIREBASE_CLIENT_EMAIL}`,
    client_id: `${config.FIREBASE_CLIENT_ID}`,
    auth_uri: `${config.FIREBASE_AUTH_URI}`,
    token_uri: `${config.FIREBASE_TOKEN_URI}`,
    auth_provider_x509_cert_url: `${config.FIREBASE_AUTH_PROVIDER_CERT_URL}`,
    client_x509_cert_url: `${config.FIREBASE_CLIENT_CERT_URL}`,
    universe_domain: `${config.FIREBASE_UNIVERSE_DOMAIN}`,
}

admin.initializeApp({
    credential: admin.credential.cert(credential),
})
export const ADMIN = admin
