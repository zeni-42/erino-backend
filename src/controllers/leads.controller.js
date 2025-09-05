import mongoose from "mongoose";
import { Lead } from "../models/leads.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError, ApiResponse } from "../utils/response.js";

export const createLead = asyncHandler(async(req, res) => {
    const {firstName, lastName, email, phone, company, city, state, source, status, score, leadValue, isQualified, lastActivityAt} = await req.body
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
        last_activity_at: lastActivityAt
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

export const leadQuickQuery = asyncHandler( async(req, res) => {
    const { q } = await req.query

    const responseData = await Lead.find({
        $or: [
            { first_name: { $regex: q, $options: "i" } },
            { last_name: { $regex: q, $options: "i" } },
            { company: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { city: { $regex: q, $options: "i" } }
        ]
    })

    return res.status(200).json(
        new ApiResponse(200, responseData, "Search result")
    )
})

export const leadQuery = asyncHandler (async(req, res) => {
    try {
    const {
        search,
        status_equals,
        source_equals,
        score_equals,
        score_gt,
        score_lt,
        score_between,
        lead_value_equals,
        lead_value_gt,
        lead_value_lt,
        lead_value_between,
        created_at_on,
        created_at_before,
        created_at_after,
        created_at_between,
        last_activity_at_on,
        last_activity_at_before,
        last_activity_at_after,
        last_activity_at_between,
        is_qualified_equals,
        limit = 1000,
    } = req.query;

    const filter = {};

    if (search) {
        filter.$or = [
            { first_name: { $regex: search, $options: "i" } },
            { last_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { company: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
        ]
    }

    if (status_equals) filter.status = status_equals;
    if (source_equals) filter.source = source_equals;

    if (score_equals) filter.score = Number(score_equals);
    if (score_gt) filter.score = { ...filter.score, $gt: Number(score_gt) };
    if (score_lt) filter.score = { ...filter.score, $lt: Number(score_lt) };
    if (score_between) {
        const [min, max] = score_between.split(",");
        filter.score = { $gte: Number(min), $lte: Number(max) };
    }
    
    if (lead_value_equals) filter.lead_value = Number(lead_value_equals);
    if (lead_value_gt) filter.lead_value = { ...filter.lead_value, $gt: Number(lead_value_gt) };
    if (lead_value_lt) filter.lead_value = { ...filter.lead_value, $lt: Number(lead_value_lt) };
    if (lead_value_between) {
        const [min, max] = lead_value_between.split(",");
        filter.lead_value = { $gte: Number(min), $lte: Number(max) };
    }
    
    if (created_at_on) filter.createdAt = new Date(created_at_on);
    if (created_at_before) filter.createdAt = { ...filter.createdAt, $lt: new Date(created_at_before) };
    if (created_at_after) filter.createdAt = { ...filter.createdAt, $gt: new Date(created_at_after) };
    if (created_at_between) {
        const [from, to] = created_at_between.split(",");
        filter.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    }
    
    if (last_activity_at_on) filter.last_activity_at = new Date(last_activity_at_on);
    if (last_activity_at_before) filter.last_activity_at = { ...filter.last_activity_at, $lt: new Date(last_activity_at_before) };
    if (last_activity_at_after) filter.last_activity_at = { ...filter.last_activity_at, $gt: new Date(last_activity_at_after) };
    if (last_activity_at_between) {
        const [from, to] = last_activity_at_between.split(",");
        filter.last_activity_at = { $gte: new Date(from), $lte: new Date(to) };
    }
    
    if (is_qualified_equals !== undefined) {
        filter.is_qualified = is_qualified_equals === "true";
    }
    
    const leads = await Lead.find(filter).limit(Number(limit));

    res.status(200).json(
        new ApiResponse(200, leads, "Filtered data")
    );
} catch (error) {
    console.error(error);
    throw new ApiError(500, "Internal server error", error)
}
})