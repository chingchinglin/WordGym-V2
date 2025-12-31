#!/usr/bin/env python3
"""
Build analyzer for WordGym Students single HTML output
Reports CSS/JS size breakdown and optimization recommendations
"""

import os
import re
from pathlib import Path

def analyze_build():
    dist_file = Path("dist/index.html")

    if not dist_file.exists():
        print("❌ Build not found: dist/index.html")
        print("💡 Run: npm run build")
        return 1

    content = dist_file.read_text()
    total_size = len(content)

    # Extract inline CSS
    css_matches = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL)
    css_size = sum(len(m) for m in css_matches)

    # Extract inline JS
    js_matches = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
    js_size = sum(len(m) for m in js_matches)

    html_size = total_size - css_size - js_size

    # Convert to KB/MB
    def format_size(size):
        if size < 1024:
            return f"{size}B"
        elif size < 1024 * 1024:
            return f"{size/1024:.1f}KB"
        else:
            return f"{size/(1024*1024):.2f}MB"

    print("📊 Build Analysis")
    print(f"Total: {format_size(total_size)}")
    print(f"  HTML: {format_size(html_size)} ({html_size*100//total_size}%)")
    print(f"  CSS:  {format_size(css_size)} ({css_size*100//total_size}%)")
    print(f"  JS:   {format_size(js_size)} ({js_size*100//total_size}%)")

    # Recommendations
    if total_size > 3 * 1024 * 1024:
        print("\n⚠️ Recommendations:")
        if css_size > 500 * 1024:
            print("  - Optimize Tailwind CSS (purge unused)")
        if js_size > 2 * 1024 * 1024:
            print("  - Review dependencies, consider code splitting")

    return 0

if __name__ == "__main__":
    exit(analyze_build())
