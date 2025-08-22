import mongoose from "mongoose" ;
import { DBNAME } from "../constants.js"

const ConnectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DBNAME}`);
        console.log("Database connected");
    } catch (error) {
        console.log("Database connection failed", error);
        process.exit(1);
    }
}

export default ConnectDB