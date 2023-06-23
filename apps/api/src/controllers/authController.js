const { errorMessage, successMessage, status } = require("../helpers/status");
const { OAuth2Client } = require('google-auth-library');
var jwt = require('jsonwebtoken');
const client = new OAuth2Client(process.env.CLIENT_ID)
const StaffModel = require("../models/onsitestaff");
require('dotenv').config()

module.exports.signin = async (req, res) => {
    const { token } = req.body

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID
        });

        const { name, email, picture } = ticket.getPayload();
        const user = await StaffModel.findOne(
            { email: email },
        )

        if (user === null) {
            res.status(status.notfound).send()
        } 
        
        let jwtToken = jwt.sign({ id: email }, process.env.SECRET_KEY, {
            expiresIn: 3660 // expires in 61 mins
        });
        res.status(201).json({
            user: user,
            token: jwtToken
        })
    } catch (error) {
        console.log(error)
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}