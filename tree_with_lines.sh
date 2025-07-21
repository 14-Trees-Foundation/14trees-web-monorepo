#!/bin/bash

# Function to count lines in a file
count_lines() {
    local file="$1"
    if [[ -f "$file" ]]; then
        wc -l < "$file" | tr -d ' '
    else
        echo "0"
    fi
}

# Function to print tree structure with line counts
print_tree() {
    local dir="$1"
    local prefix="$2"
    local is_last="$3"
    
    # Get all items in directory, sorted
    local items=($(ls -1 "$dir" 2>/dev/null | sort))
    local num_items=${#items[@]}
    
    for ((i=0; i<num_items; i++)); do
        local item="${items[i]}"
        local item_path="$dir/$item"
        local is_last_item=$((i == num_items - 1))
        
        # Choose appropriate tree characters
        if [[ $is_last_item == 1 ]]; then
            local tree_char="└── "
            local next_prefix="$prefix    "
        else
            local tree_char="├── "
            local next_prefix="$prefix│   "
        fi
        
        # Print the item
        if [[ -d "$item_path" ]]; then
            echo "${prefix}${tree_char}$item/"
            # Recurse into directory
            print_tree "$item_path" "$next_prefix" $is_last_item
        else
            local line_count=$(count_lines "$item_path")
            echo "${prefix}${tree_char}$item (${line_count} lines)"
        fi
    done
}

# Main execution
TARGET_DIR="/Users/admin/Projects/14trees-web-monorepo/apps/frontend/src/pages/admin/gift"

echo "Tree structure of: $TARGET_DIR"
echo "="
echo "gift/"

# Check if directory exists
if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: Directory $TARGET_DIR does not exist"
    exit 1
fi

# Print the tree
print_tree "$TARGET_DIR" "" 0

# Print summary
echo ""
echo "Summary:"
echo "========"

# Count total files and total lines
total_files=0
total_lines=0

while IFS= read -r -d '' file; do
    if [[ -f "$file" ]]; then
        lines=$(count_lines "$file")
        total_files=$((total_files + 1))
        total_lines=$((total_lines + lines))
    fi
done < <(find "$TARGET_DIR" -type f -print0)

echo "Total files: $total_files"
echo "Total lines: $total_lines"