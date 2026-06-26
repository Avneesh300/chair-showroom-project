import dotenv from 'dotenv';
dotenv.config({
    path: "./.env",
})
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from "./dbs/db.js";
import mainRoute from "./grouproutes/mainRoute.js"

const app = express();
connectDB();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(
    path.join(__dirname, "uploads")
));

app.use("/api/v1", mainRoute);

app.get("/", (req, res) => {
    res.send("Api is running");
})

app.use((error, req, res, next) => {
    console.log("ERROR => ", error);
    return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
        error: error
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})

export default app;