import {
    comment_on_moment,
    delete_moment,
    delete_moment_list,
    hide_moment,
    like_comment,
    like_moment,
    reply_comment_on_moment,
    undelete_moment,
    unhide_moment,
    unlike_comment,
    unlike_moment,
    view_moment,
} from "./moment-actions-service"
import {
    find_moment_comments,
    find_moment_statistics_view,
    find_moment_tags,
    find_user_feed_moments,
    find_user_moments,
    find_user_moments_tiny,
    find_user_moments_tiny_exclude_memory,
} from "./moment-find-service"
import { store_moment_interaction, store_new_moment, store_new_moment_video } from "./moment-store-service"

export const MomentService = {
    Store: {
        NewMoment: store_new_moment,
        NewVideoMoment: store_new_moment_video,
        Interaction: store_moment_interaction,
    },
    Actions: {
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
        Undelete: undelete_moment,
    },
    Find: {
        UserFeedMoments: find_user_feed_moments,
        UserMoments: find_user_moments,
        UserMomentsTiny: find_user_moments_tiny,
        UserMomentsTinyExcludeMemory: find_user_moments_tiny_exclude_memory,
        MomentComments: find_moment_comments,
        MomentTags: find_moment_tags,
        MomentStatisticsView: find_moment_statistics_view,
    },
}
