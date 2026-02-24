import "./config/env"; // OPTIMIZATION: Validate ENV before anything else
import express from "express";
import cors from "cors";
import router from "./routes";
import { log, requestLogger } from "./middlewares/logger";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

const app = express();
const PORT = env.PORT; // Type-safe access

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api", router);

// OPTIMIZATION: Centralized Error Handling
app.use(globalErrorHandler);

app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`, "info");
  log(`Environment: ${env.NODE_ENV}`, "info");
});