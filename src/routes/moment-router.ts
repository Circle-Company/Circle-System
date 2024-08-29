import { Router } from "express"
import { MomentController } from "../controllers/moment"

export const router = Router()
router.post("/get-feed", MomentController.FindUserFeedMoments)
router.post("/get-user-moments", MomentController.FindUserMoments)
router.post("/get-user-moments/tiny", MomentController.FindUserMomentsTiny)
router.post(
    "/get-user-moments/tiny/exclude-memory",
    MomentController.FindUserMomentsTinyExcludeMemory
)
router.post("/get-comments", MomentController.FindMomentComments)
router.post("/get-tags", MomentController.FindMomentTags)
router.post("/get-statistics/view", MomentController.FindMomentStatisticsView)

router.post("/create", MomentController.StoreNewMoment)
router.post("/store/interaction", MomentController.StoreMomentInteraction)

router.post("/comment", MomentController.CommentOnMoment)
router.post("/reply-comment", MomentController.ReplyCommentOnMoment)
router.post("/like-comment", MomentController.LikeComment)
router.post("/unlike-comment", MomentController.UnlikeComment)
router.post("/like", MomentController.Like)
router.post("/unlike", MomentController.Unlike)
router.post("/view", MomentController.View)
router.post("/hide", MomentController.Hide)
router.post("/unhide", MomentController.Unhide)
router.post("/delete", MomentController.Delete)
router.post("/delete-list", MomentController.DeleteList)
router.post("/undelete", MomentController.Undelete)
