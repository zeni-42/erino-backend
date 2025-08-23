import { Lead } from "../models/leads.model.js";
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
        const lead = await Lead.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )

        if (!lead) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.lead = lead;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})