import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/response.js";

export const healthCheck = asyncHandler( async (req, res) => {
    const dbPing = await mongoose.connection.db.admin().ping()

    const responseData = {
        status: "ok",
        uptime: process.uptime(),
        service: {
            database: dbPing?.ok == 1 ? "ACTIVE" : "INACTIVE"  
        },
        timestamp: new Date().toISOString()
    }

    return res.status(200).json(
        new ApiResponse(200, responseData, "Server status")
    )
})