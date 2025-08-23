import { Router } from "express";
import { loginLead, logoutLead, registerLead } from "../controllers/leads.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const leadRouter = Router()

leadRouter.post('/', registerLead)
leadRouter.post('/login', loginLead)
leadRouter.post('/logout', authMiddleware, logoutLead)