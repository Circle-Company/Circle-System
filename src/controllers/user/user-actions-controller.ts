import { Request, Response } from "express"
import { ValidationError } from "../../errors"
import Coordinate from "../../models/user/coordinate-model.js"
import { UserService } from "../../services/user-service"

export async function block_user(req: any, res: any) {
    const { user_id, blocked_user_id } = req.body
    try {
        await UserService.UserActions.BlockUser({ user_id, blocked_user_id })
        res.status(200).json({
            message: "This user has been successfully blocked",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to block this user",
                action: "check if this user has been previously blocked",
            })
        )
    }
}
export async function unlock_user(req: any, res: any) {
    const { user_id, blocked_user_id } = req.body
    try {
        await UserService.UserActions.UnlockUser({ user_id, blocked_user_id })
        res.status(200).json({
            message: "the user has been successfully unlocked",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to unlock this user",
                action: "check if this user has been previously unlocked",
            })
        )
    }
}

export async function follow_user(req: any, res: any) {
    const { user_id, followed_user_id } = req.body
    try {
        await UserService.UserActions.FollowUser({ user_id, followed_user_id })
        res.status(200).json({
            message: "This user has been successfully followed",
        })
    } catch (err: any) {
        res.status(400).send(
            new ValidationError({
                message: "Failed to follow this user",
                action: "check if this user has been previously followed",
            })
        )
    }
}
export async function unfollow_user(req: any, res: any) {
    const { user_id, followed_user_id } = req.body
    try {
        await UserService.UserActions.UnfollowUser({ user_id, followed_user_id })
        res.status(200).json({
            message: "This user has been successfully unfollowed",
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "Failed to unfollow this user",
                action: "check if this user has been previously unfollowed",
            })
        )
    }
}

export async function updateUserCoordinates(req: Request, res: Response) {
    const { user_id, latitude, longitude } = req.body

    try {
        if (!latitude || !longitude) {
            return res.status(400).json({
                message: "Latitude and longitude are required.",
            })
        }

        const coordinatesAlreadyExists = await Coordinate.findOne({ where: { user_id } })

        if (coordinatesAlreadyExists) {
            await Coordinate.update({ latitude, longitude }, { where: { user_id } })
            return res.status(200).json({
                message: "User coordinates have been successfully updated.",
            })
        } else {
            await Coordinate.create({
                user_id,
                latitude,
                longitude,
            })
            return res.status(201).json({
                message: "User coordinates have been successfully created.",
            })
        }
    } catch (error) {
        console.error("Error updating or creating user coordinates:", error)
        res.status(500).send(
            new ValidationError({
                message: "Failed to update or create user coordinates.",
                action: "Please verify if the user exists and try again.",
            })
        )
    }
}

export async function report(req: any, res: any) {
    const { user_id, reported_content_id, reported_content_type, report_type } = req.body
    try {
        await UserService.UserActions.ReportUser({
            user_id,
            reported_content_id,
            reported_content_type,
            report_type,
        })
        res.status(200).json({
            message: `This  ${reported_content_type} has been successfully reported`,
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: `Failed to report this ${reported_content_type}`,
            })
        )
    }
}
