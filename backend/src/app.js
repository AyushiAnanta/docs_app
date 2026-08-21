import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback with credentials enabled
      }
    },
    credentials: true,
  })
);

//configurations!!!!!!!!!!!!!!!!!!1
app.use(express.json({limit: "16mb"}))
app.use(express.urlencoded({extended: true, limit: "16mb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRoutes from './routes/user.routes.js';
import docRoutes from './routes/doc.routes.js';
import folderRoutes from './routes/folder.routes.js';
import versionRoutes from './routes/version.routes.js';
import fileRoutes from './routes/file.routes.js';
import searchRoutes from './routes/search.routes.js';
import ragRoutes from './routes/rag.routes.js';


app.use('/api/v1/user', userRoutes);
app.use('/api/v1/docs', docRoutes);
app.use('/api/v1/folder', folderRoutes);
app.use('/api/v1/version', versionRoutes);
app.use('/api/v1/file', fileRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/rag', ragRoutes);


export { app }