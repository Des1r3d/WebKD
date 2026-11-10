# TEST_READY.md — SyncHub (WebKD) Diagram Verification Harness Ready

## 1. Test Readiness Declaration

The end-to-end automated test harness for SyncHub (WebKD) Draw.io architectural diagrams is **READY and VERIFIED**.

- **Test Script Path**: `f:\Coding\Projects\WebKD\.agents\teamwork\test_writer_e2e\test_diagrams_e2e.py`
- **Specification**: `f:\Coding\Projects\WebKD\TEST_INFRA.md`
- **Execution Engine**: Pure Python 3 standard library (`xml.etree.ElementTree`, `subprocess`, `argparse`, `pathlib`, `json`). Zero external packages required.
- **Dry-Run Validation Status**: Confirmed functional across missing-file baseline, MauDoAn reference model parsing, and JSON diagnostic output.

---

## 2. Test Execution Commands

### Primary Test Commands

```powershell
# 1. Full E2E Verification (All 5 tiers including SVG & PNG preview files)
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py

# 2. Incremental Verification during Milestone M1-M3 (skip preview image check)
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --skip-previews

# 3. Single-Diagram Verification (useful during active model authoring)
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --file DFD.drawio --skip-previews
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --file BPMN_tobe.drawio --skip-previews
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --file ERD.drawio --skip-previews

# 4. Machine-Readable Diagnostic Output (JSON)
python .agents/teamwork/test_writer_e2e/test_diagrams_e2e.py --json
```

---

## 3. Test Coverage Matrix (19 Tabs across 7 Files)

| File Target | Expected Tabs | Verified Invariants |
|-------------|---------------|---------------------|
| `DFD.drawio` | 3 tabs: DFD Cấp 0, DFD Cấp 1, DFD Cấp 2 | Uncompressed `<mxGraphModel>`, 100% orthogonal connectors, white label bg, Process 0.0, 3 actors, 5 core processes, 5 data stores |
| `BPMN_AsIS.drawio` | 2 tabs: Đặt sân & chia tiền truyền thống, Xử lý sự cố truyền thống | BPMN 2.0 swimlanes, Zalo/cọc/nợ xấu/tranh chấp keywords, 100% orthogonal, white label bg |
| `BPMN_tobe.drawio` | 5 tabs: E2E tổng thể, Khóa slot nguyên tử 10p, Ghép giỏ hàng realtime, Chia bill Largest Remainder, Check-in Escrow | BR-SLT-01..02, BR-INT-01..05, BR-ESC-01..04, VietQR, Idempotency, 100% orthogonal, white label bg |
| `UseCase.drawio` | 5 tabs: Tổng quan hệ thống, Đặt chỗ & Khóa slot, Giỏ hàng & Chia bill, Escrow & Check-in, Quản trị & Khiếu nại | Actors HOST/MEMBER/PROVIDER/ADMIN, UC01-UC12, `<<include>>`, `<<extend>>`, 100% orthogonal, white label bg |
| `ERD.drawio` | 1 tab: ERD Cơ sở dữ liệu | 12 tables (`users`, `providers`, `slots`, `group_lobbies`, `lobby_members`, `menu_items`, `cart_items`, `split_bills`, `bill_shares`, `escrow_transactions`, `disputes`, `audit_logs`), Crow's Foot relations, PK/FK columns |
| `Sequence.drawio` | 1 tab: Sequence Diagram | Lifelines: Actors, Client, Server, Database, Payment Gateway; message arrows, 100% orthogonal, white label bg |
| `StateMachine.drawio` | 2 tabs: Vòng đời Slot & GroupLobby, Vòng đời SplitBill & Escrow & Dispute | States: AVAILABLE, LOCKED, EXPIRED, CONFIRMED, OPEN, READY, CHECKED_IN, HELD, RELEASED, FROZEN, REFUNDED; 100% orthogonal, white label bg |
| **Preview Exports** | 19 SVG & 19 PNG files (38 files total) | Non-empty file size, valid PNG magic bytes (`\x89PNG\r\n\x1a\n`), valid SVG XML structure |
| **Codebase Invariant** | `server/`, `client/`, `CONTEXT.md`, `package.json` | Zero diff against `HEAD` |

---

## 4. Exit Code & Diagnostic Specification

- **Exit Code `0`**: All evaluated criteria passed without errors.
- **Exit Code `1`**: One or more assertions failed. A formatted ASCII table and detailed breakdown of failures are displayed.
