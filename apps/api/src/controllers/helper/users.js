const User = require("../../models/user");

module.exports.getUserDocumentFromRequestBody = (reqBody) => {
    let userId = this.getUserId(reqBody.name, reqBody.email)

    return new User({
        name: reqBody.name,
        phone: reqBody.contact !== "undefined" ? reqBody.contact : 0,
        email: reqBody.email,
        userid: userId,
        dob: reqBody.dob,
        date_added: new Date()
    });
}

module.exports.getUserId = (name, email) => {
    let userid = name.toLowerCase() + email.toLowerCase();
    userid = userid.replace(/[^A-Z0-9@.]+/ig, "");

    return userid;
}