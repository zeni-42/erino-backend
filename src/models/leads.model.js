import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    phone: {
        type: Number,
        unique: true,
        index: true
    },
    company: { 
        type: String,
        maxlength: 255
    },
    city: { 
        type: String, 
        maxlength: 100 
    },
    state: { 
        type: String, 
        maxlength: 100 
    },
    source: {
        type: String,
        enum: ["website", "facebook_ads", "google_ads", "referral", "events", "other"],
    },
    status: {
        type: String,
        enum: ["new", "contacted", "qualified", "lost", "won"],
        default: "new",
    },
    score: { 
        type: Number, 
        min: 0, 
        max: 100, 
        default: 0 
    },
    lead_value: { 
        type: Number, 
        default: 0 
    },
    last_activity_at: { 
        type: Date, 
        default: null
    },
    is_qualified: {
        type: Boolean, 
        default: false 
    },
}, { timestamps: true, versionKey: false })

export const Lead = mongoose.model("Lead", leadSchema)