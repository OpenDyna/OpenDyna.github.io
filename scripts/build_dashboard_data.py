#!/usr/bin/env python3
"""
Builds dashboard JSON from the single consolidated results file.

Usage from project root:
  python scripts/build_dashboard_data.py

The dashboard treats columns before "Overall Place" as row identity/context
fields. Columns from "Overall Place" onward are considered candidate plotting
parameters; numeric columns are added to the X/Y/size selectors in CSV order.
"""
from pathlib import Path
import json
import re

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data"
OUT.mkdir(exist_ok=True)
SOURCE = OUT / "fsae_results.csv"

IDENTITY_COLUMNS = {
    "Competition": "competition",
    "Year": "year",
    "Class": "vehicle_type",
    "Source File": "source_file",
    "School": "team",
    "Car Number": "car_num",
}

COLUMN_ALIASES = {
    "Overall Place": "overall_place",
    "Total Score Raw": "total_score",
    "Total Penalty": "penalty",
    "Total Score": "total_score_clean",
    "Number of Cylinders": "engine_cylinders",
    "Number of Motors": "num_motors",
    "Engine Displacement (cc)": "engine_displacement_cc",
    "Tractive System Voltage (V)": "tractive_system_voltage_v",
    "Weight (kg)": "weight_reported_kg",
    "Weight (lbs)": "weight_reported_lbs",
    "Design Score": "design_score",
    "Presentation Score": "presentation_score",
    "Cost Score": "cost_score",
    "Acceleration Score": "acceleration_score",
    "Skidpad Score": "skidpad_score",
    "Autocross Score": "autocross_score",
    "Endurance Score": "endurance_score",
    "Efficiency Score": "efficiency_score",
    "Endurance+Efficiency Score": "endurance_efficiency_score",
}

INTEGER_KEYS = {
    "year",
    "car_num",
    "engine_cylinders",
    "num_motors",
}

FIXED_RANGES = {
    "total_score": (-100, 1000),
    "total_score_clean": (-100, 1000),
    "design_score": (0, 150),
    "presentation_score": (0, 75),
    "cost_score": (0, 100),
    "acceleration_score": (0, 100),
    "skidpad_score": (0, 75),
    "autocross_score": (0, 150),
    "endurance_score": (0, 350),
    "efficiency_score": (0, 100),
    "endurance_efficiency_score": (0, 400),
}


def key_from_header(header, used):
    if header in IDENTITY_COLUMNS:
        base = IDENTITY_COLUMNS[header]
    elif header in COLUMN_ALIASES:
        base = COLUMN_ALIASES[header]
    else:
        base = header.lower()
        replacements = {
            "+": "_plus_",
            "%": " percent ",
            "&": " and ",
            "/": " ",
        }
        for old, new in replacements.items():
            base = base.replace(old, new)
        base = re.sub(r"\((.*?)\)", r" \1 ", base)
        base = re.sub(r"[^a-z0-9]+", "_", base).strip("_")
    key = base or "field"
    if key not in used:
        used.add(key)
        return key
    i = 2
    while f"{key}_{i}" in used:
        i += 1
    used.add(f"{key}_{i}")
    return f"{key}_{i}"


def clean_number(value):
    if pd.isna(value):
        return np.nan
    if isinstance(value, str):
        text = value.replace("$", "").replace(",", "").strip()
        if text in {"", "-", "DNA", "DNF", "DQ", "N/A", "NA", "nan", "None"}:
            return np.nan
        try:
            return float(text)
        except ValueError:
            return np.nan
    return value


def numeric_conversion(series):
    cleaned = series.astype(str).str.replace("$", "", regex=False).str.replace(",", "", regex=False).str.strip()
    missing_tokens = {"", "-", "DNA", "DNF", "DQ", "N/A", "NA", "nan", "None"}
    present = series.notna() & ~cleaned.isin(missing_tokens)
    converted = pd.to_numeric(cleaned, errors="coerce")
    bad_count = int((present & converted.isna()).sum())
    present_count = int(present.sum())
    return converted, present_count, bad_count


def normalized_team(value):
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")


def direction_for(label, key):
    text = f"{label} {key}".lower()
    if "score" in text or "points" in text:
        return "descending"
    return "ascending"


def group_for(label):
    text = label.lower()
    if "overall" in text or "total" in text:
        return "Overall"
    if "design" in text:
        return "Design"
    if "presentation" in text:
        return "Presentation"
    if "cost" in text:
        return "Cost"
    if "acceleration" in text:
        return "Acceleration"
    if "skidpad" in text:
        return "Skidpad"
    if "autocross" in text:
        return "Autocross"
    if "endurance" in text:
        return "Endurance"
    if "efficiency" in text:
        return "Efficiency"
    if "weight" in text or "engine" in text or "motor" in text or "tractive" in text or "cylinder" in text:
        return "Vehicle"
    return "Other"


