"""Règlements AUC par arrondissement → data/reglement/auc-arrondissements.json.

Source : fiches de zone des plans d'aménagement publiés sur auc.ma (PDF scannés,
relevés à la main page par page). Chaque arrondissement est décrit dans
scripts/auc/arrondissements/<nom>.py par une liste de secteurs ; ce script
assemble le tout au format de pau-zones.json.

    python3 scripts/auc/build-reglements.py
"""
import importlib.util, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "scripts/auc/arrondissements"
OUT = ROOT / "data/reglement/auc-arrondissements.json"
sys.path.insert(0, str(ROOT / "scripts/auc"))  # commun.py


def zone(code, famille, nom, description, autorises, interdits, *, h=None, etages=None,
         surface=None, facade=None, cus=None, cos=None, remarque=None, article=None):
    # cos : COS applicable à la parcelle (plancher total / terrain) → cosGlobal.
    # Un COS réservé aux opérations sans lotissement va dans la remarque.
    p = {k: v for k, v in {
        "hauteurMaxM": h, "nombreEtagesMax": etages, "surfaceMinParcelleM2": surface,
        "facadeMinM": facade, "cus": cus, "cosGlobal": cos, "remarque": remarque,
    }.items() if v is not None}
    return code, {"code": code, "famille": famille, "nom": nom, "description": description,
                  "usagesAutorises": autorises, "usagesInterdits": interdits,
                  "parametres": p, "article": article}


out = {}
for f in sorted(SRC.glob("*.py")):
    spec = importlib.util.spec_from_file_location(f.stem, f)
    mod = importlib.util.module_from_spec(spec)
    mod.zone = zone
    spec.loader.exec_module(mod)
    zones = {}
    for code, z in mod.ZONES:
        art = z.pop("article")
        z["parametres"]["source"] = mod.DOCUMENT + (f", {art}" if art else "")
        zones[code] = z
    out[mod.NOM] = {"document": mod.DOCUMENT, "pdf": mod.PDF, "zones": zones, "alias": getattr(mod, "ALIAS", {})}

OUT.write_text(json.dumps({"source": "https://www.auc.ma (plans d'aménagement, fiches de zone)",
                           "arrondissements": out}, ensure_ascii=False, indent=1) + "\n")
print(f"{len(out)} arrondissements, {sum(len(a['zones']) for a in out.values())} secteurs → {OUT.relative_to(ROOT)}")
