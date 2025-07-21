#!/usr/bin/env python3

import os
import sys
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import argparse

class QuickComponentAnalyzer:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.component_cache: Dict[str, Dict] = {}
        self.visited: Set[str] = set()
        
    def count_lines(self, filepath: Path) -> int:
        """Count lines in a file safely"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                return sum(1 for _ in f)
        except:
            return 0
    
    def extract_imports(self, filepath: Path) -> List[Tuple[str, str]]:
        """Extract local component imports from a file"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except:
            return []
        
        imports = []
        
        # Pattern for import statements with local paths (starting with . or /)
        import_patterns = [
            r'import\s+(\w+)\s+from\s+["\'](\./[^"\']+)["\']',  # default import
            r'import\s+\{\s*([^}]+)\s*\}\s+from\s+["\'](\./[^"\']+)["\']',  # named imports
            r'import\s+(\w+)\s+from\s+["\'](\.\./[^"\']+)["\']',  # default import parent
            r'import\s+\{\s*([^}]+)\s*\}\s+from\s+["\'](\.\./[^"\']+)["\']',  # named imports parent
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            for match in matches:
                component_names = match[0]
                import_path = match[1]
                
                # Handle named imports (multiple components)
                if '{' in component_names or ',' in component_names:
                    # Clean up named imports
                    names = re.findall(r'\w+', component_names)
                    for name in names:
                        imports.append((name.strip(), import_path))
                else:
                    imports.append((component_names.strip(), import_path))
        
        return imports
    
    def resolve_import_path(self, current_file: Path, import_path: str) -> Optional[Path]:
        """Resolve relative import path to absolute file path"""
        current_dir = current_file.parent
        
        # Handle relative imports
        if import_path.startswith('./') or import_path.startswith('../'):
            resolved_path = (current_dir / import_path).resolve()
        else:
            return None
        
        # Try different extensions
        extensions = ['.tsx', '.jsx', '.ts', '.js', '/index.tsx', '/index.jsx', '/index.ts', '/index.js']
        
        for ext in extensions:
            candidate = Path(str(resolved_path) + ext)
            if candidate.exists() and candidate.is_file():
                return candidate
        
        return None
    
    def analyze_component(self, filepath: Path, max_depth: int = 1, current_depth: int = 0) -> Dict:
        """Analyze a component and its dependencies up to max_depth"""
        if current_depth >= max_depth:
            return {"truncated": True, "reason": "Max depth reached"}
        
        filepath_str = str(filepath)
        if filepath_str in self.visited:
            return {"error": "Circular dependency"}
        
        if filepath_str in self.component_cache:
            return self.component_cache[filepath_str]
        
        self.visited.add(filepath_str)
        
        if not filepath.exists():
            return {"error": "File not found"}
        
        line_count = self.count_lines(filepath)
        imports = self.extract_imports(filepath)
        
        # Handle relative path calculation more safely
        try:
            relative_path = filepath.relative_to(self.base_path)
        except ValueError:
            # If filepath is not under base_path, use absolute path
            relative_path = filepath
        
        component_info = {
            "path": filepath,
            "relative_path": relative_path,
            "line_count": line_count,
            "dependencies": [],
            "import_count": len(imports),
            "depth": current_depth
        }
        
        # Analyze dependencies if we haven't reached max depth
        if current_depth < max_depth - 1:
            for component_name, import_path in imports:
                resolved_path = self.resolve_import_path(filepath, import_path)
                if resolved_path and resolved_path.exists():
                    dep_info = self.analyze_component(resolved_path, max_depth, current_depth + 1)
                    dep_info["component_name"] = component_name
                    component_info["dependencies"].append(dep_info)
        else:
            # Just get basic info for direct dependencies
            for component_name, import_path in imports:
                resolved_path = self.resolve_import_path(filepath, import_path)
                if resolved_path and resolved_path.exists():
                    dep_lines = self.count_lines(resolved_path)
                    try:
                        dep_relative_path = resolved_path.relative_to(self.base_path)
                    except ValueError:
                        dep_relative_path = resolved_path
                    
                    dep_info = {
                        "component_name": component_name,
                        "path": resolved_path,
                        "relative_path": dep_relative_path,
                        "line_count": dep_lines,
                        "dependencies": [],
                        "truncated": True,
                        "reason": "Max depth reached"
                    }
                    component_info["dependencies"].append(dep_info)
        
        self.component_cache[filepath_str] = component_info
        self.visited.remove(filepath_str)
        
        return component_info
    
    def print_tree(self, component_info: Dict, prefix: str = "", is_last: bool = True, show_truncated: bool = True):
        """Print component tree structure"""
        if "error" in component_info:
            return
        
        # Get file info
        relative_path = component_info["relative_path"]
        line_count = component_info["line_count"]
        
        # Handle both Path objects and strings
        if isinstance(relative_path, Path):
            filename = relative_path.name
            extension = relative_path.suffix
            display_path = str(relative_path)
        else:
            filename = Path(str(relative_path)).name
            extension = Path(str(relative_path)).suffix
            display_path = str(relative_path)
        
        # Choose appropriate icon based on file extension
        icons = {
            '.tsx': '⚛️ ',
            '.jsx': '⚛️ ',
            '.ts': '📘',
            '.js': '📙'
        }
        icon = icons.get(extension, '📄')
        
        # Format line count with warning for large files
        if line_count > 300:
            line_display = f"[{line_count:4d} lines] ⚠️"
        elif line_count > 150:
            line_display = f"[{line_count:4d} lines] ⚡"
        else:
            line_display = f"[{line_count:4d} lines]"
        
        # Print current component
        connector = "└── " if is_last else "├── "
        
        # Use full relative path instead of just component name
        component_display = display_path
        
        # Add truncation indicator
        truncated_indicator = ""
        if component_info.get("truncated") and show_truncated:
            truncated_indicator = " 📁"
        
        print(f"{prefix}{connector}{icon} {component_display} {line_display}{truncated_indicator}")
        
        # Print dependencies
        dependencies = component_info.get("dependencies", [])
        if dependencies:
            new_prefix = prefix + ("    " if is_last else "│   ")
            for i, dep in enumerate(dependencies):
                is_last_dep = (i == len(dependencies) - 1)
                self.print_tree(dep, new_prefix, is_last_dep, show_truncated)
    
    def calculate_stats(self, component_info: Dict) -> Dict:
        """Calculate statistics for the component tree"""
        if "error" in component_info:
            return {"error": component_info["error"]}
        
        stats = {
            "root_lines": component_info["line_count"],
            "direct_dependencies": len(component_info.get("dependencies", [])),
            "total_files": 1,
            "total_lines": component_info["line_count"],
            "large_files": [],
            "medium_files": []
        }
        
        # Count dependencies recursively
        def count_recursive(comp_info, visited_paths=None):
            if visited_paths is None:
                visited_paths = set()
            
            if "error" in comp_info or comp_info.get("truncated"):
                return
            
            path_str = str(comp_info["path"])
            if path_str in visited_paths:
                return
            visited_paths.add(path_str)
            
            lines = comp_info["line_count"]
            if lines > 300:
                stats["large_files"].append((comp_info["relative_path"], lines))
            elif lines > 150:
                stats["medium_files"].append((comp_info["relative_path"], lines))
            
            for dep in comp_info.get("dependencies", []):
                if not dep.get("truncated"):
                    stats["total_files"] += 1
                    stats["total_lines"] += dep["line_count"]
                    count_recursive(dep, visited_paths)
                else:
                    # For truncated dependencies, just add their direct info
                    stats["total_files"] += 1
                    stats["total_lines"] += dep["line_count"]
                    lines = dep["line_count"]
                    if lines > 300:
                        stats["large_files"].append((dep["relative_path"], lines))
                    elif lines > 150:
                        stats["medium_files"].append((dep["relative_path"], lines))
        
        count_recursive(component_info)
        
        # Sort files by line count
        stats["large_files"].sort(key=lambda x: x[1], reverse=True)
        stats["medium_files"].sort(key=lambda x: x[1], reverse=True)
        
        return stats
    
    def print_statistics(self, component_info: Dict, max_depth: int):
        """Print summary statistics"""
        stats = self.calculate_stats(component_info)
        
        if "error" in stats:
            print(f"Error calculating statistics: {stats['error']}")
            return
        
        print("\n" + "="*60)
        print("COMPONENT ANALYSIS SUMMARY")
        print("="*60)
        print(f"Root Component: {component_info['relative_path']}")
        print(f"Analysis Depth: {max_depth} level{'s' if max_depth != 1 else ''}")
        print(f"Root Component Lines: {stats['root_lines']}")
        print(f"Direct Dependencies: {stats['direct_dependencies']}")
        print(f"Total Files Analyzed: {stats['total_files']}")
        print(f"Total Lines: {stats['total_lines']}")
        
        # Show large files
        if stats["large_files"]:
            print(f"\nLarge Files (>300 lines):")
            for i, (path, lines) in enumerate(stats["large_files"][:10], 1):
                print(f"  {i:2d}. {path} [{lines} lines] ⚠️")
        
        # Show medium files
        if stats["medium_files"]:
            print(f"\nMedium Files (150-300 lines):")
            for i, (path, lines) in enumerate(stats["medium_files"][:10], 1):
                print(f"  {i:2d}. {path} [{lines} lines] ⚡")
        
        if max_depth == 1:
            print(f"\n💡 Use --depth 2 or higher to see deeper dependencies")
        
        print("="*60)

def main():
    parser = argparse.ArgumentParser(description='Quick React component tree analyzer with configurable depth')
    parser.add_argument('component_file', help='Path to the React component file to analyze')
    parser.add_argument('--depth', '-d', type=int, default=1, help='Analysis depth (default: 1 - direct children only)')
    parser.add_argument('--base-path', help='Base path for the project (default: auto-detect)')
    parser.add_argument('--hide-truncated', action='store_true', help='Hide truncation indicators')
    
    args = parser.parse_args()
    
    component_file = Path(args.component_file)
    
    if not component_file.exists():
        print(f"Error: Component file not found: {component_file}")
        sys.exit(1)
    
    # Auto-detect base path if not provided
    if args.base_path:
        base_path = Path(args.base_path).resolve()
    else:
        # Try to find the src directory or use the component file's directory
        current = component_file.resolve().parent
        while current.parent != current:
            if current.name == 'src' or current.name == 'frontend':
                base_path = current
                break
            current = current.parent
        else:
            base_path = component_file.resolve().parent
    
    print("="*60)
    print("QUICK REACT COMPONENT TREE ANALYZER")
    print("="*60)
    print(f"Analyzing: {component_file}")
    print(f"Base path: {base_path}")
    print(f"Depth: {args.depth} level{'s' if args.depth != 1 else ''}")
    print()
    print("Legend:")
    print("  ⚛️  React components (.tsx/.jsx)")
    print("  📘 TypeScript files (.ts)")
    print("  📙 JavaScript files (.js)")
    print("  ⚡ Medium files (150-300 lines)")
    print("  ⚠️  Large files (>300 lines)")
    print("  📁 Has more dependencies (use --depth to see more)")
    print()
    
    # Analyze the component
    analyzer = QuickComponentAnalyzer(str(base_path))
    component_info = analyzer.analyze_component(component_file, args.depth)
    
    # Print the tree
    analyzer.print_tree(component_info, show_truncated=not args.hide_truncated)
    
    # Print statistics
    analyzer.print_statistics(component_info, args.depth)

if __name__ == "__main__":
    main()