#!/usr/bin/env python3
"""Master script to standardize and export all 7 Draw.io diagram files (19 tabs)."""
import os, subprocess, shutil
from standardize_erd import standardize_erd
from standardize_sequence import standardize_sequence
from standardize_dfd import standardize_dfd
from standardize_bpmn import standardize_bpmn_file
from standardize_usecase import standardize_usecase
from standardize_statemachine import standardize_statemachine

DRAWIO_BIN = "/tmp/opencode/bin/drawio"

EXPORTS = [
    # (source_file, num_tabs, base_name, has_root_alias)
    ("docs/diagrams/ERD.drawio", 1, "ERD", True),
    ("docs/diagrams/Sequence.drawio", 1, "Sequence", True),
    ("docs/diagrams/DFD.drawio", 3, "DFD", False),
    ("docs/diagrams/BPMN_AsIS.drawio", 2, "BPMN_AsIS", False),
    ("docs/diagrams/BPMN_tobe.drawio", 5, "BPMN_tobe", False),
    ("docs/diagrams/UseCase.drawio", 5, "UseCase", False),
    ("docs/diagrams/StateMachine.drawio", 2, "StateMachine", False),
]

def main():
    print("=== Step 1: Standardizing XML models ===")
    standardize_erd("docs/diagrams/ERD.drawio")
    standardize_sequence("docs/diagrams/Sequence.drawio")
    standardize_dfd("docs/diagrams/DFD.drawio")
    standardize_bpmn_file("docs/diagrams/BPMN_AsIS.drawio")
    standardize_bpmn_file("docs/diagrams/BPMN_tobe.drawio")
    standardize_usecase("docs/diagrams/UseCase.drawio")
    standardize_statemachine("docs/diagrams/StateMachine.drawio")

    print("\n=== Step 2: Exporting SVG and PNG previews ===")
    os.makedirs("docs/diagrams/exports", exist_ok=True)

    for src_file, num_tabs, base_name, has_root_alias in EXPORTS:
        for tab_idx in range(1, num_tabs + 1):
            tab_name = f"{base_name}_tab_{tab_idx}"
            png_out = f"docs/diagrams/{tab_name}.png"
            svg_out = f"docs/diagrams/{tab_name}.svg"

            # Drawio export 1-based page
            subprocess.run([DRAWIO_BIN, "-x", "-f", "png", "-s", "2", "-p", str(tab_idx), "-o", png_out, src_file], check=True)
            subprocess.run([DRAWIO_BIN, "-x", "-f", "svg", "-p", str(tab_idx), "-o", svg_out, src_file], check=True)

            shutil.copy2(png_out, f"docs/diagrams/exports/{tab_name}.png")
            shutil.copy2(svg_out, f"docs/diagrams/exports/{tab_name}.svg")

            if has_root_alias and tab_idx == 1:
                alias_png = f"docs/diagrams/{base_name}.png"
                alias_svg = f"docs/diagrams/{base_name}.svg"
                shutil.copy2(png_out, alias_png)
                shutil.copy2(svg_out, alias_svg)
                shutil.copy2(png_out, f"docs/diagrams/exports/{base_name}.png")
                shutil.copy2(svg_out, f"docs/diagrams/exports/{base_name}.svg")

    print("\n=== Done! All 19 tabs standardized and exported ===")

if __name__ == "__main__":
    main()
