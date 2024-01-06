import jwt from 'jsonwebtoken'
import CONFIG from './../config'

// Generate an Access Token for the given User ID
type jwtEncoderProps = {
    username: string,
    user_id: number
}

export async function jwtEncoder({
    username,
    user_id,
}: jwtEncoderProps):  Promise<string> {
    const token = jwt.sign({ user_id, username }, CONFIG.JWT_SECRET, {
        expiresIn: CONFIG.JWT_EXPIRES,
        issuer: CONFIG.CLIENT_URI,
        audience: CONFIG.CLIENT_URI,
        subject: user_id.toString(),
    })
    return token.toString()
}