import { MomentController } from "../controllers/moment"
import { Router } from "express"

export const router = Router()

// Retrieves the user's feed of moments
router.post("/feed", MomentController.FindUserFeedMoments)

// Retrieves all moments associated with the user
router.get("/:user_pk", MomentController.FindUserMoments)

// Retrieves a minimized version of the user's moments
router.get("/tiny/:user_pk", MomentController.FindUserMomentsTiny)

// Retrieves a minimized version of the user's moments, excluding memories
router.get("/tiny/exclude-memory/:id", MomentController.FindUserMomentsTinyExcludeMemory)

// Retrieves comments for a specific moment
router.get("/:id/comments", MomentController.FindMomentComments)

// Retrieves tags associated with a specific moment
router.get("/:id/tags", MomentController.FindMomentTags)

// Retrieves preview of statistics for a specific moment
router.get("/:id/statistics/preview", MomentController.FindMomentStatisticsView)

// Creates a new moment in the system
router.post("/create", MomentController.StoreNewMoment)

// Creates a new video moment in the system
router.post("/create/video", MomentController.StoreNewVideoMoment)

// Records an interaction with a specific moment
router.post("/:id/interactions/create", MomentController.StoreMomentInteraction)

// Create a comment on specific moment
router.post("/:id/comments/create", MomentController.CommentOnMoment)

router.post("/:id/report", MomentController.ReportMoment)

// Likes a specific comment
router.post("/comments/:id/like", MomentController.LikeComment)

// Removes a like from a specific comment
router.post("/comments/:id/unlike", MomentController.UnlikeComment)

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
router.post("/delete-list", MomentController.DeleteList)

// Restores a previously deleted moment
router.post("/:id/undelete", MomentController.Undelete)
