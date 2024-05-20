import * as dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { connectToDatabase } from "./database";
import { authRouter } from "./routes/auth.routes";
import authMiddleware from "./authmiddleware";
import clientRouter from "./routes/client.routes";
import { userRouter } from "./routes/user.routes";
import { shiftRouter } from "./routes/shift.routes";

// Load environment variables from the .env file, where the ATLAS_URI is configured
dotenv.config();

const { ATLAS_URI } = process.env;

if (!ATLAS_URI) {
    console.error("No ATLAS_URI environment variable has been defined in config.env");
    process.exit(1);
}

connectToDatabase(ATLAS_URI)
    .then(() => {
        const app = express();
        app.use(cors());
        app.use(express.json()); 
        
        app.use('/api/auth', authRouter);
       
        app.use("/api/clients", clientRouter);

        app.use("/api/users", userRouter);

        app.use("/api/shifts", shiftRouter);

        app.listen(5200, () => {
            console.log(`Server running at http://localhost:5200...`);
        });
    })
    .catch(error => console.error(error));
