const User = require("../../models/user");

export const getUserDocumentFromRequestBody = (reqBody:any) => {
    // @ts-ignore: Object is possibly 'null'.
    let userId = this.getUserId(reqBody.name, reqBody.email)

    return new User({
        name: reqBody.name,
        phone: reqBody.contact !== "undefined" ? reqBody.contact : reqBody.phone !== "undefined" ? reqBody.phone : 0,
        email: reqBody.email,
        userid: userId,
        dob: reqBody.dob,
        date_added: new Date()
    });
}

export const getUserId = (name:string, email:any) => {
    let userid = name.toLowerCase() + email.toLowerCase();
    userid = userid.replace(/[^A-Z0-9@.]+/ig, "");

    return userid;
}