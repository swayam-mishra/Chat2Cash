import "./config/env";
import express from "express";
import cors from "cors";
import router from "./routes";
import { requestLogger } from "./middlewares/logger";
import { globalErrorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api", router);

app.use(globalErrorHandler);

export default app;
