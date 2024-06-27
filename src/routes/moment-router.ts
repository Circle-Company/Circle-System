import { Router } from 'express'
import { UserController } from '../controllers/user'
import { RP } from '../config/routes_prefix'
import { MomentController } from '../controllers/moment'

const momentRouter = Router()
const MOMENT_PREFIX = RP.API_VERISON + RP.MOMENT

//userRouter.use(UserAuthenticationValidator)
//userRouter.post(USER_PROFILE_PREFIX + '/:username', UserController.FindUserByUsername)
momentRouter.post(MOMENT_PREFIX + '/get-feed', MomentController.FindUserFeedMoments)
momentRouter.post(MOMENT_PREFIX + '/get-user-moments', MomentController.FindUserMoments)
momentRouter.post(MOMENT_PREFIX + '/get-user-moments/tiny', MomentController.FindUserMomentsTiny)
momentRouter.post(MOMENT_PREFIX + '/get-user-moments/tiny/exclude-memory', MomentController.FindUserMomentsTinyExcludeMemory)
momentRouter.post(MOMENT_PREFIX + '/get-comments', MomentController.FindMomentComments)
momentRouter.post(MOMENT_PREFIX + '/get-tags', MomentController.FindMomentTags)
momentRouter.post(MOMENT_PREFIX + '/get-statistics/view', MomentController.FindMomentStatisticsView)

momentRouter.post(MOMENT_PREFIX + '/create', MomentController.StoreNewMoment)
momentRouter.post(MOMENT_PREFIX + '/store/interaction', MomentController.StoreMomentInteraction)

momentRouter.post(MOMENT_PREFIX + '/comment', MomentController.CommentOnMoment)
momentRouter.post(MOMENT_PREFIX + '/reply-comment', MomentController.ReplyCommentOnMoment)
momentRouter.post(MOMENT_PREFIX + '/like-comment', MomentController.LikeComment)
momentRouter.post(MOMENT_PREFIX + '/unlike-comment', MomentController.UnlikeComment)
momentRouter.post(MOMENT_PREFIX + '/like', MomentController.Like)
momentRouter.post(MOMENT_PREFIX + '/unlike', MomentController.Unlike)
momentRouter.post(MOMENT_PREFIX + '/view', MomentController.View)
momentRouter.post(MOMENT_PREFIX + '/hide', MomentController.Hide)
momentRouter.post(MOMENT_PREFIX + '/unhide', MomentController.Unhide)
momentRouter.post(MOMENT_PREFIX + '/delete', MomentController.Delete)
momentRouter.post(MOMENT_PREFIX + '/delete-list', MomentController.DeleteList)
momentRouter.post(MOMENT_PREFIX + '/undelete', MomentController.Undelete)

module.exports = momentRouter