def is_integer_metric(label, key):
    text = f"{label} {key}".lower()
    return (
        key in INTEGER_KEYS
        or "number of" in text
        or "number_of" in key
        or "cones" in text
        or "off course" in text
        or "laps" in text
        or "place" in text
    )


def build_metric(label, key):
    fixed_min, fixed_max = FIXED_RANGES.get(key, (None, None))
    metric = {
        "key": key,
        "label": label,
        "group": group_for(label),
        "direction": direction_for(label, key),
        "fixed_min": fixed_min,
        "fixed_max": fixed_max,
    }
    if is_integer_metric(label, key):
        metric["integer"] = True
    return metric


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing source CSV: {SOURCE}")

    raw = pd.read_csv(SOURCE)
    if "Overall Place" not in raw.columns:
        raise SystemExit('The source CSV must contain a column named "Overall Place".')

    used = set()
    key_by_header = {header: key_from_header(header, used) for header in raw.columns}
    df = raw.rename(columns=key_by_header)

    for required in ("competition", "year", "team", "car_num"):
        if required not in df.columns:
            raise SystemExit(f"Missing required dashboard field after mapping: {required}")

    if "vehicle_type" not in df.columns:
        df["vehicle_type"] = ""
    if "source_file" not in df.columns:
        df["source_file"] = ""

    df["team_normalized"] = df["team"].map(normalized_team)
    df["event_id"] = (
        df["competition"].astype(str).str.lower().str.replace(r"[^a-z0-9]+", "_", regex=True).str.strip("_")
        + "_"
        + df["year"].astype(str)
    )
    df["entry_id"] = (
        df["event_id"].astype(str)
        + "_"
        + df["vehicle_type"].astype(str)
        + "_"
        + df["car_num"].astype(str)
        + "_"
        + df["team_normalized"].astype(str)
    )

    metric_start = list(raw.columns).index("Overall Place")
    metric_headers = list(raw.columns)[metric_start:]
    metric_keys = [key_by_header[h] for h in metric_headers]

    numeric_metric_keys = []
    for key in metric_keys:
        converted, present_count, bad_count = numeric_conversion(df[key])
        # Keep mostly-numeric columns even if a few source artifacts exist, but
        # do not expose mixed categorical fields such as fuel type as plot axes.
        allowed_bad = max(10, int(present_count * 0.05))
        if converted.notna().any() and bad_count <= allowed_bad:
            df[key] = converted
            numeric_metric_keys.append(key)

    for key in ["year", "car_num"]:
        df[key] = df[key].map(clean_number)

    metrics = [
        {
            "key": "rank_by_y",
            "label": "Y-Metric Rank",
            "group": "Special",
            "direction": "ascending",
            "fixed_min": None,
            "fixed_max": None,
        }
    ]
    metrics.extend(build_metric(header, key_by_header[header]) for header in metric_headers if key_by_header[header] in numeric_metric_keys)

    json_rows = df.replace({np.nan: None})
    rows = json_rows.to_dict(orient="records")

    payload = {
        "rows": rows,
        "metrics": metrics,
        "manifest": [
            {
                "source": SOURCE.name,
                "entries": int(len(df)),
                "metrics": int(len(metrics) - 1),
            }
        ],
        "summary": {
            "rows": int(len(df)),
            "competitions": sorted(df["competition"].dropna().astype(str).unique().tolist()),
            "vehicle_types": sorted(df["vehicle_type"].dropna().astype(str).unique().tolist()),
            "years": sorted([int(y) for y in pd.to_numeric(df["year"], errors="coerce").dropna().unique()]),
        },
    }

    with open(OUT / "fsae_dashboard_data.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, allow_nan=False, separators=(",", ":"))

    df.to_csv(OUT / "entries_all.csv", index=False)
    pd.DataFrame(metrics).to_csv(OUT / "metric_registry.csv", index=False)
    pd.DataFrame(payload["manifest"]).to_csv(OUT / "source_manifest.csv", index=False)
    with open(OUT / "validation_summary.json", "w", encoding="utf-8") as f:
        json.dump(payload["summary"], f, indent=2)

    print("Built", OUT / "fsae_dashboard_data.json")
    print(json.dumps(payload["summary"], indent=2))
    print(f"Metrics from CSV header: {len(metrics) - 1}")


if __name__ == "__main__":
    main()
