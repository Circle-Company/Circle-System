import { Router } from "express"
import { AuthController } from "../controllers/auth"

export const router = Router()

router.post("/sign-up", AuthController.StoreNewUser)
router.post("/sign-in", AuthController.AuthenticateUser)
router.post("/send-verification-code", AuthController.SendVerificationCode)
router.post("/verify-code", AuthController.VerifyCode)
router.post("/refresh-token", AuthController.RefreshToken)
router.post("/send-socket", AuthController.SendSocket)
router.post("/username-already-in-use", AuthController.UsernameAlreadyInUse)
router.put("/change-password", AuthController.ChangePassword)
