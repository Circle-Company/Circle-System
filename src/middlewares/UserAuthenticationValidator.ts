import { UnauthorizedError} from "../errors"
import jwt from "jsonwebtoken"
import CONFIG from "../config"

export async function UserAuthenticationValidator(
    req: any, res: any, next: any
) {
    const authHeader = req.headers.authorization_token
    if(!authHeader) {
        res.send( new UnauthorizedError({
            message: 'you are not authorized to access this route',
        }))
    } else {
        const token_parts = authHeader.split(' ')

        if(token_parts.length < 2){
            res.send( new UnauthorizedError({
                message: 'your access token is invalid',
            }))
        } else {
            const [ scheme, token ]  = token_parts

            const regex = /^Bearer$/
            if(!regex.test(scheme)) {
                res.send( new UnauthorizedError({
                    message: 'your access token is invalid',
                }))
            }
            jwt.verify(token, CONFIG.JWT_SECRET, (err: any, decoded: any) => {

                if(err) res.send( new UnauthorizedError({ message: err.message }))

                req.user_id = decoded.user_id
                req.username = decoded.username
                next()
            })
            
        }

    }
} 