import { Lead } from "../models/leads.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError, ApiResponse } from "../utils/response.js";
import bcrypt from "bcryptjs";

export const registerLeads = asyncHandler(async(req, res) => {
    const { first_name, last_name, email, password }  = await req.body

    if (!(first_name && last_name && email && password)) {
        throw new ApiError(400, "Missing fields")
    }

    const existingLead = await Lead.findOne({ email })
    if (existingLead) {
        throw new ApiError(400, "Email is taken")
    }

    if (password.length < 6){
        throw new ApiError(400, "Password must be of 6 charcters")
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const lead = await Lead.create({
        first_name,
        last_name,
        email,
        password: hashedPassword
    })

    const createdLead = await Lead.findById(lead._id).select(
        "-password -refreshToken"
    )

    if (!createdLead) {
        throw new ApiError(500, "Something went wrong while creating the lead")
    }

    return res.status(201).json(
        new ApiResponse(201, createdLead, "Lead registered Successfully")
    )
})