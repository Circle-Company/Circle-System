import { Router } from "express"
import { MomentController } from "../controllers/moment"

export const router = Router()
//------------------------- API V2 Routes ---------------------------//

// Routes for fetching the feed and moments
// Retrieves the user's feed of moments
router.post("/feed", MomentController.FindUserFeedMoments)

// Retrieves all moments associated with the user
router.get("/:user_pk", MomentController.FindUserMoments)

// Retrieves a minimized version of the user's moments
router.get("/tiny/user_pk", MomentController.FindUserMomentsTiny)

// Retrieves a minimized version of the user's moments, excluding memories
router.post("/tiny/exclude-memory", MomentController.FindUserMomentsTinyExcludeMemory)

// Routes for handling comments and tags
// Retrieves comments for a specific moment
router.get("/:id/comments", MomentController.FindMomentComments)

// Retrieves tags associated with a specific moment
router.get("/:id/tags", MomentController.FindMomentTags)

// Routes for handling statistics
// Retrieves preview of statistics for a specific moment
router.get("/:id/statistics/preview", MomentController.FindMomentStatisticsView)

// Routes for creating and interacting with moments
// Creates a new moment in the system
router.post("/create", MomentController.StoreNewMoment)

// Records an interaction with a specific moment
router.get("/:id/interactions", MomentController.StoreMomentInteraction)

// Likes a specific comment
router.post("/comments/:id/like", MomentController.LikeComment)

// Removes a like from a specific comment
router.post("/comments/:id/unlike", MomentController.UnlikeComment)

// Routes for actions related to moments (like, view, hide, delete)
// Likes a specific moment
router.post("/:id/like", MomentController.Like)

// Removes a like from a specific moment
router.post("/:id/unlike", MomentController.Unlike)

// Marks a specific moment as viewed
router.post("/:id/view", MomentController.View)

// Hides a specific moment from the user's feed
router.post("/:id/hide", MomentController.Hide)

// Unhides a specific moment, making it visible in the feed again
router.post("/:id/unhide", MomentController.Unhide)

// Deletes a specific moment from the system
router.delete("/:id/delete", MomentController.Delete)

// Deletes a list of moments from the system
router.delete("/delete-list", MomentController.DeleteList)

// Restores a previously deleted moment
router.post("/:id/undelete", MomentController.Undelete)
