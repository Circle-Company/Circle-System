import * as dotenv from "dotenv"
import admin from "firebase-admin"
dotenv.config()

const { privateKey } = JSON.parse(process.env.FIREBASE_PRIVATE_KEY || "")

const credential: any = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
    client_id: process.env.FIREBASE_CLIENT_ID || "",
    auth_uri: process.env.FIREBASE_AUTH_URI || "",
    token_uri: process.env.FIREBASE_TOKEN_URI || "",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || "",
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "",
}

admin.initializeApp({
    credential: admin.credential.cert(credential),
})
export const ADMIN = admin
