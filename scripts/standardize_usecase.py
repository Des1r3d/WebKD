#!/usr/bin/env python3
"""Standardize UseCase.drawio with Slate Minimalist design, 3-column layout, and clear routing."""
import xml.etree.ElementTree as ET

def standardize_usecase(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    for dia in root.findall("diagram"):
        dia_name = dia.get("name") or ""

        # Map edges per actor to distribute exitY
        actor_edges = {}
        for c in dia.findall(".//mxCell"):
            if c.get("edge") == "1":
                src = c.get("source") or ""
                if "act" in src.lower():
                    actor_edges.setdefault(src, []).append(c)

        # Distribute exitY for actors
        for act_id, edge_list in actor_edges.items():
            n = len(edge_list)
            for i, e in enumerate(edge_list):
                # Distribute from 0.2 to 0.85
                ey = 0.2 + (0.65 * i / max(1, n - 1))
                curr_st = e.get("style") or ""
                # Replace or add exitY
                st_parts = [p for p in curr_st.split(";") if not p.startswith("exitY")]
                st_parts.append(f"exitY={ey:.2f}")
                e.set("style", ";".join(st_parts))

        for c in dia.findall(".//mxCell"):
            cid = c.get("id") or ""
            val = c.get("value") or ""
            style = c.get("style") or ""

            # System boundary
            if "boundary" in cid.lower() or cid.startswith("b_uc"):
                c.set("style", "shape=rectangle;rounded=1;fillColor=#F8FAFC;strokeColor=#475569;strokeWidth=1.2;dashed=1;verticalAlign=top;align=left;spacingLeft=15;spacingTop=8;fontFamily=Helvetica, Arial, sans-serif;fontStyle=1;fontSize=12;fontColor=#1E293B;")

            # Actors
            elif "shape=umlActor" in style or "act" in cid.lower():
                c.set("style", "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#1E293B;strokeWidth=1.5;fillColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=11;fontStyle=1;fontColor=#1E293B;")

            # Use Cases (ellipses)
            elif "ellipse" in style and c.get("vertex") == "1":
                c.set("style", "shape=ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontSize=11;fontColor=#1E293B;")

            # Edge labels
            elif "edgeLabel" in style or "_lbl" in cid or "lbl_" in cid:
                c.set("style", "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Edges
            elif c.get("edge") == "1":
                is_include_extend = "dashed=1" in style or "include" in val.lower() or "extend" in val.lower() or "rel_" in cid or "r2_" in cid or "r3_" in cid or "r4_" in cid or "r5_" in cid
                # Check if it connects actor
                src = c.get("source") or ""
                tgt = c.get("target") or ""
                is_actor = "act" in src.lower() or "act" in tgt.lower()

                if is_include_extend and not is_actor:
                    c.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=6 6;endArrow=open;endFill=0;strokeColor=#475569;strokeWidth=1.2;labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")
                else:
                    curr_exit = ""
                    for p in style.split(";"):
                        if p.startswith(("exitX", "exitY", "entryX", "entryY")):
                            curr_exit += p + ";"
                    c.set("style", f"edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=0;endArrow=none;strokeColor=#334155;strokeWidth=1.2;labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;{curr_exit}")

        # Tab-specific routing fixes
        if "Tổng quan hệ thống" in dia_name:
            # Route e_a_01 (Admin to UC01) via right and top corridor
            e = dia.find('.//mxCell[@id="e_a_01"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=0;endArrow=none;strokeColor=#334155;strokeWidth=1.2;exitX=1;exitY=0.5;entryX=0.5;entryY=0;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1300", "y": "815"})
                    ET.SubElement(arr, "mxPoint", {"x": "1300", "y": "60"})
                    ET.SubElement(arr, "mxPoint", {"x": "510", "y": "60"})

            # Route host edges to Col B through horizontal gaps between Col A use cases:
            # Gap 1: y=330 (between uc02 and uc03)
            # Gap 2: y=440 (between uc03 and uc04)
            # Gap 3: y=555 (between uc04 and uc05)
            # Gap 4: y=675 (between uc05 and uc06)
            gap_routes = {
                "e_h_07": (330, "entryX=0;entryY=0.5;"),
                "e_h_08": (440, "entryX=0;entryY=0.5;"),
                "e_h_09": (555, "entryX=0;entryY=0.5;"),
                "e_h_10": (665, "entryX=0;entryY=0.5;"),
                "e_m_09": (565, "entryX=0;entryY=0.7;"),
            }
            for eid, (gap_y, ent) in gap_routes.items():
                ed = dia.find(f'.//mxCell[@id="{eid}"]')
                if ed is not None:
                    curr_st = ed.get("style") or ""
                    parts = [p for p in curr_st.split(";") if not p.startswith("entry")]
                    parts.append(ent.rstrip(";"))
                    ed.set("style", ";".join(parts) + ";")
                    g = ed.find("mxGeometry")
                    if g is not None:
                        arr = g.find("Array")
                        if arr is not None: g.remove(arr)
                        arr = ET.SubElement(g, "Array", {"as": "points"})
                        ET.SubElement(arr, "mxPoint", {"x": "260", "y": str(gap_y)})
                        ET.SubElement(arr, "mxPoint", {"x": "700", "y": str(gap_y)})

            # Route rel_08_06 between Col A and Col B in central corridor (x=705)
            e = dia.find('.//mxCell[@id="rel_08_06"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=6 6;endArrow=open;endFill=0;strokeColor=#475569;strokeWidth=1.2;exitX=0;exitY=0.5;entryX=1;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "705", "y": "492"})
                    ET.SubElement(arr, "mxPoint", {"x": "705", "y": "685"})
                    ET.SubElement(arr, "mxPoint", {"x": "680", "y": "685"})

        elif "Giỏ hàng nhóm & Chia bill" in dia_name:
            # Route r3_08_06 around u3_07 via left
            e = dia.find('.//mxCell[@id="r3_08_06"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=6 6;endArrow=open;endFill=0;strokeColor=#475569;strokeWidth=1.2;exitX=0;exitY=0.5;entryX=0;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "290", "y": "765"})
                    ET.SubElement(arr, "mxPoint", {"x": "290", "y": "355"})

        elif "Escrow & Check-in" in dia_name:
            # e4_p_10 from act4_provider to u4_10: route below u4_10_2
            e = dia.find('.//mxCell[@id="e4_p_10"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=0;endArrow=none;strokeColor=#334155;strokeWidth=1.2;exitX=0;exitY=0.5;entryX=1;entryY=0.8;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1050", "y": "515"})
                    ET.SubElement(arr, "mxPoint", {"x": "1050", "y": "680"})
                    ET.SubElement(arr, "mxPoint", {"x": "600", "y": "680"})

        elif "Quản trị & Khiếu nại" in dia_name:
            # e5_p_12: act5_provider to u5_12: route along right corridor at y=830, enter at x=610
            e1 = dia.find('.//mxCell[@id="e5_p_12"]')
            if e1 is not None:
                e1.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=0;endArrow=none;strokeColor=#334155;strokeWidth=1.2;exitX=1;exitY=0.5;entryX=1;entryY=0.8;labelBackgroundColor=#FFFFFF;")
                g = e1.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1340", "y": "235"})
                    ET.SubElement(arr, "mxPoint", {"x": "1340", "y": "830"})
                    ET.SubElement(arr, "mxPoint", {"x": "610", "y": "830"})
                    ET.SubElement(arr, "mxPoint", {"x": "610", "y": "695"})

            # e5_a_12: act5_admin to u5_12: route below u5_12_3 at y=810, enter at x=580
            e2 = dia.find('.//mxCell[@id="e5_a_12"]')
            if e2 is not None:
                e2.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=0;endArrow=none;strokeColor=#334155;strokeWidth=1.2;exitX=0;exitY=0.5;entryX=1;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e2.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1050", "y": "655"})
                    ET.SubElement(arr, "mxPoint", {"x": "1050", "y": "810"})
                    ET.SubElement(arr, "mxPoint", {"x": "580", "y": "810"})
                    ET.SubElement(arr, "mxPoint", {"x": "580", "y": "675"})

    tree.write(file_path, encoding="utf-8", xml_declaration=True)
    print(f"Standardized {file_path}")

if __name__ == "__main__":
    standardize_usecase("docs/diagrams/UseCase.drawio")
