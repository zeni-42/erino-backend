import { Router } from "express";
import { createLead, deleteLead, getAllLeads, getLeadById, leadQuery, leadQuickQuery, updateLead } from "../controllers/leads.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const leadRouter = Router()

leadRouter.post('/',authMiddleware, createLead)
leadRouter.get('/', authMiddleware, getAllLeads)
leadRouter.get('/query', authMiddleware, leadQuickQuery)
leadRouter.get('/allquery', authMiddleware, leadQuery)
leadRouter.get('/:id', authMiddleware, getLeadById)
leadRouter.delete('/:id', authMiddleware, deleteLead)
leadRouter.put("/:id", authMiddleware, updateLead)