#!/usr/bin/env python3
"""Standardize DFD.drawio with Slate Minimalist design and strict Gane-Sarson notation."""
import xml.etree.ElementTree as ET

def standardize_dfd(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    for dia in root.findall("diagram"):
        dia_name = dia.get("name") or ""
        
        # 1. Update all vertices and edges in this tab
        for c in dia.findall(".//mxCell"):
            cid = c.get("id") or ""
            val = c.get("value") or ""
            style = c.get("style") or ""

            # External Entities
            if cid.startswith("dfd0_e") or cid.startswith("dfd1_e") or cid.startswith("dfd2_e"):
                c.set("style", "shape=rectangle;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontStyle=1;fontSize=11;fontColor=#1E293B;")
            
            # Processes
            elif cid.startswith("dfd0_p") or cid.startswith("dfd1_p") or cid.startswith("dfd2_p"):
                c.set("style", "shape=rectangle;rounded=1;arcSize=25;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontStyle=1;fontSize=11;fontColor=#1E293B;")

            # Data Stores (Gane-Sarson open rectangle: top=0;bottom=0;)
            elif cid.startswith("dfd1_d") or cid.startswith("dfd2_d"):
                c.set("style", "shape=partialRectangle;top=0;bottom=0;fillColor=#FFFFFF;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontStyle=1;fontSize=11;fontColor=#1E293B;")

            # Subsystem boxes
            elif cid.startswith("grp_p"):
                c.set("style", "shape=rectangle;rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=none;strokeColor=#64748B;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=15;spacingTop=8;fontStyle=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=11;fontColor=#1E293B;")

            # Edge labels
            elif "edgeLabel" in style or cid.endswith("_lbl") or cid.startswith("lbl_"):
                c.set("style", "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Edges
            elif c.get("edge") == "1":
                c.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

        # Tab-specific edge anchor & waypoint refinements
        if "Cấp 0" in dia_name:
            # Context diagram anchor separation with waypoints
            tab0_edges = {
                "dfd0_f1_in":  {"exit": "exitX=1;exitY=0.25;entryX=0;entryY=0.25;", "pts": [(450, 207), (450, 357)]},
                "dfd0_f1_out": {"exit": "exitX=0;exitY=0.75;entryX=1;entryY=0.75;", "pts": [(470, 432), (470, 262)]},
                "dfd0_f2_in":  {"exit": "exitX=0;exitY=0.25;entryX=1;entryY=0.25;", "pts": [(990, 207), (990, 357)]},
                "dfd0_f2_out": {"exit": "exitX=1;exitY=0.75;entryX=0;entryY=0.75;", "pts": [(970, 432), (970, 262)]},
                "dfd0_f3_in":  {"exit": "exitX=0.35;exitY=0;entryX=0.35;entryY=1;", "pts": []},
                "dfd0_f3_out": {"exit": "exitX=0.65;exitY=1;entryX=0.65;entryY=0;", "pts": []},
            }
            for eid, cfg in tab0_edges.items():
                e = dia.find(f'.//mxCell[@id="{eid}"]')
                if e is not None:
                    curr_st = e.get("style") or ""
                    # Remove old exit/entry if any
                    parts = [p for p in curr_st.split(';') if not p.startswith(('exit', 'entry'))]
                    e.set("style", ";".join(parts) + ";" + cfg["exit"])
                    g = e.find("mxGeometry")
                    if g is not None:
                        arr = g.find("Array")
                        if arr is not None: g.remove(arr)
                        if cfg["pts"]:
                            arr = ET.SubElement(g, "Array", {"as": "points"})
                            for px, py in cfg["pts"]:
                                ET.SubElement(arr, "mxPoint", {"x": str(px), "y": str(py)})

        elif "Cấp 1" in dia_name:
            tab1_edges = {
                "dfd1_f1_reg": {"exit": "exitX=0.3;exitY=1;entryX=0.3;entryY=0;", "pts": []},
                "dfd1_f1_auth": {"exit": "exitX=0.7;exitY=0;entryX=0.7;entryY=1;", "pts": []},
                "dfd1_f1_d1": {"exit": "exitX=0.5;exitY=1;entryX=0.5;entryY=0;", "pts": []},
                "dfd1_f2_prov": {"exit": "exitX=0.3;exitY=1;entryX=0.7;entryY=0;", "pts": []},
                "dfd1_f2_host": {"exit": "exitX=1;exitY=0.5;entryX=0.3;entryY=0;", "pts": [(420, 80), (420, 160), (540, 160)]},
                "dfd1_f2_d2": {"exit": "exitX=0.5;exitY=1;entryX=0.5;entryY=0;", "pts": []},
                "dfd1_f2_p3": {"exit": "exitX=1;exitY=0.5;entryX=0;entryY=0.5;", "pts": []},
                "dfd1_f3_lobby": {"exit": "exitX=1;exitY=0.2;entryX=0.5;entryY=0;", "pts": [(360, 56), (360, 20), (980, 20), (980, 200)]},
                "dfd1_f3_d1": {"exit": "exitX=1;exitY=0.3;entryX=0.2;entryY=1;", "pts": [(360, 384), (360, 320), (850, 320)]},
                "dfd1_f3_d3": {"exit": "exitX=0.5;exitY=1;entryX=0.5;entryY=0;", "pts": []},
                "dfd1_f3_p4": {"exit": "exitX=0.2;exitY=1;entryX=0.9;entryY=0;", "pts": [(860, 310), (860, 480), (520, 480)]},
                "dfd1_f4_d4": {"exit": "exitX=0.5;exitY=1;entryX=0.5;entryY=0;", "pts": []},
                "dfd1_f4_e1": {"exit": "exitX=0;exitY=0.5;entryX=0;entryY=0.8;", "pts": [(80, 565), (80, 104)]},
                "dfd1_f5_pay": {"exit": "exitX=0;exitY=0.6;entryX=0.2;entryY=1;", "pts": [(60, 88), (60, 650), (740, 650)]},
                "dfd1_f5_d4": {"exit": "exitX=0;exitY=0.7;entryX=1;entryY=0.5;", "pts": []},
                "dfd1_f5_d5_hold": {"exit": "exitX=0.4;exitY=1;entryX=0.4;entryY=0;", "pts": []},
                "dfd1_f5_checkin": {"exit": "exitX=0.7;exitY=1;entryX=0.9;entryY=0;", "pts": [(890, 120), (1050, 120), (1050, 480), (910, 480)]},
                "dfd1_f5_d1_rep": {"exit": "exitX=0;exitY=0.3;entryX=1;entryY=0.7;", "pts": [(660, 547), (660, 416)]},
                "dfd1_f5_release": {"exit": "exitX=0.5;exitY=1;entryX=0.5;entryY=0;", "pts": []},
                "dfd1_f5_dispute": {"exit": "exitX=0;exitY=0.4;entryX=0.6;entryY=1;", "pts": [(40, 72), (40, 670), (840, 670)]},
                "dfd1_f5_frozen": {"exit": "exitX=0.7;exitY=1;entryX=0.7;entryY=0;", "pts": []},
                "dfd1_f5_admin": {"exit": "exitX=0;exitY=0.5;entryX=1;entryY=0.5;", "pts": []},
                "dfd1_f5_audit": {"exit": "exitX=0.9;exitY=1;entryX=0.9;entryY=0;", "pts": []},
            }
            for eid, cfg in tab1_edges.items():
                e = dia.find(f'.//mxCell[@id="{eid}"]')
                if e is not None:
                    curr_st = e.get("style") or ""
                    parts = [p for p in curr_st.split(';') if not p.startswith(('exit', 'entry'))]
                    e.set("style", ";".join(parts) + ";" + cfg["exit"])
                    g = e.find("mxGeometry")
                    if g is not None:
                        arr = g.find("Array")
                        if arr is not None: g.remove(arr)
                        if cfg["pts"]:
                            arr = ET.SubElement(g, "Array", {"as": "points"})
                            for px, py in cfg["pts"]:
                                ET.SubElement(arr, "mxPoint", {"x": str(px), "y": str(py)})

        elif "Cấp 2" in dia_name:
            tab2_edges = {
                "dfd2_f2_1": "exitX=1;exitY=0.3;entryX=0;entryY=0.5;",
                "dfd2_f2_2": "exitX=0;exitY=0.8;entryX=1;entryY=0.3;",
                "dfd2_f2_3": "exitX=1;exitY=0.5;entryX=0;entryY=0.5;",
                "dfd2_f2_4": "exitX=0.5;exitY=1;entryX=1;entryY=0.7;",
                "dfd2_f2_5": "exitX=0;exitY=0.8;entryX=1;entryY=0.7;",
                "dfd2_f2_6": "exitX=0;exitY=0.3;entryX=0.7;entryY=1;",
                "dfd2_f2_7": "exitX=0;exitY=0.7;entryX=0.4;entryY=1;",
            }
            for eid, anchor in tab2_edges.items():
                e = dia.find(f'.//mxCell[@id="{eid}"]')
                if e is not None:
                    curr_st = e.get("style") or ""
                    e.set("style", curr_st + anchor)

    tree.write(file_path, encoding="utf-8", xml_declaration=True)
    print(f"Standardized {file_path}")

if __name__ == "__main__":
    standardize_dfd("docs/diagrams/DFD.drawio")
