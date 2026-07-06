import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import securityRouter from "./security.js";
import workflowsRouter from "./workflows.js";
import codebaseRouter from "./codebase.js";
import analyzerRouter from "./analyzer.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(securityRouter);
router.use(workflowsRouter);
router.use(codebaseRouter);
router.use(analyzerRouter);
router.use(dashboardRouter);

export default router;
