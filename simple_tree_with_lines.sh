#!/bin/bash

# Script to generate a tree structure with line counts for files
# Usage: ./simple_tree_with_lines.sh [directory_path]
# If no path is provided, uses default: apps/frontend/src/pages/admin/gift

# Default directory if no argument is provided
DEFAULT_DIR="apps/frontend/src/pages/admin/gift"
BASE_DIR="/Users/admin/Projects/14trees-web-monorepo"

# Use the first argument if provided, otherwise use default
if [[ -n "$1" ]]; then
    # If argument starts with /, treat as absolute path, otherwise make it relative to BASE_DIR
    if [[ "$1" == /* ]]; then
        TARGET_DIR="$1"
        DISPLAY_PATH="$1"
    else
        TARGET_DIR="$BASE_DIR/$1"
        DISPLAY_PATH="$1"
    fi
else
    TARGET_DIR="$BASE_DIR/$DEFAULT_DIR"
    DISPLAY_PATH="$DEFAULT_DIR"
fi

# Check if the target directory exists
if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: Directory '$TARGET_DIR' does not exist."
    echo "Usage: $0 [path]"
    echo "  path: Optional directory path (relative to project root or absolute)"
    echo "  Default: $DEFAULT_DIR"
    exit 1
fi

# Function to count lines in a file
count_lines() {
    local file="$1"
    if [[ -f "$file" ]]; then
        wc -l < "$file" | tr -d ' '
    else
        echo "0"
    fi
}

# Function to get file extension
get_extension() {
    local filename="$1"
    echo "${filename##*.}"
}

# Function to check if file should be excluded (binary files, images, etc.)
is_excluded_file() {
    local filename="$1"
    local extension=$(get_extension "$filename" | tr '[:upper:]' '[:lower:]')
    
    # List of extensions to exclude
    case "$extension" in
        png|jpg|jpeg|gif|bmp|ico|svg|webp|tiff|tif)
            return 0  # exclude images
            ;;
        pdf|doc|docx|xls|xlsx|ppt|pptx)
            return 0  # exclude office documents
            ;;
        zip|tar|gz|rar|7z|bz2)
            return 0  # exclude archives
            ;;
        exe|dll|so|dylib|bin)
            return 0  # exclude binaries
            ;;
        mp3|mp4|avi|mov|wmv|flv|wav|ogg)
            return 0  # exclude media files
            ;;
        json|yml|yaml)
            return 0  # exclude configuration/data files
            ;;
        xml|csv)
            return 0  # exclude data files
            ;;
        log|tmp|temp)
            return 0  # exclude temporary/log files
            ;;
        *)
            return 1  # include file
            ;;
    esac
}

# Generate tree structure using find and sort
echo "Tree structure for: $DISPLAY_PATH"
echo "$(printf '=%.0s' $(seq 1 $((${#DISPLAY_PATH} + 20))))"
echo ""

# Process the directory structure
find "$TARGET_DIR" -type f -o -type d | sort | while read -r item; do
    # Calculate relative path from target directory
    relative_path="${item#$TARGET_DIR/}"
    
    # Skip the root directory itself
    if [[ "$item" == "$TARGET_DIR" ]]; then
        echo "$(basename "$TARGET_DIR")/"
        continue
    fi
    
    # Count directory depth for indentation
    depth=$(echo "$relative_path" | tr -cd '/' | wc -c | tr -d ' ')
    indent=""
    for ((i=0; i<depth; i++)); do
        indent="│   $indent"
    done
    
    # Get just the filename/dirname
    basename_item=$(basename "$item")
    
    if [[ -d "$item" ]]; then
        echo "${indent}├── $basename_item/"
    else
        # Skip excluded files
        if is_excluded_file "$basename_item"; then
            continue
        fi
        line_count=$(count_lines "$item")
        echo "${indent}├── $basename_item ($line_count lines)"
    fi
done

echo ""
echo "Summary:"
echo "========"

# Count total files and lines
total_files=0
total_lines=0
ts_files=0
tsx_files=0

find "$TARGET_DIR" -type f | while read -r file; do
    if [[ -f "$file" ]]; then
        # Skip excluded files
        basename_file=$(basename "$file")
        if is_excluded_file "$basename_file"; then
            continue
        fi
        
        lines=$(count_lines "$file")
        ext=$(get_extension "$file")
        
        echo "$file: $lines lines (.$ext)"
        
        # Note: These counters won't work in subshell, but we'll show individual file info
    fi
done | sort

echo ""
echo "File type summary:"
echo "=================="

# Count by file type (excluding binary files)
ts_count=0
tsx_count=0
total_count=0

while IFS= read -r -d '' file; do
    basename_file=$(basename "$file")
    if ! is_excluded_file "$basename_file"; then
        total_count=$((total_count + 1))
        ext=$(get_extension "$file")
        case "$ext" in
            ts) ts_count=$((ts_count + 1)) ;;
            tsx) tsx_count=$((tsx_count + 1)) ;;
        esac
    fi
done < <(find "$TARGET_DIR" -type f -print0)

echo "TypeScript files (.ts): $ts_count"
echo "TypeScript React files (.tsx): $tsx_count"
echo "Total text files: $total_count"

echo ""
echo "Total lines of code:"
echo "==================="

# Calculate total lines excluding binary files
total_lines=0
temp_files=()

while IFS= read -r -d '' file; do
    basename_file=$(basename "$file")
    if ! is_excluded_file "$basename_file"; then
        temp_files+=("$file")
    fi
done < <(find "$TARGET_DIR" -type f -print0)

if [ ${#temp_files[@]} -gt 0 ]; then
    wc -l "${temp_files[@]}" | tail -1
else
    echo "0 total"
fi