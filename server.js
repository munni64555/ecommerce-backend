import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbconnect from "./config/db.js";
import userRoute from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Database
dbconnect();

// Routes
app.use("/api/user", userRoute);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully 🚀");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});