import admin from "firebase-admin"
const serviceAccount = require("../../firebase-settings.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})
export const ADMIN = admin
