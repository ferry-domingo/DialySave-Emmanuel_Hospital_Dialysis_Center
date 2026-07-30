import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";
import routes from "./src/routes/index.js";
import { initSocket } from "./src/socket.js";
import { realtimeUpdates } from "./src/middleware/realtimeMiddleware.js";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : isProduction
    ? false
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "12mb" }));
app.use(realtimeUpdates);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DialySAVE API is running.",
  });
});

app.use("/api", routes);

if (isProduction) {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const frontendDirectory = path.resolve(currentDirectory, "../frontend/dist");
  app.use(express.static(frontendDirectory));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(frontendDirectory, "index.html"));
  });
}

const httpServer = createServer(app);
initSocket(httpServer, allowedOrigins);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
    if (isProduction && !process.env.JWT_SECRET) throw new Error("JWT_SECRET is required in production.");
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

startServer();
