// import { errorMessage, successMessage, status } from "../helpers/status";
// import * as Jimp from 'jimp'; // Import all members from Jimp
// import * as path from 'path'; // Import all members from path

// export const getTemplate = async (req: any, res: any): Promise<void> => {


//     try {
//         const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
//         const font2 = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);

//         let tree_name = req.body.tree_name.replace(/[^\x00-\x7F]/g, "");
//         tree_name = tree_name.replace(/[^a-zA-Z ]/g, "")

//         if (req.body.type === 'bd') {
//             const image = await Jimp.read(path.join(__dirname, 'templateimages/bd.png'));
//             image.print(font, 190, 490, req.body.name)
//             image.print(font2, 520, 1400, tree_name)
//             image.print(font2, 480, 1490, req.body.sapling_id)
//             image.print(font2, 480, 1570, "dashboard.14trees.org/profile/" + req.body.sapling_id)
//             await image.writeAsync(path.join(__dirname, 'templateimages/test.png'));
//             res.set({ 'Content-Type': 'image/png' });
//             res.sendFile(path.join(__dirname, 'templateimages/test.png'))
//         } else if (req.body.type === 'hny') {
//             const image = await Jimp.read(path.join(__dirname, 'templateimages/hny.png'));
//             image.print(font, 190, 490, req.body.name)
//             image.print(font2, 520, 1410, tree_name)
//             image.print(font2, 480, 1500, req.body.sapling_id)
//             image.print(font2, 480, 1580, "dashboard.14trees.org/profile/" + req.body.sapling_id)
//             await image.writeAsync(path.join(__dirname, 'templateimages/test.png'));
//             res.set({ 'Content-Type': 'image/png' });
//             res.sendFile(path.join(__dirname, 'templateimages/test.png'))
//         }
//     } catch (error: any) {
//         console.log(error)
//         res.status(status.error).send();
//     }
// }