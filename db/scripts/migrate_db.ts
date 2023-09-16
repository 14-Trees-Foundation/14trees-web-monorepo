import { MongoClient } from 'mongodb';

async function migrate() {
    const uri = 'mongodb://14trees-local:14trees123@localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db('users');
        const user_trees = db.collection('user_tree_regs');
        const trees = db.collection('trees');

        const userTreeCursor = user_trees.find();
        let count = 0;

        for await (const userTree of userTreeCursor) {
            const tree = await trees.findOne({ _id: userTree.tree });

            if (!tree) {
                throw new Error(`Tree with id ${userTree.tree} does not exist.`);
            } else if (tree.assignment) {
                throw new Error(`Tree with id ${tree._id} already has an assignment.`);
            } else {
                console.info("Inlining user_tree_reg", userTree._id, "into tree", tree._id)
                const treeUpdateId = tree._id;
                const userTreeCopy: any = { ...userTree };
                delete userTreeCopy._id;
                delete userTreeCopy.__v;
                delete userTreeCopy.tree;

                try {
                    await trees.updateOne({ _id: treeUpdateId }, { $set: { assignment: userTree } });
                    // delete the 
                } catch (error) {
                    console.error(`Error inlining user_tree_reg ${userTree._id} into tree ${tree._id}:`, error);
                }
                count += 1;
            }
        }

        console.log(`Inlined ${count} user_tree_regs into trees.assignment`);
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await client.close();
    }
}

migrate().catch(error => console.error(error));