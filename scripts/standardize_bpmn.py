#!/usr/bin/env python3
"""Standardize BPMN_AsIS.drawio and BPMN_tobe.drawio with Slate Minimalist design and clean routing."""
import xml.etree.ElementTree as ET

def standardize_bpmn_file(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    for dia in root.findall("diagram"):
        dia_name = dia.get("name") or ""
        
        for c in dia.findall(".//mxCell"):
            cid = c.get("id") or ""
            val = c.get("value") or ""
            style = c.get("style") or ""

            # Swimlanes
            if "shape=swimlane" in style or "swimlane" in style or cid.startswith("lane_") or "lane" in cid:
                c.set("style", "shape=swimlane;horizontal=0;startSize=30;fillColor=#F8FAFC;strokeColor=#475569;strokeWidth=1.2;fontFamily=Helvetica, Arial, sans-serif;fontStyle=1;fontSize=12;fontColor=#1E293B;")
            
            # Start Events
            elif "start" in cid.lower() or "bắt đầu" in val.lower() or "đến sân" in val.lower():
                c.set("style", "shape=ellipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=1.5;strokeColor=#1E293B;fillColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # End Events
            elif "end" in cid.lower() or "kết thúc" in val.lower():
                c.set("style", "shape=ellipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=3;strokeColor=#1E293B;fillColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Intermediate / Timer Events
            elif "timer" in cid.lower() or "time" in cid.lower():
                c.set("style", "shape=ellipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=1.5;strokeColor=#1E293B;fillColor=#EFF6FF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Gateways
            elif "shape=rhombus" in style or "rhombus" in style or "_gw" in cid.lower() or "gw" in cid.lower():
                c.set("style", "shape=rhombus;whiteSpace=wrap;html=1;strokeColor=#334155;strokeWidth=1.2;fillColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Notes / Callouts
            elif "shape=note" in style or cid.startswith("note_"):
                c.set("style", "shape=note;whiteSpace=wrap;html=1;size=14;verticalAlign=top;align=left;spacingLeft=8;spacingTop=4;fillColor=#F8FAFC;strokeColor=#64748B;strokeWidth=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=9;fontColor=#475569;")

            # Edge labels
            elif "edgeLabel" in style or cid.endswith("_lbl") or cid.startswith("lbl_"):
                c.set("style", "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Edges
            elif c.get("edge") == "1":
                is_dashed = "dashed=1" in style
                dash_prop = "dashed=1;dashPattern=6 6;" if is_dashed else "dashed=0;"
                c.set("style", f"edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;{dash_prop}strokeColor=#334155;strokeWidth=1.2;endArrow=classic;labelBackgroundColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

            # Default Tasks
            elif c.get("vertex") == "1" and c.get("parent") != "0":
                c.set("style", "shape=rectangle;rounded=1;arcSize=10;whiteSpace=wrap;html=1;strokeColor=#334155;strokeWidth=1.2;fillColor=#FFFFFF;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;")

        # Custom waypoint adjustments for specific piercing edges in BPMN_AsIS
        if "Đặt sân & chia tiền truyền thống" in dia_name:
            e = dia.find('.//mxCell[@id="flow_v2_h2"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.7;entryX=1;entryY=0.8;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "860", "y": "502"})
                    ET.SubElement(arr, "mxPoint", {"x": "860", "y": "145"})

            e = dia.find('.//mxCell[@id="flow_f2_h6"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.7;entryX=1;entryY=0.8;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "2110", "y": "682"})
                    ET.SubElement(arr, "mxPoint", {"x": "2110", "y": "145"})

        elif "Xử lý sự cố truyền thống" in dia_name:
            e1 = dia.find('.//mxCell[@id="flow_inc2_1"]')
            if e1 is not None:
                e1.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=0;exitY=0.5;entryX=0;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e1.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "650", "y": "142"})
                    ET.SubElement(arr, "mxPoint", {"x": "650", "y": "582"})

            e2 = dia.find('.//mxCell[@id="flow_inc2_2"]')
            if e2 is not None:
                e2.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=1;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e2.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "890", "y": "582"})
                    ET.SubElement(arr, "mxPoint", {"x": "890", "y": "362"})

            e3 = dia.find('.//mxCell[@id="flow_inc3_2"]')
            if e3 is not None:
                e3.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=0;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e3.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1380", "y": "582"})
                    ET.SubElement(arr, "mxPoint", {"x": "1380", "y": "142"})

        # Custom waypoint adjustments for specific piercing edges in BPMN_tobe
        elif "Quy trình tổng thể E2E" in dia_name:
            e = dia.find('.//mxCell[@id="f_tb1_14"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=1;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1900", "y": "120"})
                    ET.SubElement(arr, "mxPoint", {"x": "1900", "y": "555"})

            e = dia.find('.//mxCell[@id="f_tb1_20"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=1;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "2430", "y": "555"})
                    ET.SubElement(arr, "mxPoint", {"x": "2430", "y": "767"})

            e = dia.find('.//mxCell[@id="f_tb1_23"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=0;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "2680", "y": "515"})
                    ET.SubElement(arr, "mxPoint", {"x": "2680", "y": "545"})

        elif "Khóa Slot nguyên tử" in dia_name:
            e = dia.find('.//mxCell[@id="f_tb2_2"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=6 6;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=0;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "400", "y": "127"})
                    ET.SubElement(arr, "mxPoint", {"x": "400", "y": "477"})

            e = dia.find('.//mxCell[@id="f_tb2_win"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=0.5;exitY=0;entryX=0;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "710", "y": "122"})

        elif "Ghép giỏ hàng" in dia_name:
            e = dia.find('.//mxCell[@id="f_tb3_3"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=0.5;exitY=1;entryX=0.2;entryY=1;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "610", "y": "185"})
                    ET.SubElement(arr, "mxPoint", {"x": "944", "y": "185"})

        elif "Chia bill Largest Remainder" in dia_name:
            e = dia.find('.//mxCell[@id="f_tb4_8"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=1;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1580", "y": "122"})
                    ET.SubElement(arr, "mxPoint", {"x": "1580", "y": "677"})

        elif "Check-in, Giải ngân" in dia_name:
            e = dia.find('.//mxCell[@id="f_tb5_4"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=0;exitY=0.5;entryX=0;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "440", "y": "467"})
                    ET.SubElement(arr, "mxPoint", {"x": "440", "y": "647"})

            e = dia.find('.//mxCell[@id="f_tb5_6"]')
            if e is not None:
                e.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.2;endArrow=classic;exitX=1;exitY=0.5;entryX=1;entryY=0.5;labelBackgroundColor=#FFFFFF;")
                g = e.find("mxGeometry")
                if g is not None:
                    arr = g.find("Array")
                    if arr is not None: g.remove(arr)
                    arr = ET.SubElement(g, "Array", {"as": "points"})
                    ET.SubElement(arr, "mxPoint", {"x": "1420", "y": "647"})
                    ET.SubElement(arr, "mxPoint", {"x": "1420", "y": "467"})

    tree.write(file_path, encoding="utf-8", xml_declaration=True)
    print(f"Standardized {file_path}")

if __name__ == "__main__":
    standardize_bpmn_file("docs/diagrams/BPMN_AsIS.drawio")
    standardize_bpmn_file("docs/diagrams/BPMN_tobe.drawio")
