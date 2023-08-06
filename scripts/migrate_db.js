// Connect to your MongoDB instance
db = connect('mongodb://localhost/trees');

// Get the collections
var user_trees = db.user_tree_regs;
var trees = db.trees;

// For each user_tree
let count = 0;
user_trees.find().forEach(function(userTree) {
    // Find the corresponding tree
    var tree = trees.findOne({_id: userTree.tree});

    // Check if the tree exists
    if (!tree) {
        throw new Error("Tree with id " + userTree.tree + " does not exist.");
    }
    // Check if the tree already has an assignment
    else if (tree.assignment) {
        // If the tree already has an assignment, throw an error
        throw new Error("Tree with id " + tree._id + " already has an assignment.");
    } else {
        // If the tree doesn't have an assignment, update it with the user_tree embedded in the assignment field
        // remove the fields _id, __v, and tree from the user_tree
        const treeUpdateId = tree._id;
        delete userTree._id;
        delete userTree.__v;
        delete userTree.tree;
        trees.updateOne({_id: treeUpdateId}, {$set: {assignment: userTree}});
        count += 1;
    }
});

print("Inlined " + count + "user_tree_regs in to trees.assignment");