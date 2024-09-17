import { NextFunction, Request, Response } from "express"
import { TooManyRequestsError } from "../errors" // Import the custom error class

// Configuration for rate limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 100 // Max requests per IP within the time window

// Store to keep track of requests (in-memory)
const requestCounts = new Map()

function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = req.ipAddress // Use req.ip to identify the client
    const now = Date.now()

    // Initialize or update request count
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, startTime: now })
    } else {
        const requestData = requestCounts.get(ip)

        // Reset the count if the time window has passed
        if (now - requestData.startTime > RATE_LIMIT_WINDOW_MS) {
            requestCounts.set(ip, { count: 1, startTime: now })
        } else {
            requestData.count += 1
            requestCounts.set(ip, requestData)
        }

        // Check if the request count exceeds the limit
        if (requestData.count > MAX_REQUESTS) {
            // Throw TooManyRequestsError with custom message and action
            throw new TooManyRequestsError({
                message:
                    "You have exceeded the maximum number of requests. Please try again later.",
                action: "Please wait a few minutes before retrying.",
            })
        }
    }

    // Clean up expired IPs from the map periodically
    requestCounts.forEach((value, key) => {
        if (now - value.startTime > RATE_LIMIT_WINDOW_MS) {
            requestCounts.delete(key)
        }
    })

    next()
}

export default rateLimit
