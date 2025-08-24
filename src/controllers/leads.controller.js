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
        "-password -refresh_token"
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

    const isValidPassword = await bcrypt.compare(password, lead?.password)
    if (!isValidPassword) {
        throw new ApiError(400, "Invalid credentails")
    }

    const { accessToken, refreshToken } = generateAccessAndRefereshTokens(lead)

    await Lead.findByIdAndUpdate(lead?._id, 
        {
            $set: {
                refresh_token: refreshToken
            }
        },
        {
            $new: true
        }
    )

    const loggedinLead = await Lead.findById(lead._id).select(
        "-password -refresh_token"
    )

    const cookieOptions = {
        httpOnly: true, 
        secure: true,
        sameSite: "none",
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
        secure: true,
        sameSite: "none"
    }

    return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(200, {}, "Lead logged out")
    )
})

export const getAllLeads = asyncHandler(async(req, res) => {
    const limit = parseInt(req.query.limit) || 20
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * limit

    if (limit > 100) {
        throw new ApiError(400, "Max limit is 100")
    }

    const documents = await Lead.find().skip(skip).limit(limit)
    const totalDocuments = await Lead.find().countDocuments()

    return res.status(200).json(
        new ApiResponse(200, {
            data: documents,
            page,
            limit,
            total: totalDocuments,
            totalPages: Math.ceil(totalDocuments / limit)
        }, "All Leads data")
    )
})

export const getLeadById = asyncHandler(async(req, res) => {
    const { id } = req.params
    if (!id) {
        throw new ApiError(400, "Missing fields")
    }

    const leadInDB = await Lead.findById(id).select(
        "-password -refresh_token"
    )
    if (!leadInDB) {
        throw new ApiError(400, "Lead not found")
    }

    return res.status(200).json(
        new ApiResponse(200, leadInDB, `Lead data for ${id}`)
    )
})

export const deleteLead = asyncHandler(async (req, res) => { 
    const { id } = req.params
    if (!id) {
        throw new ApiError(400, "Missing values")
    }

    await Lead.findByIdAndDelete(id)

    return res.status(200).json(
        new ApiResponse(200, `Lead deleted where id=${id}`)
    )
})

export const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedUpdates = [
            "first_name",
            "last_name",
            "phone",
            "company",
            "city",
            "state",
            "source",
            "status",
            "score",
            "lead_value",
            "last_activity_at",
            "is_qualified"
        ];

        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const lead = await Lead.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
        ).select(
            "-password -refresh_token"
        );

        return res.status(200).json(
            new ApiResponse(200, lead, "Lead updated successfully")
        )
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};