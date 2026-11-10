#!/usr/bin/env python3
"""Standardize ERD.drawio with Slate Minimalist design and strict 3-cluster layout."""
import xml.etree.ElementTree as ET

TABLE_LAYOUT = {
    # Cluster 1: Account & Config (Col 1: x=60, w=280)
    "table_users":               {"col": 1, "x": 60,  "y": 100,  "w": 280, "h": 300},
    "table_providers":           {"col": 1, "x": 60,  "y": 440,  "w": 280, "h": 420},
    "table_slots":               {"col": 1, "x": 60,  "y": 900,  "w": 280, "h": 270},
    "table_vouchers":            {"col": 1, "x": 60,  "y": 1210, "w": 280, "h": 390},

    # Cluster 2: Core & Cart (Col 2: x=520, w=280)
    "table_lobby_members":       {"col": 2, "x": 520, "y": 100,  "w": 280, "h": 210},
    "table_group_lobbies":       {"col": 2, "x": 520, "y": 350,  "w": 280, "h": 360},
    "table_menu_items":          {"col": 2, "x": 520, "y": 750,  "w": 280, "h": 240},
    "table_cart_items":          {"col": 2, "x": 520, "y": 1030, "w": 280, "h": 240},

    # Cluster 3: Finance & Audit (Col 3: x=980, w=280)
    "table_disputes":            {"col": 3, "x": 980, "y": 100,  "w": 280, "h": 360},
    "table_split_bills":         {"col": 3, "x": 980, "y": 500,  "w": 280, "h": 390},
    "table_escrow_transactions": {"col": 3, "x": 980, "y": 930,  "w": 280, "h": 360},
    "table_audit_logs":          {"col": 3, "x": 980, "y": 1330, "w": 280, "h": 270},
}

ROW_OFFSETS = {
    # Users
    "row_users_id": 30,
    # Providers
    "row_providers_id": 30,
    "row_providers_owner_id": 60,
    # Slots
    "row_slots_id": 30,
    "row_slots_provider_id": 60,
    "row_slots_locked_by": 210,
    # Vouchers
    "row_vouchers_id": 30,
    # Lobby Members
    "row_lobby_members_lobby_id": 30,
    "row_lobby_members_user_id": 60,
    # Group Lobbies
    "row_group_lobbies_id": 30,
    "row_group_lobbies_host_id": 60,
    "row_group_lobbies_slot_id": 90,
    "row_group_lobbies_fnb_provider_id": 120,
    "row_group_lobbies_voucher_id": 270,
    # Menu Items
    "row_menu_items_id": 30,
    "row_menu_items_provider_id": 60,
    # Cart Items
    "row_cart_items_id": 30,
    "row_cart_items_lobby_id": 60,
    "row_cart_items_user_id": 90,
    "row_cart_items_menu_item_id": 120,
    # Disputes
    "row_disputes_id": 30,
    "row_disputes_lobby_id": 60,
    "row_disputes_reporter_id": 90,
    "row_disputes_target_provider_id": 120,
    "row_disputes_resolved_by": 270,
    # Split Bills
    "row_split_bills_id": 30,
    "row_split_bills_lobby_id": 60,
    "row_split_bills_user_id": 90,
    # Escrow Transactions
    "row_escrow_transactions_id": 30,
    "row_escrow_transactions_lobby_id": 60,
    "row_escrow_transactions_split_bill_id": 90,
    "row_escrow_transactions_payee_provider_id": 240,
    # Audit Logs
    "row_audit_logs_id": 30,
    "row_audit_logs_actor_id": 60,
}

ROW_TO_TABLE = {
    "row_users_id": "table_users",
    "row_providers_id": "table_providers",
    "row_providers_owner_id": "table_providers",
    "row_slots_id": "table_slots",
    "row_slots_provider_id": "table_slots",
    "row_slots_locked_by": "table_slots",
    "row_vouchers_id": "table_vouchers",
    "row_lobby_members_lobby_id": "table_lobby_members",
    "row_lobby_members_user_id": "table_lobby_members",
    "row_group_lobbies_id": "table_group_lobbies",
    "row_group_lobbies_host_id": "table_group_lobbies",
    "row_group_lobbies_slot_id": "table_group_lobbies",
    "row_group_lobbies_fnb_provider_id": "table_group_lobbies",
    "row_group_lobbies_voucher_id": "table_group_lobbies",
    "row_menu_items_id": "table_menu_items",
    "row_menu_items_provider_id": "table_menu_items",
    "row_cart_items_id": "table_cart_items",
    "row_cart_items_lobby_id": "table_cart_items",
    "row_cart_items_user_id": "table_cart_items",
    "row_cart_items_menu_item_id": "table_cart_items",
    "row_disputes_id": "table_disputes",
    "row_disputes_lobby_id": "table_disputes",
    "row_disputes_reporter_id": "table_disputes",
    "row_disputes_target_provider_id": "table_disputes",
    "row_disputes_resolved_by": "table_disputes",
    "row_split_bills_id": "table_split_bills",
    "row_split_bills_lobby_id": "table_split_bills",
    "row_split_bills_user_id": "table_split_bills",
    "row_escrow_transactions_id": "table_escrow_transactions",
    "row_escrow_transactions_lobby_id": "table_escrow_transactions",
    "row_escrow_transactions_split_bill_id": "table_escrow_transactions",
    "row_escrow_transactions_payee_provider_id": "table_escrow_transactions",
    "row_audit_logs_id": "table_audit_logs",
    "row_audit_logs_actor_id": "table_audit_logs",
}

