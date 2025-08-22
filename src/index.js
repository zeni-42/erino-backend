import { app } from "./app.js";
import ConnectDB from "./database/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
})

const port = process.env.PORT
if (!port) {
    console.log("PORT not found in .env");
    process.exit(1);
}

ConnectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`SERVER: ${port}`);
    })
})
.catch((e) => {
    console.log(`Failed to listen | Error: ${e}`);
})