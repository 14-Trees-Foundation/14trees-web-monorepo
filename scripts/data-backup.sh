#!/bin/bash

# Directory to backup
dir_to_backup=$1

# Temporary directory for sorting files
temp_dir=$2

# Loop over all files in the directory
for file in "$dir_to_backup"/*; do
    # Get the last modified month and year of the file
    month_year=$(date -r "$file" +"%Y_%m")

    # Create a directory for this month and year if it doesn't exist
    mkdir -p "$temp_dir/$month_year"

    # Move the file to the appropriate directory
    mv "$file" "$temp_dir/$month_year"
done

# Loop over all directories in the temporary directory
for dir in "$temp_dir"/*; do
    # Get the month and year from the directory name
    month_year=$(basename "$dir")

    # Create a tar.gz archive for this month and year
    tar -czf "backup_$month_year.tar.gz" -C "$temp_dir" "$month_year" --remove-files
done

# Remove the temporary directory
rm -r "$temp_dir"