#!/usr/bin/env python3
"""
Chemical structure OCR sidecar.

Usage:
  python ocr.py <image-path>       # extract MOL from image
  python ocr.py --diagnose         # report which backends are available

Output:
  Success: MOL V2000 text on stdout, exit 0.
  Failure: JSON {"error": "...", "hint": "...", "details": {...}} on stdout, exit 1.

Tries these backends in order:
  1. DECIMER (deep learning, ~250 MB model on first import)
  2. OSRA (classical CV, system binary)
  3. MolScribe (deep learning, requires checkpoint setup)

DECIMER returns SMILES — converted to MOL via RDKit (Compute2DCoords). If RDKit
is missing, we still attempt to output a minimal MOL stub so the frontend has
something to render, but coordinates won't be optimal.

INSTALL ON WINDOWS:
  Python 3.10 or 3.11 (NOT 3.12+, TensorFlow drops support there).
    py -3.10 -m pip install --upgrade pip
    py -3.10 -m pip install decimer rdkit
  On first run, DECIMER downloads ~250 MB to ~/.data/DECIMER-V2/.
"""
import sys
import json
import os
import shutil
import platform
import importlib

def emit_error(msg, hint=None, details=None):
    payload = {"error": msg}
    if hint:    payload["hint"] = hint
    if details: payload["details"] = details
    sys.stdout.write(json.dumps(payload))
    sys.exit(1)

# Track import-attempt details for /diagnose and richer error reporting
_probe = {}

def safe_import(modname):
    try:
        m = importlib.import_module(modname)
        ver = getattr(m, "__version__", "?")
        _probe[modname] = {"ok": True, "version": ver}
        return m
    except ImportError as e:
        _probe[modname] = {"ok": False, "error": str(e)}
        return None
    except Exception as e:
        # Catch e.g. DLL load errors on Windows for native modules (tensorflow)
        _probe[modname] = {"ok": False, "error": f"{type(e).__name__}: {e}"}
        return None

def try_decimer(img_path):
    dec_pkg = safe_import("DECIMER")
    if dec_pkg is None: return None
    try:
        smi = dec_pkg.predict_SMILES(img_path)
    except Exception as e:
        _probe["DECIMER.predict_SMILES"] = {"ok": False, "error": str(e)}
        return None
    return smi_to_mol(smi) or smi_stub(smi)

def try_osra(img_path):
    if not shutil.which("osra"):
        _probe["osra-binary"] = {"ok": False, "error": "not in PATH"}
        return None
    _probe["osra-binary"] = {"ok": True}
    try:
        import subprocess
        out = subprocess.check_output(["osra", "-f", "mol", img_path],
                                       stderr=subprocess.DEVNULL).decode("utf-8", "replace")
        return out if "M  END" in out else None
    except Exception as e:
        _probe["osra-run"] = {"ok": False, "error": str(e)}
        return None

def try_molscribe(img_path):
    ms = safe_import("molscribe")
    if ms is None: return None
    # MolScribe needs a checkpoint set up — out of scope for the stub
    _probe["molscribe-wrapper"] = {"ok": False, "error": "checkpoint setup not implemented"}
    return None

def smi_to_mol(smi):
    """Convert SMILES → MOL with RDKit-computed 2D coords."""
    Chem = safe_import("rdkit.Chem")
    if Chem is None: return None
    try:
        from rdkit import Chem as _Chem
        from rdkit.Chem import AllChem
    except Exception as e:
        _probe["rdkit.AllChem"] = {"ok": False, "error": str(e)}
        return None
    try:
        m = _Chem.MolFromSmiles(smi)
        if m is None: return None
        AllChem.Compute2DCoords(m)
        return _Chem.MolToMolBlock(m)
    except Exception as e:
        _probe["rdkit-convert"] = {"ok": False, "error": str(e)}
        return None

def smi_stub(smi):
    """Last-resort: emit the SMILES wrapped as a tiny MOL header so the
       caller can still detect 'something was returned' even without RDKit.
       The frontend can fall back to parsing the SMILES directly."""
    if not smi: return None
    # Sentinel — caller treats this as "use SMILES instead"
    return "SMILES:" + smi

def diagnose():
    safe_import("DECIMER")
    safe_import("rdkit")
    safe_import("rdkit.Chem")
    safe_import("molscribe")
    safe_import("tensorflow")
    safe_import("PIL")
    osra = shutil.which("osra") is not None
    sys.stdout.write(json.dumps({
        "python_version": platform.python_version(),
        "python_path":    sys.executable,
        "platform":       platform.platform(),
        "modules":        _probe,
        "osra_binary":    osra,
        "primary_backend_ready": _probe.get("DECIMER", {}).get("ok") and _probe.get("rdkit", {}).get("ok"),
    }, indent=2))
    sys.exit(0)

def main():
    if len(sys.argv) >= 2 and sys.argv[1] == "--diagnose":
        diagnose()
        return

    if len(sys.argv) < 2:
        emit_error("Usage: ocr.py <image-path>  |  --diagnose")
    img = sys.argv[1]
    if not os.path.exists(img):
        emit_error(f"Datei nicht gefunden: {img}")

    for fn in (try_decimer, try_osra, try_molscribe):
        result = fn(img)
        if result:
            if result.startswith("SMILES:"):
                # No RDKit installed — return SMILES via JSON so the frontend
                # can parse it with OCL instead.
                sys.stdout.write(json.dumps({"smiles": result[7:]}))
                sys.exit(0)
            sys.stdout.write(result)
            sys.exit(0)

    emit_error(
        "Kein OCR-Backend installiert oder kein Backend konnte die Datei verarbeiten.",
        hint=(
            "Installation (Windows, Python 3.10/3.11): "
            "`py -3.10 -m pip install decimer rdkit`. "
            "Diagnose mit: `python tools/ocr.py --diagnose`."
        ),
        details={"probe": _probe}
    )

if __name__ == "__main__":
    main()