def get_row_center(row_id):
    tbl_id = ROW_TO_TABLE[row_id]
    tbl = TABLE_LAYOUT[tbl_id]
    y_off = ROW_OFFSETS[row_id]
    return tbl["x"], tbl["x"] + tbl["w"], tbl["y"] + y_off + 15

def standardize_erd(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    model = root.find(".//mxGraphModel")
    if model is not None:
        model.set("pageWidth", "1360")
        model.set("pageHeight", "1720")

    # Update banner and legend
    header = root.find('.//mxCell[@id="erd_header_banner"]')
    if header is not None:
        hg = header.find("mxGeometry")
        hg.set("x", "60")
        hg.set("y", "20")
        hg.set("width", "860")
        hg.set("height", "46")
        header.set("style", "rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontSize=12;align=center;fontColor=#1E293B;")

    legend = root.find('.//mxCell[@id="erd_legend_box"]')
    if legend is not None:
        lg = legend.find("mxGeometry")
        lg.set("x", "940")
        lg.set("y", "20")
        lg.set("width", "360")
        lg.set("height", "46")
        legend.set("style", "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#475569;strokeWidth=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;align=center;fontColor=#1E293B;")

    # Layout tables and apply styles
    for tbl_id, geom in TABLE_LAYOUT.items():
        cell = root.find(f'.//mxCell[@id="{tbl_id}"]')
        if cell is not None:
            g = cell.find("mxGeometry")
            g.set("x", str(geom["x"]))
            g.set("y", str(geom["y"]))
            g.set("width", str(geom["w"]))
            g.set("height", str(geom["h"]))
            cell.set("style", "shape=table;startSize=30;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;html=1;fillColor=#F1F5F9;strokeColor=#1E293B;strokeWidth=1.5;fontFamily=Helvetica, Arial, sans-serif;fontSize=12;fontColor=#1E293B;")

    # Apply row and cell styling
    for c in root.findall(".//mxCell"):
        style = c.get("style") or ""
        cid = c.get("id") or ""
        if "shape=tableRow" in style:
            # Row border
            c.set("style", "shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;bottom=1;strokeColor=#E2E8F0;")
            g = c.find("mxGeometry")
            if g is not None:
                g.set("width", "280")
        elif "cell_" in cid and "_key" in cid:
            val = c.get("value") or ""
            font_color = "#0F172A" if "PK" in val else ("#2563EB" if "FK" in val else "#059669")
            c.set("style", f"shape=partialRectangle;fontStyle=1;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=center;overflow=hidden;whiteSpace=wrap;html=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor={font_color};")
        elif "cell_" in cid and "_name" in cid:
            c.set("style", "shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;overflow=hidden;whiteSpace=wrap;html=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=11;fontStyle=1;fontColor=#1E293B;")
        elif "cell_" in cid and "_type" in cid:
            c.set("style", "shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=right;spacingRight=6;overflow=hidden;whiteSpace=wrap;html=1;fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#64748B;")

    # Specific routing for all 23 relationships
    # Corridor 1 channels: x=360, 380, 400, 420, 440, 460, 480
    # Corridor 2 channels: x=820, 840, 860, 880, 900, 920, 940
    # Outer corridors: x=30 (left), y=50 & 70 (top), x=1290 (right), y=1640 (bottom)
    EDGE_CONFIGS = {
        "rel_users_providers": {
            "exit": "exitX=1;exitY=0.2;entryX=1;entryY=0.5;",
            "pts": [(355, 136), (355, 515)]
        },
        "rel_users_slots": {
            "exit": "exitX=1;exitY=0.35;entryX=1;entryY=0.5;",
            "pts": [(375, 140), (375, 1125)]
        },
        "rel_users_lobbies": {
            "exit": "exitX=1;exitY=0.5;entryX=0;entryY=0.5;",
            "pts": [(395, 145), (395, 425)]
        },
        "rel_users_lobby_members": {
            "exit": "exitX=1;exitY=0.65;entryX=0;entryY=0.5;",
            "pts": [(415, 149), (415, 175)]
        },
        "rel_users_cart_items": {
            "exit": "exitX=1;exitY=0.8;entryX=0;entryY=0.5;",
            "pts": [(435, 154), (435, 1135)]
        },
        "rel_users_split_bills": {
            "exit": "exitX=1;exitY=0.95;entryX=0;entryY=0.5;",
            "pts": [(455, 158), (455, 335), (820, 335), (820, 605)]
        },
        "rel_users_disputes_reporter": {
            "exit": "exitX=1;exitY=0.1;entryX=0;entryY=0.5;",
            "pts": [(348, 133), (348, 86), (915, 86), (915, 205)]
        },
        "rel_users_disputes_resolver": {
            "exit": "exitX=0.5;exitY=0;entryX=0;entryY=0.5;",
            "pts": [(200, 74), (895, 74), (895, 385)]
        },
        "rel_users_audit_logs": {
            "exit": "exitX=0;exitY=0.5;entryX=0;entryY=0.5;",
            "pts": [(30, 145), (30, 1640), (950, 1640), (950, 1405)]
        },
        "rel_providers_slots": {
            "exit": "exitX=1;exitY=0.2;entryX=1;entryY=0.5;",
            "pts": [(365, 476), (365, 975)]
        },
        "rel_providers_menu_items": {
            "exit": "exitX=1;exitY=0.4;entryX=0;entryY=0.5;",
            "pts": [(405, 482), (405, 825)]
        },
        "rel_providers_lobbies_fnb": {
            "exit": "exitX=1;exitY=0.6;entryX=0;entryY=0.5;",
            "pts": []  # direct straight line
        },
        "rel_providers_escrow": {
            "exit": "exitX=1;exitY=0.8;entryX=0;entryY=0.5;",
            "pts": [(485, 494), (485, 730), (840, 730), (840, 1185)]
        },
        "rel_providers_disputes": {
            "exit": "exitX=1;exitY=0.95;entryX=0;entryY=0.5;",
            "pts": [(470, 498), (470, 325), (860, 325), (860, 235)]
        },
        "rel_slots_lobbies": {
            "exit": "exitX=1;exitY=0.5;entryX=0;entryY=0.5;",
            "pts": [(425, 945), (425, 455)]
        },
        "rel_vouchers_lobbies": {
            "exit": "exitX=1;exitY=0.5;entryX=0;entryY=0.5;",
            "pts": [(445, 1255), (445, 635)]
        },
        "rel_menu_items_cart_items": {
            "exit": "exitX=1;exitY=0.5;entryX=1;entryY=0.5;",
            "pts": [(820, 795), (820, 1165)]
        },
        "rel_lobbies_members": {
            "exit": "exitX=1;exitY=0.2;entryX=1;entryY=0.5;",
            "pts": [(840, 370), (840, 145)]
        },
        "rel_lobbies_cart_items": {
            "exit": "exitX=1;exitY=0.8;entryX=1;entryY=0.5;",
            "pts": [(860, 650), (860, 1105)]
        },
        "rel_lobbies_split_bills": {
            "exit": "exitX=1;exitY=0.6;entryX=0;entryY=0.5;",
            "pts": [(880, 580), (880, 575)]
        },
        "rel_lobbies_escrow": {
            "exit": "exitX=1;exitY=0.7;entryX=0;entryY=0.5;",
            "pts": [(900, 610), (900, 1005)]
        },
        "rel_lobbies_disputes": {
            "exit": "exitX=1;exitY=0.3;entryX=0;entryY=0.5;",
            "pts": [(930, 410), (930, 175)]
        },
        "rel_split_bills_escrow": {
            "exit": "exitX=1;exitY=0.5;entryX=1;entryY=0.5;",
            "pts": [(1290, 545), (1290, 1035)]
        },
    }

    for edge_id, cfg in EDGE_CONFIGS.items():
        edge = root.find(f'.//mxCell[@id="{edge_id}"]')
        if edge is None:
            continue
        curr_style = edge.get("style") or ""
        # Preserve notation arrows
        start_arrow = "startArrow=ERmandOne;startFill=0;"
        if "startArrow=ERzeroToOne" in curr_style:
            start_arrow = "startArrow=ERzeroToOne;startFill=0;"
        end_arrow = "endArrow=ERzeroToMany;endFill=0;"
        if "endArrow=ERmandOne" in curr_style:
            end_arrow = "endArrow=ERmandOne;endFill=0;"

        new_style = (
            f"edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;"
            f"{start_arrow}{end_arrow}labelBackgroundColor=#FFFFFF;"
            f"fontFamily=Helvetica, Arial, sans-serif;fontSize=10;fontColor=#1E293B;"
            f"strokeColor=#334155;strokeWidth=1.2;{cfg['exit']}"
        )
        edge.set("style", new_style)

        geom = edge.find("mxGeometry")
        if geom is None:
            geom = ET.SubElement(edge, "mxGeometry", {"relative": "1", "as": "geometry"})
        
        arr = geom.find("Array")
        if arr is not None:
            geom.remove(arr)
        
        if cfg["pts"]:
            arr = ET.SubElement(geom, "Array", {"as": "points"})
            for px, py in cfg["pts"]:
                ET.SubElement(arr, "mxPoint", {"x": str(px), "y": str(py)})

    tree.write(file_path, encoding="utf-8", xml_declaration=True)
    print(f"Standardized {file_path}")

if __name__ == "__main__":
    standardize_erd("docs/diagrams/ERD.drawio")
