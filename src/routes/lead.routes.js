import { Router } from "express";
import { deleteLead, getAllLeads, getLeadById, updateLead } from "../controllers/leads.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const leadRouter = Router()

leadRouter.get('/', authMiddleware, getAllLeads)
leadRouter.get('/:id', authMiddleware, getLeadById)
leadRouter.delete('/:id', authMiddleware, deleteLead)
leadRouter.put("/:id", authMiddleware, updateLead)