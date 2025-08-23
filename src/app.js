import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import healthRouter from "./routes/health.router.js";
import { leadRouter } from "./routes/lead.routes.js";
import { getHTML } from "./controllers/default.controller.js";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/", getHTML)
app.use("/api/v1/health", healthRouter)
app.use("/api/v1/leads", leadRouter)

export { app }