import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError, ApiResponse } from "../utils/response.js";
import { generateAccessAndRefereshTokens } from "../utils/token.js";
import bcrypt from "bcryptjs"

export const registerUser = asyncHandler (async(req, res) => {
    const { fullName, email, password }  = await req.body

    if (!(fullName&& email && password)) {
        throw new ApiError(400, "Missing fields")
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        throw new ApiError(400, "Email is taken")
    }

    if (password.length < 6){
        throw new ApiError(400, "Password must be of 6 charcters")
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
        fullName,
        email,
        password: hashedPassword
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refresh_token"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the lead")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully")
    )
})

export const loginUser = asyncHandler(async(req, res) => {
    const { email, password } = await req.body

    if (!(email && password)) {
        throw new ApiError(400, "Missing fields")
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isValidPassword = await bcrypt.compare(password, user?.password)
    if (!isValidPassword) {
        throw new ApiError(400, "Invalid credentails")
    }

    const { accessToken, refreshToken } = generateAccessAndRefereshTokens(user)

    await User.findByIdAndUpdate(user?._id, 
        {
            $set: {
                refresh_token: refreshToken
            }
        },
        {
            $new: true
        }
    )

    const loggedInUser = await User.findById(user._id).select(
        "-password -refresh_token"
    )

    const cookieOptions = {
        httpOnly: true, 
        secure: true,
        sameSite: "lax",
    }

    return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, loggedInUser, "User logged in")
    )
})

export const logoutUser = asyncHandler(async(req, res) => {
    const { _id } = await req?.user

    await User.findByIdAndUpdate(_id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            $new: 1
        }
    )

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "lax"
    }

    return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})