import jwt from "jsonwebtoken"

export const generateAccessAndRefereshTokens = (lead) => {

    const accessToken = jwt.sign(
        {
            _id: lead?._id,
            first_name: lead?.first_name,
            last_name: lead?.last_name
        },
        process.env.ACCESS_SECRET,
        { 
            expiresIn: '7d'
        }
    )

    const refreshToken = jwt.sign(
        {
            _id: lead?._id
        },
        process.env.REFRESH_SECRET,
        {
            expiresIn: "30d"
        }
    )

    return { accessToken, refreshToken }
}