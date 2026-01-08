import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import qrCode from "qrcode";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

//register
export const register = async (req,res) => {
    try {
        const { username,password } = req.body;
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({
            username,
            password: hashedPassword,
            isMfaActive: false,
        });
       console.log("New User:", {
  id: newUser._id.toString(),
  username: newUser.username,
  isMfaActive: newUser.isMfaActive,
});


        await newUser.save();
        res.status(201).json({message: "User registered successfully"});
    } catch (error) {
       res.status(500).json({
  error: "Error registering user",
  message: error.message,
});

    }
};


//login
export const login = async (req,res) => {
    console.log("The authenticated user is : ", req.user);
    res.status(200).json({
        message: "User loggedin successfully",
        username: req.user.username,
        isMfaActive: req.user.isMfaActive,
    });
};

//status
export const authStatus = async (req,res) => {
    if(req.user) {
        res.status(200).json({
            message:"User logged in successfully",
            username:req.user.username,
            isMfaActive: req.user.isMfaActive,
        });
    }else{
        res.status(401).json({
            message:"Unauthorized user"
        });
    }
};

//logout
export const logout = async (req,res) => {
    if(!req.user) return res.status(401).json({message:"Unauthorized user"});
   req.logout((err) => {
    if(err) {
        return next(err);
    }
    req.session.destroy((err) => {
        if(err) {
            return next(err);
        }
        //clear cookie
        res.clearCookie("connect.sid");
        res.status(200).json({message:"Loggedout successfully"})
    });
   });
};

//set 2fa
export const setup2FA = async (req,res) => {
    try {
        console.log("The req.user is : ", req.user);
        const user = req.user;
        var secret = speakeasy.generateSecret();
        console.log("The secret object is : ", secret);
        user.twoFactorSecret = secret.base32;
        user.isMfaActive = true;
        await user.save();
        const url = speakeasy.otpauthURL({
            secret: secret.base32,
            label: `${req.user.username}`,
            issuer: "www.savanthakrar.com",
            encoding:"base32",
        });
       const qrImageUrl = await qrCode.toDataURL(url);
       res.status(200).json({
        secret: secret.base32,
        qrCode: qrImageUrl,
       });
    } catch (error) {
        res.status(500).json({error:"Error settingup 2fa", message:error})
    }    
};

//verify 2fa
export const verify2FA = async (req,res) => {
    const {token} = req.body;
    const user = req.user;

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
    });

    if(verified) {
        const jwtToken = jwt.sign({username: user.username}, 
            process.env.JWT_SECRET,
            {expiresIn: "1hr"}  
        );
        res.status(200).json({message: "2FA successful", token: jwtToken})
    }else{
        res.status(400).json({message:"Invalid 2FA token"})
    }
};


// reset 2fa
export const reset2FA = async (req,res) => {
    try {
        const user = req.user;
        user.twoFactorSecret= "";
        user.isMfaActive = false;
        await user.save();
        res.status(200).json({message: "2FA reset successful"}) 
    } catch (error) {
        res.status(500).json({error: "Error reseting 2FA", message: error})
    }
};