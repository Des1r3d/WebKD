#!/usr/bin/env python3
"""Standardize StateMachine.drawio with Slate Minimalist design and clean typography."""
import xml.etree.ElementTree as ET

def standardize_statemachine(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    for dia in root.findall("diagram"):
        dia_name = dia.get("name") or ""
        
        for c in dia.findall(".//mxCell"):
            cid = c.get("id") or ""
            val = c.get("value") or ""
            style = c.get("style") or ""

            # Container / Boundary boxes
            if cid.startswith("b_sm_"):
                c.set("style", "rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=none;strokeColor=#64748B;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=15;spacingTop=10;fontStyle=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=13;fontColor=#1E293B;")

            # Initial states (solid dark circle)
            elif cid.startswith("s0_"):
                c.set("style", "ellipse;fillColor=#1E293B;strokeColor=#1E293B;html=1;aspect=fixed;")

            # Final states (endState)
            elif cid.startswith("se_"):
                c.set("style", "ellipse;html=1;shape=endState;fillColor=#1E293B;strokeColor=#1E293B;strokeWidth=1.5;aspect=fixed;")

            # Normal state boxes
            elif cid.startswith("st_"):
                c.set("style", "rounded=1;arcSize=25;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontSize=11;fontStyle=1;fontColor=#1E293B;align=center;")

            # Edge labels
            elif "edgeLabel" in style or cid.endswith("_lbl") or cid.startswith("lbl_"):
                c.set("style", "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Edges
            elif c.get("edge") == "1":
                curr_exit = ""
                for p in style.split(";"):
                    if p.startswith(("exitX", "exitY", "entryX", "entryY")):
                        curr_exit += p + ";"
                c.set("style", f"edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;strokeColor=#334155;strokeWidth=1.2;labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;{curr_exit}")

    tree.write(file_path, encoding="utf-8", xml_declaration=True)
    print(f"Standardized {file_path}")

if __name__ == "__main__":
    standardize_statemachine("docs/diagrams/StateMachine.drawio")
