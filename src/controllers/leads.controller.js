import { Lead } from "../models/leads.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError, ApiResponse } from "../utils/response.js";

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