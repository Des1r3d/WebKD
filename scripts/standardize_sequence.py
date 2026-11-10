#!/usr/bin/env python3
"""Standardize Sequence.drawio with Slate Minimalist design and clean vertical grid."""
import xml.etree.ElementTree as ET

LIFELINES = {
    "ll_host":   {"x": 70,   "w": 130, "cx": 135},
    "ll_member": {"x": 330,  "w": 130, "cx": 395},
    "ll_client": {"x": 580,  "w": 150, "cx": 655},
    "ll_server": {"x": 840,  "w": 150, "cx": 915},
    "ll_db":     {"x": 1100, "w": 140, "cx": 1170},
    "ll_gw":     {"x": 1360, "w": 140, "cx": 1430},
}

RESPONSE_MSGS = {
    "m06", "m07", "m08", "m10", "m11", "m12",
    "m16", "m17", "m18", "m24", "m28", "m30",
    "m34", "m35", "m39", "m43", "m44", "m45", "m46"
}

def standardize_sequence(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    model = root.find(".//mxGraphModel")
    if model is not None:
        model.set("pageWidth", "1580")
        model.set("pageHeight", "2300")

    # Header banner
    banner = root.find('.//mxCell[@id="seq_header_banner"]')
    if banner is not None:
        g = banner.find("mxGeometry")
        g.set("x", "50")
        g.set("y", "15")
        g.set("width", "1480")
        g.set("height", "40")
        banner.set("style", "rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontSize=12;align=center;fontColor=#1E293B;")

    # Total Lifeline Height
    H = 2200
    top_y = 60

    # Lifelines
    for lid, cfg in LIFELINES.items():
        cell = root.find(f'.//mxCell[@id="{lid}"]')
        if cell is not None:
            g = cell.find("mxGeometry")
            g.set("x", str(cfg["x"]))
            g.set("y", str(top_y))
            g.set("width", str(cfg["w"]))
            g.set("height", str(H))
            cell.set("style", "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#FFFFFF;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontSize=11;fontStyle=1;fontColor=#1E293B;size=50;")

    # Phase boxes
    phases = {
        "ph1": {"y": 140,  "h": 530, "w": 1480},
        "ph2": {"y": 700,  "h": 770, "w": 1480},
        "ph3": {"y": 1500, "h": 690, "w": 1480},
    }
    for pid, pcfg in phases.items():
        cell = root.find(f'.//mxCell[@id="{pid}"]')
        if cell is not None:
            g = cell.find("mxGeometry")
            g.set("x", "50")
            g.set("y", str(pcfg["y"]))
            g.set("width", str(pcfg["w"]))
            g.set("height", str(pcfg["h"]))
            cell.set("style", "rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=5 5;fillColor=none;strokeColor=#64748B;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=15;spacingTop=8;fontStyle=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=11;fontColor=#1E293B;")

    # Messages m01 to m46
    # dy = 40px
    # ph1: m01..m12 -> y = 180 + (i-1)*40 (180 to 620)
    # ph2: m13..m30 -> y = 740 + (i-13)*40 (740 to 1420)
    # ph3: m31..m46 -> y = 1540 + (i-31)*40 (1540 to 2140)
    msg_y_map = {}
    for i in range(1, 13):
        msg_y_map[f"m{i:02d}"] = 180 + (i - 1) * 40
    for i in range(13, 31):
        msg_y_map[f"m{i:02d}"] = 740 + (i - 13) * 40
    for i in range(31, 47):
        msg_y_map[f"m{i:02d}"] = 1540 + (i - 31) * 40

    for mid, my in msg_y_map.items():
        edge = root.find(f'.//mxCell[@id="{mid}"]')
        if edge is None:
            continue
        rel_y = (my - top_y) / H
        is_resp = mid in RESPONSE_MSGS

        if is_resp:
            edge_style = (
                f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
                f"dashed=1;endArrow=open;endFill=0;strokeColor=#475569;strokeWidth=1.2;"
                f"fontFamily=Helvetica, Arial, sans-serif;exitX=0.5;exitY={rel_y:.5f};entryX=0.5;entryY={rel_y:.5f};"
            )
        else:
            edge_style = (
                f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
                f"dashed=0;endArrow=classic;endFill=1;strokeColor=#1E293B;strokeWidth=1.2;"
                f"fontFamily=Helvetica, Arial, sans-serif;exitX=0.5;exitY={rel_y:.5f};entryX=0.5;entryY={rel_y:.5f};"
            )
        edge.set("style", edge_style)

        g = edge.find("mxGeometry")
        if g is None:
            g = ET.SubElement(edge, "mxGeometry", {"relative": "1", "as": "geometry"})
        
        # Clear waypoints to keep it straight
        arr = g.find("Array")
        if arr is not None:
            g.remove(arr)

        sp = g.find('mxPoint[@as="sourcePoint"]')
        if sp is None:
            sp = ET.SubElement(g, "mxPoint", {"as": "sourcePoint"})
        sp.set("y", str(my))

        tp = g.find('mxPoint[@as="targetPoint"]')
        if tp is None:
            tp = ET.SubElement(g, "mxPoint", {"as": "targetPoint"})
        tp.set("y", str(my))

        # Label styling
        lbl = root.find(f'.//mxCell[@id="{mid}_lbl"]')
        if lbl is not None:
            lbl.set("style", "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")
            lg = lbl.find("mxGeometry")
            if lg is not None:
                lg.set("y", "-10")

    tree.write(file_path, encoding="utf-8", xml_declaration=True)
    print(f"Standardized {file_path}")

if __name__ == "__main__":
    standardize_sequence("docs/diagrams/Sequence.drawio")
