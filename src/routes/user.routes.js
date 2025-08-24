import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const userRouter = Router()

userRouter.post("/", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/logout", authMiddleware, logoutUser)