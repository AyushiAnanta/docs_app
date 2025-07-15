import dotenv from "dotenv";
import connectDb from "./db/index.js";

dotenv.config({
    path: './.env'
})

connectDb()
.then(() => {

    app.on("error", (error) => {
            console.error("ERROR",error);
            throw error;
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`SERVER IS LISTENING AT PORT ${process.env.PORT}`)
    })
})

.catch((err) => {
    console.log("mongo db con fail", err)
})
