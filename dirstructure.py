python3 - <<'PY'
import os

ROOT = "."
IGNORE = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "dist",
    "build",
    "coverage",
    "__pycache__",
}

def tree(path, prefix=""):
    try:
        entries = [
            e for e in os.listdir(path)
            if e not in IGNORE and not e.startswith(".")
        ]
        entries.sort(key=lambda x: (not os.path.isdir(os.path.join(path, x)), x.lower()))

        for i, name in enumerate(entries):
            full = os.path.join(path, name)
            last = i == len(entries) - 1
            connector = "└── " if last else "├── "
            print(prefix + connector + name)

            if os.path.isdir(full):
                tree(full, prefix + ("    " if last else "│   "))

    except PermissionError:
        pass

print("\n📁 NEXT.JS PROJECT STRUCTURE\n")
print(os.path.basename(os.path.abspath(ROOT)) or ".")
tree(ROOT)
print("\n✅ Done\n")
PY