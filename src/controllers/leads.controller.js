import { Lead } from "../models/leads.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError, ApiResponse } from "../utils/response.js";
import bcrypt from "bcryptjs";
import { generateAccessAndRefereshTokens } from "../utils/token.js";

export const registerLead = asyncHandler(async(req, res) => {
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

export const loginLead = asyncHandler(async(req, res) => {
    const { email, password } = await req.body

    if (!(email && password)) {
        throw new ApiError(400, "Missing fields")
    }

    const lead = await Lead.findOne({ email })
    if (!lead) {
        throw new ApiError(404, "Lead not found")
    }

    const isValidPassword = bcrypt.compare(password, lead?.password)
    if (!isValidPassword) {
        throw new ApiError(400, "Invalid credentails")
    }

    const { accessToken, refreshToken } = generateAccessAndRefereshTokens(lead)

    const loggedinLead = await Lead.findById(lead._id).select(
        "-password -refreshToken"
    )

    const cookieOptions = {
        httpOnly: true, 
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, loggedinLead, "Lead logged in")
    )
})

export const logoutLead = asyncHandler( async(req, res) => {
    const { _id } = req?.lead  

    await Lead.findByIdAndUpdate(_id,
        {
            $unset: {
                refresh_token: 1
            },
        },
        {
            $new: true
        }
    )

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(
        new ApiResponse(200, {}, "Lead logged out")
    )
})