const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../../auth/sheet-node-test.json');

module.exports.UpdateTreeTypeCsv = async (data) => {

    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['treetype']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    try {
        await sheet.addRow({
            name: data.name,
            tree_id: data.tree_id,
            desc: data.desc,
            scientific_name: data.scientific_name,
            family: data.family,
            habit: data.habit,
            remarkable_char: data.remarkable_char,
            med_use: data.med_use,
            other_use: data.other_use,
            food: data.food,
            eco_value: data.eco_value,
            parts_used: data.parts_used,
            image: data.image.toString(),
        });
    } catch (error) {
        return error
    }
}

module.exports.UpdateTreeCsv = async (data, tree_id, tree_name, loc, plot_id, plot_name, user, sheet_name = 'tree') => {

    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheet_name]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    try {
        let res = await sheet.addRow({
            sapling_id: data.sapling_id,
            tree_id: tree_id,
            tree_name: tree_name,
            plot_id: plot_id,
            plot_name: plot_name,
            image: data.image.toString(),
            location: loc.toString(),
            date_added: data.date_added,
            added_by: user === null ? null : user.name,
        });
    } catch (error) {
        console.log(error)
        return error
    }
}

module.exports.UpdateDuplicateTreeCsv = async (data, tree_id, tree_name, plot_id, plot_name, user) => {
    return await this.UpdateTreeCsv(data, tree_id, tree_name, "", plot_id, plot_name, user, 'duplicate_tree')
}

module.exports.UpdateUserTreeCsv = async (user_data, reg_info, tree_id, profile_image, memory_images, org, donor) => {

    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['user_tree_reg']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    let userid = user_data.name.toLowerCase() + user_data.email;
    userid = userid.replace(/[^A-Z0-9@.]+/ig, "");

    try {
        await sheet.addRow({
            name: user_data.name,
            phone: user_data.contact,
            email: user_data.email,
            dob: user_data.dob,
            user_id: userid,
            tree_name: reg_info.tree_id.name,
            sci_name: reg_info.tree_id.scientific_name,
            plot: reg_info.plot_id.plot_id,
            tree_id: tree_id,
            org: org[0].name,
            profile_image: profile_image.toString(),
            memories: memory_images.toString(),
            date_added: user_data.date_added,
            donated_by: donor
        });
    } catch (error) {
        return error
    }
}

module.exports.UpdatePlotCsv = async (data) => {

    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['plot']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    try {
        await sheet.addRow({
            plot_name: data.name,
            short_name: data.plot_id,
            boundaries: data.boundaries.coordinates.toString(),
            center: data.center ? data.center.coordinates.toString() : "",
        });
    } catch (error) {
        return error
    }
}

module.exports.UpdateOrg = async (data) => {

    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['org']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    try {
        await sheet.addRow({
            name: data.name,
            date_added: data.date_added,
            desc: data.desc,
            type: data.type,
        });
    } catch (error) {
        return error
    }
}

module.exports.UpdateActivityCsv = async (data) => {

    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['activity']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    try {
        let res = await sheet.addRow({
            title: data.title,
            type: data.type,
            date: data.date,
            desc: data.desc,
            author: data.author,
            image: data.images.toString(),
            video: data.video
        });
    } catch (error) {
        return error
    }
}

module.exports.UpdateEventCsv = async (data) => {

    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['events']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    try {
        let res = await sheet.addRow({
            name: data.name,
            email: data.email,
            date_added: data.date_added,
            plot_id: data.plot_id,
            num_plant: data.num_plant,
            gifted_by: data.gifted_by,
            type: data.type,
            link: data.link
        });
    } catch (error) {
        return error
    }
}

module.exports.UpdateMyTreesCsv = async (data) => {
    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['mytrees'];

    try {
        await sheet.addRows(data);
    } catch (error) {
        return error
    }
}

module.exports.UpdateMyTreeAssignmentCsv = async (sapling_id) => {
    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['mytrees'];
    const rows = await sheet.getRows();
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].sapling_id === sapling_id) {
            rows[i].assigned = true;
            await rows[i].save();
            break;
        }
    }
}

module.exports.updateStaffCsv = async (data) => {
    const doc = new GoogleSpreadsheet('1rbTnfv6eeu37TOUXkuTtWVCuqQk-x7rXiOBCah19kQw');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['staff']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
    try {
        let res = await sheet.addRow({
            name: data.name,
            user_id: data.user_id,
            date_added: data.date_added,
        });
    } catch (error) {
        return error
    }
}