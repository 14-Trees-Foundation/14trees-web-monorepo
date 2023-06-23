const User = require("../../models/user");

module.exports.addUser = async (req, res) => {
    let userid = req.body.name.toLowerCase() + req.body.email.toLowerCase();
    userid = userid.replace(/[^A-Z0-9@.]+/ig, "");

    const user = new User({
        name: req.body.name,
        phone: req.body.contact !== "undefined" ? req.body.contact : 0,
        email: req.body.email,
        userid: userid,
        dob: req.body.dob,
        date_added: new Date()
    });

    try {
        let result = await user.save();
        return result;
    } catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            let user = await User.findOne({ userid: userid })
            return user
        }
    }
}