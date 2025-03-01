import { Request, Response } from "express"
import CONFIG from "../../config"
import { ValidationError } from "../../errors"
import { ContainSpecialCharacters } from "../../helpers/contain-special-characters"
import { isValidCoordinate } from "../../helpers/coordinate-regex"
import { FindUserAlreadyExists } from "../../helpers/find-user-already-exists"
import Security from "../../libs/security-toolkit/src/index"
import Coordinate from "../../models/user/coordinate-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import User from "../../models/user/user-model"
import { image_compressor } from "../../utils/image/compressor"
import { HEICtoJPEG } from "../../utils/image/conversor"
import { upload_image_AWS_S3 } from "../../utils/image/upload"

export async function edit_user_description(req: Request, res: Response) {
    const { user_id, description } = req.body

    const sanitization = new Security().sanitizerMethods.sanitizeSQLInjection(description)

    if (sanitization.isDangerous) {
        res.status(400).send(
            new ValidationError({
                message:
                    "Characters that are considered malicious have been identified in the description.",
                action: 'Please remove characters like "]})*&',
            })
        )
    }

    if (sanitization.sanitized.length < 4) {
        res.status(400).send(
            new ValidationError({
                message: "The user description must contain at least 4 characters",
                statusCode: 200,
            })
        )
    } else {
        try {
            await User.update(
                { description: sanitization.sanitized },
                {
                    where: { id: user_id },
                }
            )
            res.status(200).json({
                message: "This user description has been updated successfully",
            })
        } catch {
            res.status(400).send(
                new ValidationError({
                    message: "It was not possible to edit the description of this user",
                    action: "Make sure the user has a description to be edited",
                })
            )
        }
    }
}
export async function edit_user_name(req: Request, res: Response) {
    const { user_id, name } = req.body

    const sanitization = new Security().sanitizerMethods.sanitizeSQLInjection(name)

    if (sanitization.isDangerous) {
        res.status(400).send(
            new ValidationError({
                message:
                    "Characters that are considered malicious have been identified in the user name.",
                action: 'Please remove characters like "]})*&',
            })
        )
    }

    if (sanitization.sanitized.length < 4) {
        res.status(400).send(
            new ValidationError({
                message: "The user name must contain at least 4 characters",
                action: "try editing the password",
            })
        )
    } else if (
        await ContainSpecialCharacters({ text: sanitization.sanitized, allow_space_point: false })
    ) {
        res.status(400).send(
            new ValidationError({
                message: "your name cannot contain special characters",
                action: "try editing the name",
            })
        )
    } else {
        try {
            await User.update(
                { name: sanitization.sanitized },
                {
                    where: { id: user_id },
                }
            )
            res.status(200).json({
                message: "This user name has been updated successfully",
            })
        } catch (err: any) {
            res.status(400).send(
                new ValidationError({
                    message: "It was not possible to edit the name of this user",
                    action: "Make sure the user has a name to be edited",
                })
            )
        }
    }
}
export async function edit_user_username(req: Request, res: Response) {
    const { user_id, username } = req.body

    if (username.length < 4 && username.length > 20) {
        res.status(400).send(
            new ValidationError({
                message: "Your username must contain 4 to 20 characters",
            })
        )
    } else if (await ContainSpecialCharacters({ text: username })) {
        res.status(400).send(
            new ValidationError({
                message: "your username can only contain '_' and '.' as special characters",
            })
        )
    } else if ((await FindUserAlreadyExists({ username: username })) === true) {
        res.status(400).send(
            new ValidationError({
                message: "this username already exists",
            })
        )
    } else {
        try {
            await User.update(
                { username: username },
                {
                    where: { id: user_id },
                }
            )
            res.status(200).json({
                message: "This user username has been updated successfully",
            })
        } catch {
            res.status(400).send(
                new ValidationError({
                    message: "It was not possible to edit the username of this user",
                })
            )
        }
    }
}
export async function edit_profile_picture(req: Request, res: Response) {
    const { user_id, midia, metadata } = req.body
    try {
        let midia_base64, small_aws_s3_url, tiny_aws_s3_url

        console.log(user_id, midia, metadata)

        if (metadata.file_type == "image/heic")
            midia_base64 = await HEICtoJPEG({ base64: midia.base64 })
        else midia_base64 = midia.base64

        const compressed_small_base64 = await image_compressor({
            imageBase64: midia_base64,
            quality: 18,
            img_width: metadata.resolution_width,
            img_height: metadata.resolution_width,
            resolution: "FULL_HD",
            isMoment: false,
        })
        const compressed_tiny_base64 = await image_compressor({
            imageBase64: midia_base64,
            quality: 10,
            img_width: metadata.resolution_width,
            img_height: metadata.resolution_width,
            resolution: "NHD",
            isMoment: false,
        })

        small_aws_s3_url = await upload_image_AWS_S3({
            imageBase64: compressed_small_base64,
            bucketName: CONFIG.AWS_PROFILE_MIDIA_BUCKET,
            fileName: "small_" + metadata.file_name,
        })
        tiny_aws_s3_url = await upload_image_AWS_S3({
            imageBase64: compressed_tiny_base64,
            bucketName: CONFIG.AWS_PROFILE_MIDIA_BUCKET,
            fileName: "tiny_" + metadata.file_name,
        })

        await ProfilePicture.update(
            {
                fullhd_resolution: small_aws_s3_url,
                tiny_resolution: tiny_aws_s3_url,
            },
            { where: { user_id: user_id } }
        )

        res.status(200).json({
            fullhd_resolution: small_aws_s3_url,
            tiny_resolution: tiny_aws_s3_url,
        })
    } catch {
        res.status(400).send(
            new ValidationError({
                message: "It was not possible to edit the profile picture of this user",
                action: "Make sure the user has a profile picture to be edited",
            })
        )
    }
}

export async function updateUserCoordinates(req: Request, res: Response) {
    const { user_id, latitude, longitude } = req.body

    try {
        // Verifica se latitude e longitude são strings e são válidas
        if (typeof latitude !== "string" || typeof longitude !== "string") {
            new ValidationError({
                message: "Latitude and longitude must be provided as strings.",
                action: "Check if Latitude and Longitude are strings.",
            })
        }

        if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
            new ValidationError({
                message: "Invalid latitude or longitude format.",
                action: "Check if latitude and longitude are in coordinate format (XX.XXXXXXXXXXXXXX)",
            })
        }

        if (!latitude || !longitude) {
            new ValidationError({
                message: "Latitude and longitude are required.",
                action: "Check if latitude and longitude are in coordinate format",
            })
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
