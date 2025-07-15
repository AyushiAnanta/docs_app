import express from "express";

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




export { app }