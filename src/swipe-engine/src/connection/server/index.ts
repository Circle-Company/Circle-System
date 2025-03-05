import express from "express"
import { StatusCodes } from "http-status-codes"
import config from '../../config'
import swipeEngineRouter from "../routes/route-swipe_engine"
import '../../database/index'
    
const app = express()
app.use(express.json())
app.use( swipeEngineRouter )
app.use((err: any, res: any) => {
    if (err instanceof Error) { return res.status(400).json({ error: err.message }) }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Internal Server Error"
    })
})
app.listen(config.PORT, () => console.log("🚀 swipe-engine (server) - running on port: " + config.PORT))