import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//configurations!!!!!!!!!!!!!!!!!!1
app.use(express.json({limit: "4kb"}))
app.use(express.urlencoded({extended: true, limit: "4kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRoutes from './routes/user.routes.js';
import docRoutes from './routes/doc.routes.js';
import folderRoutes from './routes/folder.routes.js';
import versionRoutes from './routes/version.routes.js';
import fileRoutes from './routes/file.routes.js';


app.use('/api/v1/user', userRoutes);
app.use('/api/v1/docs', docRoutes);
app.use('/api/v1/folder', folderRoutes);
app.use('/api/v1/version', versionRoutes);
app.use('/api/v1/file', fileRoutes);


export { app }