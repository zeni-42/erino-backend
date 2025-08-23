import { asyncHandler } from "../utils/asynchandler.js";

export const getHTML = async (req, res) => {
    res.header("Content-Type", "text/html");
    res.send(`
        <h1>SERVER UP!</h1>
    `);
}