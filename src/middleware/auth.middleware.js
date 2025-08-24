import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/response.js";
import jwt from "jsonwebtoken"

export const authMiddleware = asyncHandler(async(req, _, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!accessToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_SECRET)
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})