import express, { type Request, Response, NextFunction } from "express";
import apiRoutes from "./routes/index";
import { log, requestLogger } from "./middlewares/logger";
import { apiLimiter } from "./middlewares/rateLimiter";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(requestLogger);
app.use("/api/", apiLimiter);
app.use("/api/", apiRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  log(`Backend API server successfully started on port ${PORT}`);
});