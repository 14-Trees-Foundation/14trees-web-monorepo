const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../../auth/sheet-node-test.json');
import moment from "moment";

export const UpdateTreeTypeCsv = async (data:any) => {

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

export const UpdateTreeCsv = async (data:any, tree_id:any, tree_name:string, loc:string, plot_id:any, plot_name:string, user:any, sheet_name: string = 'tree') => {

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

export const UpdateDuplicateTreeCsv = async (data:any, tree_id:any, tree_name:string, plot_id:any, plot_name:string, user:any) => {
    // @ts-ignore: Object is possibly 'null'.
    return await this.UpdateTreeCsv(data, tree_id, tree_name, "", plot_id, plot_name, user, 'duplicate_tree')
}

export const UpdateUserTreeCsv = async (user_data:any, reg_info:any, tree_id:any, profile_image:any, memory_images:any, org:any, donor:any) => {

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

export const UpdatePlotCsv = async (data:any) => {

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

export const UpdateOrg = async (data:any ) => {

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

export const UpdateActivityCsv = async (data:any) => {

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

export const UpdateEventCsv = async (data: any) => {

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

export const UpdateMyTreesCsv = async (data: any) => {
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

export const UpdateMyTreeAssignmentCsv = async (sapling_id: string) => {
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

export const updateStaffCsv = async (data: any) => {
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

export const createWorkOrderInCSV = async (data: any) => {
    const doc = new GoogleSpreadsheet('1p42VeMOnomXHD86gmkYRSN5Wifr9ojqjY9qmmU75F5I');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    
    console.log(doc)
    const sheet = doc.sheetsByTitle['Form Responses 1'];
    try {
        await sheet.addRow({
            'Timestamp': moment(new Date()).format('M/D/YYYY HH:mm:ss'),
            'Request date': moment(new Date()).format('M/D/YYYY'),
            'Work order for': '[Onsite] - Trees to be planted (झाड लावणे आहेत)',
            'Tree/Grove type (झाड/वन प्रकार)': data.associated_tag,
            'Number of trees (किती झाडे?)': data.pledged - data.assigned_trees,
            'Form filled by (फॉर्म भरणारा)': 'Vivek Jain',
        });

        return true;
    } catch (error: any) {
        console.log("[ERROR]", "createWorkOrder", error.message)
        return false;
    }
}