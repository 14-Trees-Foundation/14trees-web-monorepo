#!/bin/bash

# Quick React Component Analyzer - Shell Script Wrapper
# Usage: ./quick-analyze.sh <component-file-path> [depth]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <component-file-path> [depth]"
    echo "Example: $0 apps/frontend/src/pages/admin/gift/GiftTreesRefactored.tsx 2"
    echo ""
    echo "Depth options:"
    echo "  1 - Direct children only (default)"
    echo "  2 - Direct children + their children"
    echo "  3+ - Deeper levels"
    exit 1
fi

COMPONENT_FILE="$1"
DEPTH="${2:-1}"  # Default depth is 1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if the component file exists
if [ ! -f "$COMPONENT_FILE" ]; then
    echo "Error: Component file not found: $COMPONENT_FILE"
    exit 1
fi

# Check if Python script exists
PYTHON_SCRIPT="$SCRIPT_DIR/quick-component-analyzer.py"
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "Error: Quick analyzer script not found: $PYTHON_SCRIPT"
    exit 1
fi

# Validate depth is a number
if ! [[ "$DEPTH" =~ ^[0-9]+$ ]] || [ "$DEPTH" -lt 1 ]; then
    echo "Error: Depth must be a positive integer (got: $DEPTH)"
    exit 1
fi

# Run the Python analyzer
python3 "$PYTHON_SCRIPT" "$COMPONENT_FILE" --depth "$DEPTH"