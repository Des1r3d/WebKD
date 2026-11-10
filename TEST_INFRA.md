# TEST_INFRA.md — SyncHub (WebKD) Diagram Test Architecture & Verification Infrastructure

## 1. Overview & Verification Philosophy

This document defines the automated end-to-end (E2E) test harness, verification architecture, and structural invariants for the 7 multi-tab Draw.io (`.drawio`) architectural diagrams and preview exports of the SyncHub (WebKD) platform.

In compliance with the **Honey Ecosystem Guidelines** and project specifications (`PROJECT.md`, `ORIGINAL_REQUEST.md`), the test suite validates that:
1. All architectural models are syntactically and semantically sound, uncompressed, and multi-tabbed.
2. 100% of connectors strictly follow orthogonal routing with zero rounding and white background labels to prevent line-through text.
3. High-resolution preview exports (SVG vector and PNG raster) exist and are non-empty for every tab.
4. The application codebase (`server/`, `client/`, `CONTEXT.md`) maintains a **Zero-Diff Invariant** (unmodified throughout diagram engineering).

---

## 2. Multi-Tier Verification Architecture

The test harness (`test_diagrams_e2e.py`) implements a 5-tier pyramid verification strategy:

```
+-------------------------------------------------------------+
| Tier 5: High-Fidelity Preview Exports (SVG & PNG Headers)   |
+-------------------------------------------------------------+
| Tier 4: Geometric & Styling Constraints (Orthogonal, #fff)  |
+-------------------------------------------------------------+
| Tier 3: Multi-Tab & Semantic Content (19 Tabs, ERD Tables)   |
+-------------------------------------------------------------+
| Tier 2: XML Well-Formedness & Schema (<mxfile host="...">)   |
+-------------------------------------------------------------+
| Tier 1: Application Code Invariant (Zero Git Diff)          |
+-------------------------------------------------------------+
```

### Tier 1: Application Code Invariant (Zero Diff)
- **Goal**: Guarantee isolation and non-regression on production code.
- **Verification Rule**: `git diff --name-only HEAD -- server client CONTEXT.md package.json` must return empty.
- **Enforcement**: Any unstaged or staged modification to core application files fails the test run immediately.

### Tier 2: XML Well-Formedness & Schema Standard
- **Goal**: Ensure `.drawio` files conform to standard Draw.io XML schema without parsing corruption.
- **Verification Rules**:
  - Root element: `<mxfile host="app.diagrams.net" pages="N">`.
  - Storage mode: Native uncompressed XML (`<diagram>` tags wrapping raw `<mxGraphModel>`, NOT compressed deflate/base64 blobs).
  - Graph model hierarchy: `<diagram>` -> `<mxGraphModel>` -> `<root>` -> `<mxCell id="0"/>`, `<mxCell id="1" parent="0"/>`.

### Tier 3: Multi-Tab & Semantic Coverage (19 Tabs)
- **Goal**: Confirm all 7 diagram files contain their designated tabs, business entities, and minimum structural densities.
- **Inventory Matrix**:

| File Name | Min Tabs | Expected Tabs | Key Entities & Verifications |
|-----------|----------|---------------|------------------------------|
| `DFD.drawio` | 3 | 1. DFD Cấp 0 (Context Diagram)<br>2. DFD Cấp 1 (System Level)<br>3. DFD Cấp 2 (Detailed Processes) | Process 0.0, Khách hàng, Đối tác, Quản trị viên, 5 core processes (1.0-5.0), 5 data stores (D1-D5), slot lock, Largest Remainder, escrow webhook |
| `BPMN_AsIS.drawio` | 2 | 1. Đặt sân & chia tiền truyền thống<br>2. Xử lý sự cố truyền thống | Zalo, cọc cá nhân, nợ xấu, trùng lịch sân, hủy món, tranh chấp không đối soát |
| `BPMN_tobe.drawio` | 5 | 1. Quy trình tổng thể E2E<br>2. Khóa Slot nguyên tử 10 phút & Tạo phòng ghép kèo<br>3. Ghép giỏ hàng Realtime & Áp Voucher chéo<br>4. Chia bill Largest Remainder & Thanh toán VietQR Napas 247<br>5. Check-in, Giải ngân đa bên & Phân xử tranh chấp | BR-SLT-01..02, BR-INT-01..05, Largest Remainder rounding, VietQR 247, Escrow HOLD, Idempotency 92/88% payout, FROZEN dispute |
| `UseCase.drawio` | 5 | 1. Tổng quan hệ thống<br>2. Phân hệ Đặt chỗ & Khóa slot<br>3. Phân hệ Giỏ hàng nhóm & Chia bill<br>4. Phân hệ Escrow & Check-in<br>5. Phân hệ Quản trị & Khiếu nại | Actors: HOST, MEMBER, PROVIDER, ADMIN; 12 Use Cases (UC01-UC12), `<<include>>`, `<<extend>>` |
| `ERD.drawio` | 1 | 1. ERD (SyncHub Database ERD) | Crow's Foot notation, 12 tables: `users`, `providers`, `slots`, `group_lobbies`, `lobby_members`, `menu_items`, `cart_items`, `split_bills`, `bill_shares`, `escrow_transactions`, `disputes`, `audit_logs` |
| `Sequence.drawio` | 1 | 1. Sequence (Khóa slot & Giỏ hàng tuần tự) | Lifelines: Host/Member Actors, Client, Server, Database, Payment Gateway |
| `StateMachine.drawio` | 2 | 1. Vòng đời Slot & GroupLobby<br>2. Vòng đời SplitBill & Escrow & Dispute | States: AVAILABLE, LOCKED, EXPIRED, CONFIRMED, OPEN, READY, CHECKED_IN, HELD, RELEASED, FROZEN, REFUNDED |

