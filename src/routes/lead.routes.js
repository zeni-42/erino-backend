import { Router } from "express";
import { deleteLead, getAllLeads, getLeadById, loginLead, logoutLead, registerLead } from "../controllers/leads.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const leadRouter = Router()

leadRouter.post('/', registerLead)
leadRouter.post('/login', loginLead)
leadRouter.post('/logout', authMiddleware, logoutLead)
leadRouter.get('/', authMiddleware, getAllLeads)
leadRouter.get('/:id', authMiddleware, getLeadById)
leadRouter.delete('/:id', authMiddleware, deleteLead)