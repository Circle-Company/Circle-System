import { comment_on_moment, delete_moment, delete_moment_list, hide_moment, like_comment, like_moment, reply_comment_on_moment, undelete_moment, unhide_moment, unlike_comment, unlike_moment, view_moment } from "./moment-actions-controller"
import { find_moment_comments, find_moment_statistics_view, find_moment_tags, find_user_feed_moments, find_user_moments, find_user_moments_tiny, find_user_moments_tiny_exclude_memory} from "./moment-find-controller"
import { store_moment_interaction, store_new_moment } from "./moment-store-controller"

export const MomentController = {
    FindUserFeedMoments: find_user_feed_moments,
    FindUserMoments: find_user_moments,
    FindUserMomentsTiny: find_user_moments_tiny,
    FindUserMomentsTinyExcludeMemory: find_user_moments_tiny_exclude_memory,
    FindMomentComments: find_moment_comments,
    FindMomentStatisticsView: find_moment_statistics_view,
    FindMomentTags: find_moment_tags,
    StoreNewMoment: store_new_moment,
    StoreMomentInteraction: store_moment_interaction,
    CommentOnMoment: comment_on_moment,
    ReplyCommentOnMoment: reply_comment_on_moment,
    LikeComment: like_comment,
    UnlikeComment: unlike_comment,
    Like: like_moment,
    Unlike: unlike_moment,
    View: view_moment,
    Hide: hide_moment,
    Unhide: unhide_moment,
    Delete: delete_moment,
    DeleteList: delete_moment_list,
    Undelete: undelete_moment
}