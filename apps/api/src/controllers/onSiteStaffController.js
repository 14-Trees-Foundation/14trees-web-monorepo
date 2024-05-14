const { status } = require("../helpers/status");
const onSiteStaff = require("../models/onsitestaff")
const { getOffsetAndLimitFromRequest } = require("./helper/request");
const { getUserId } = require("./helper/users");

/*
    Model - onSiteStaff
    CRUD Operations for onsitestaff collection
*/

module.exports.getOnsiteStaffs = async (req, res) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    let filters = {}
    if (req.query?.name) {
        filters["name"] = new RegExp(req.query?.name, "i")
    }
    if (req.query?.phone) {
        filters["phone"] = req.query?.phone
    }
    if (req.query?.email) {
        filters["email"] = req.query?.email
    }
    if (req.query?.role) {
        filters["role"] = { $in: req.query?.role.split(",")}
    }
    try {
        const result = await onSiteStaff.find(filters).skip(offset).limit(limit).exec();
        res.status(status.success).send(result);
    } catch {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


module.exports.addOnsiteStaff = async (req, res) => {
    try {
        if (!req.body.name) {
            throw new Error("Staff name is required");
        }

        const staff = new onSiteStaff({
            name: req.body.name,
            email: req.body.email,
            user_id: getUserId(req.body.name, req.body.email),
            phone: req.body.phone,
            permissions: req.body.permissions,
            role: req.body.role,
            dob: req.body.dob,
            date_added: req.body.date_added,
        })

        const result = await staff.save();
        res.status(status.success).send(result);
    } catch {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


module.exports.updateOnsiteStaff = async (req, res) => {
    try {
        let staff = await onSiteStaff.findById(req.params.id);
        if (!staff) {
            res.status(status.notfound).json({
                status: status.notfound,
                message: "On site staff not found for given id",
            });
        }

        if (req.body.name) staff.name = req.body.name;
        if (req.body.email) staff.email = req.body.email;
        if (req.body.phone) staff.phone = req.body.phone;
        if (req.body.dob) staff.dob = req.body.dob;
        if (req.body.role) staff.role = req.body.role;
        if (req.body.permissions) staff.permissions = req.body.permissions;
        staff.user_id = getUserId(staff.name, staff.email);

        const result = await staff.save();
        res.status(status.success).send(result);
    } catch {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


module.exports.deleteOnsiteStaff = async (req, res) => {
    try {
        let response = await onSiteStaff.findByIdAndDelete(req.params.id).exec();
        console.log("Delete onSiteStaff Response for id: %s", req.params.id, response)

        res.status(status.success).send({
            message: "On-Site-Staff deleted successfully",
          })
    } catch (error) {
        res.status(status.bad).send({ error: error.message });
    }
}
