import { Router } from "express";
import { registerLeads } from "../controllers/leads.controller.js";

export const leadRouter = Router()

leadRouter.post('/', registerLeads)