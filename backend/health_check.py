import sys
import os
import shutil

print("=" * 60)
print("PYTHON ENVIRONMENT HEALTH CHECK")
print("=" * 60)
print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print("-" * 60)

modules = ['pytesseract', 'pdf2image', 'thefuzz', 'nltk', 'sklearn', 'flask']
missing = []

for mod in modules:
    try:
        __import__(mod)
        print(f"[✓] {mod:<15} - Installed successfully.")
    except ImportError:
        print(f"[✗] {mod:<15} - NOT INSTALLED.")
        missing.append(mod)

print("-" * 60)
# Tesseract engine verification
tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
tesseract_found = shutil.which("tesseract") or os.path.exists(tesseract_path)

if tesseract_found:
    print("[✓] Tesseract-OCR  - Installed and located.")
else:
    print("[✗] Tesseract-OCR  - NOT FOUND in system PATH or default C:\\Program Files path.")

print("=" * 60)
if missing:
    print("\nACTION REQUIRED: Install missing packages using the correct pip:")
    if os.path.exists(".venv"):
        print(r"  .\.venv\Scripts\pip install " + " ".join(missing))
    else:
        print(f"  \"{sys.executable}\" -m pip install " + " ".join(missing))
else:
    print("\nAll library dependencies are healthy! Ready to run python app.py")
print("=" * 60)