*Total tabs across all 7 diagrams: 3 + 2 + 5 + 5 + 1 + 1 + 2 = **19 tabs**.*

### Tier 4: Geometric & Styling Constraints
- **Orthogonal Connectors**:
  - Every `mxCell` with `edge="1"` must contain:
    - `edgeStyle=orthogonalEdgeStyle`
    - `rounded=0` (sharp 90-degree elbows, no Bezier curves or curved routing)
- **Edge Label Backgrounds**:
  - Every labeled edge (`mxCell edge="1"` with non-empty `value`) must contain `labelBackgroundColor=#ffffff`.
  - Every sub-label cell (`mxCell style="...edgeLabel..."` with non-empty `value`) must contain `labelBackgroundColor=#ffffff`.
- **Typography & Font**:
  - `fontFamily=Tahoma;` (or `Segoe UI`).
- **Standardized Palettes**:
  - DFD (Gane & Sarson): External Entity (`#DCEEFB`, border `#2E86C1`), Process (`#FDEBD0`, border `#CA6F1E`), Data Store (`#EAECEE`, border `#5D6D7E`).
  - BPMN: Swimlanes (`swimlane; horizontal=0;`), Tasks, Gateways, Events.

### Tier 5: Preview Exports (SVG & PNG)
- **Goal**: Ensure high-fidelity vectors and raster previews exist for academic reporting and web rendering.
- **Check Rules**:
  - For each of the 19 tabs, verify existence of corresponding SVG and PNG preview files in `docs/diagrams/` or `docs/diagrams/exports/`.
  - File size must be strictly > 0 bytes.
  - File header verification:
    - PNG files must start with binary magic bytes: `\x89PNG\r\n\x1a\n`.
    - SVG files must be valid XML starting with `<svg` root or containing `<svg` element.

---

## 3. Test Runner Specification

The automated validator is located at:
`f:\Coding\Projects\WebKD\.agents\teamwork\test_writer_e2e\test_diagrams_e2e.py`

### CLI Usage

```powershell
# Full validation (all 5 tiers)
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py

# Skip preview image checks (during initial diagram modeling M1-M3)
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --skip-previews

# Skip git diff check (if running in isolated non-git environment)
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --skip-git

# Output diagnostic report in JSON format
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --json
```

### Exit Codes & Diagnostics
- **Exit Code `0`**: All assertions and criteria passed (100% green).
- **Exit Code `1`**: One or more assertions failed. A diagnostic table detailing the exact file, tab, element ID, and violation reason is displayed on stdout.

---

## 4. Continuous Integration & Agent Coordination

This test infrastructure is executed at every milestone boundary:
1. **Milestone M1**: Verification of `DFD.drawio`, `BPMN_AsIS.drawio`, and `BPMN_tobe.drawio` with `--skip-previews`.
2. **Milestone M2**: Verification of `UseCase.drawio`, `Sequence.drawio`, and `StateMachine.drawio`.
3. **Milestone M3**: Verification of `ERD.drawio` table schema and Crow's Foot relations.
4. **Milestone M4**: Headless export and Tier 5 SVG/PNG preview verification.
5. **Milestone M5**: Final forensic audit and 100% full-suite pass (`test_diagrams_e2e.py` with exit code 0).
