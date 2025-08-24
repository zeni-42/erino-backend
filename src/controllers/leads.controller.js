import { Lead } from "../models/leads.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError, ApiResponse } from "../utils/response.js";

export const createLead = asyncHandler(async(req, res) => {
    const {firstName, lastName, email, phone, company, city, state, source, status, score, leadValue, isQualified} = await req.body
    if (!(firstName && lastName && email && phone && source && status)){
        throw new ApiError(400, "Missing fields")
    }

    if (score != null && (isNaN(score) || score < 0)) {
        throw new ApiError(400, "Score must be a non-negative number")
    }
    if (leadValue != null && (isNaN(leadValue) || leadValue < 0)) {
        throw new ApiError(400, "Lead value must be a non-negative number")
    }
    
    const validSources = ["website", "facebook_ads", "google_ads", "referral", "events", "other"]
    const validStatuses = ["new", "contacted", "qualified", "lost", "won"]
    if (!validSources.includes(source)) {
        throw new ApiError(400, "Invalid source value")
    }
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status value")
    }
    
    if (company && company.length > 255) {
        throw new ApiError(400, "Company name too long")
    }
    if (city && city.length > 100) {
        throw new ApiError(400, "City name too long")
    }
    if (state && state.length > 100) {
        throw new ApiError(400, "State name too long")
    }

    const existingLead = await Lead.findOne({
        $or: [{ email }, { phone }],
    })
    if (existingLead) {
        throw new ApiError(409, "Lead with this email or phone already exists")
    }

    const lead = Lead.create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        phone,
        company,
        city,
        state,
        source,
        status,
        score: score ?? 0,
        lead_value: leadValue ?? 0,
        is_qualified: isQualified ?? false,
    })

    return res.status(201).json(
        new ApiResponse(201, lead, "Lead added")
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