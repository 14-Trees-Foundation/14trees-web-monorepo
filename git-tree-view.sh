#!/bin/bash

# Function to count lines in a file
count_lines() {
  local file="$1"
  if [ -f "$file" ] && [ -r "$file" ]; then
    wc -l < "$file" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

# Function to get change stats for a file
get_change_stats() {
  local file="$1"
  local status="$2"
  
  case "$status" in
    "M"|"m") 
      # For modified files, count changed lines using git diff
      if git diff --numstat "$file" 2>/dev/null | head -1 | grep -q .; then
        local stats=$(git diff --numstat "$file" 2>/dev/null | head -1)
        local added=$(echo "$stats" | awk '{print $1}')
        local deleted=$(echo "$stats" | awk '{print $2}')
        # If we can't get specific stats, fall back to total lines
        if [[ "$added" == "-" ]] || [[ "$deleted" == "-" ]]; then
          count_lines "$file"
        else
          echo $((added + deleted))
        fi
      else
        count_lines "$file"
      fi
      ;;
    "A"|"a"|"+") 
      # For added files, all lines are "changed"
      count_lines "$file"
      ;;
    "D"|"d") 
      # For deleted files, we can't count current lines
      echo "0"
      ;;
    *) 
      count_lines "$file"
      ;;
  esac
}

# Create a temporary directory
tmp_dir=$(mktemp -d)

echo "Modified files not yet committed:"
echo ""

# Get the list of modified files
git status --porcelain | while read -r line; do
  status="${line:0:2}"
  file="${line:3}"
  
  # Skip empty lines
  [ -z "$file" ] && continue
  
  # Determine status symbol
  case "$status" in
    "M ") symbol="M" ;; # Modified
    "A ") symbol="A" ;; # Added
    "D ") symbol="D" ;; # Deleted
    "R ") symbol="R" ;; # Renamed
    "C ") symbol="C" ;; # Copied
    "??") symbol="+" ;; # Untracked
    *) symbol="${status// /}" ;;
  esac
  
  # Fix the path if it starts with 'ackend' or 'rontend'
  if [[ "$file" == ackend/* ]]; then
    file="b$file"
  elif [[ "$file" == rontend/* ]]; then
    file="f$file"
  fi
  
  # Handle directories and files
  if [ -d "$file" ]; then
    # It's a directory - create it in the temp structure
    mkdir -p "$tmp_dir/$file"
    # Add a marker file to indicate it's a directory with status
    touch "$tmp_dir/$file/.directory-$symbol"
  else
    # It's a file - create the parent directory structure
    mkdir -p "$tmp_dir/$(dirname "$file")"
    # Get change stats and total lines for the file
    change_lines=$(get_change_stats "$file" "$symbol")
    total_lines=$(count_lines "$file")
    # Create a file with status, change count, and total lines in the name
    touch "$tmp_dir/$file [$symbol:${change_lines}L_T:${total_lines}L]"
  fi
done

# Now let's also add all files from git ls-files --modified --others --exclude-standard
# This ensures we catch all modified and untracked files, even in nested directories
git ls-files --modified --others --exclude-standard | while read -r file; do
  # Skip if we already processed this file (check for any status with line count pattern)
  if ! find "$tmp_dir" -name "$(basename "$file") [*" 2>/dev/null | grep -q .; then
    # Fix the path if needed
    if [[ "$file" == ackend/* ]]; then
      fixed_file="b$file"
    elif [[ "$file" == rontend/* ]]; then
      fixed_file="f$file"
    else
      fixed_file="$file"
    fi
    
    # Determine status
    if git ls-files --modified | grep -q "^$file$"; then
      status="M"
    else
      status="+"
    fi
    
    # Create the directory structure
    mkdir -p "$tmp_dir/$(dirname "$fixed_file")"
    # Get change stats and total lines for the file
    change_lines=$(get_change_stats "$file" "$status")
    total_lines=$(count_lines "$file")
    # Create the file with status, change count, and total lines
    touch "$tmp_dir/$fixed_file [$status:${change_lines}L_T:${total_lines}L]"
  fi
done

# Special handling for directories that contain files
# Find all directories with untracked files
git ls-files --others --exclude-standard --directory | grep '/$' | while read -r dir; do
  # Fix the path if needed
  if [[ "$dir" == ackend/* ]]; then
    fixed_dir="b$dir"
  elif [[ "$dir" == rontend/* ]]; then
    fixed_dir="f$dir"
  else
    fixed_dir="$dir"
  fi
  
  # Find all files in this directory
  find "$dir" -type f | while read -r file; do
    rel_file="${file#$dir}"
    # Create the directory structure
    mkdir -p "$tmp_dir/$fixed_dir"
    # Get change stats and total lines for the file (for untracked files, change = total)
    total_lines=$(count_lines "$file")
    # Create the file with + status, change count, and total lines
    touch "$tmp_dir/$fixed_dir$rel_file [+:${total_lines}L_T:${total_lines}L]"
  done
done

# Use tree command to display the structure
echo "."
tree -C --noreport "$tmp_dir" | grep -v "\.directory-" | tail -n +2 | sed "s|$tmp_dir/||" | sed 's/_T:/ T:/g'

# Count total files and lines
total_files=$(find "$tmp_dir" -type f | grep -v "\.directory-" | wc -l)
total_change_lines=0
total_code_lines=0

# Extract line counts from filenames and sum them up
while IFS= read -r temp_file; do
  filename=$(basename "$temp_file")
  # Extract change lines and total lines from filename pattern [status:changeL_T:totalL]
  if [[ "$filename" =~ \[.*:[[:space:]]*([0-9]+)L_T:[[:space:]]*([0-9]+)L\] ]]; then
    total_change_lines=$((total_change_lines + ${BASH_REMATCH[1]}))
    total_code_lines=$((total_code_lines + ${BASH_REMATCH[2]}))
  fi
done < <(find "$tmp_dir" -type f | grep -v "\.directory-")

# Debug: show a few example filenames
# echo "Debug - Example temp files:"
# find "$tmp_dir" -type f | grep -v "\.directory-" | head -3

echo ""
echo "Total: $total_files files, $total_change_lines changed lines, $total_code_lines total lines of code"

# Clean up
rm -rf "$tmp_dir"

# Legend
echo ""
echo "Legend:"
echo "  [M:nL T:mL] Modified (n changed lines / m total lines)"
echo "  [+:nL T:mL] New/Untracked (n changed lines / m total lines)"
echo "  [D:nL T:mL] Deleted (n changed lines / m total lines)"
echo "  [A:nL T:mL] Added (n changed lines / m total lines)"
echo "  [R:nL T:mL] Renamed (n changed lines / m total lines)"
echo "  [C:nL T:mL] Copied (n changed lines / m total lines)"