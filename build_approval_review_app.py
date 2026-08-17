#!/usr/bin/env python3
"""
Build the eContract Approval Review (簽核) process-application TWX.

Strategy (identical to build_econtract_app.py that produced working ECS 1.0.4):
  1. Load clean CSHS template from BaseTWX/24.0.1 (valid <jsonData> + <coachflow>)
  2. Patch process identity only — ALL internal 2025.xxx / 2027.xxx node IDs untouched
  3. Inject the six 簽核 process variables (replacing the single statusCard variable)
  4. Use server-exported ECS base TWX as the injection container so the server's
     own theme, settings, and dependency resolution are preserved.
  5. Generate a fresh snapshot UUID every build — prevents BAW silent deduplication.

Usage:
    python3 build_approval_review_app.py
Output:
    output/eContract_Approval_Review_1.0.0.twx
"""
import re
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
import xml.etree.ElementTree as ET

# ── App identity ───────────────────────────────────────────────────────────────

APP_NAME        = "eContract Approval Review"
APP_SHORT_NAME  = "ECA"
APP_VERSION     = "1.0.3"

# Stable persistent IDs — same across all versions so BAW treats them as upgrades
APP_ID          = "2066.fa3b8811-d2c1-4e09-93a2-b8e5cf2d9011"
BRANCH_ID       = "2063.fb3b8811-d2c1-4e09-93a2-b8e5cf2d9012"
# Fresh snapshot ID every build so BAW never deduplicates
SNAPSHOT_ID     = f"2064.{uuid.uuid4()}"

# Process object — stable ID matching coaches/econtract_approval_review.xml
HS_ID           = "1.7fa3b881-d2c1-4e09-93a2-b8e5cf2d9011"
HS_NAME         = APP_NAME
HS_DESC         = "eContract 簽核 — Approval review task screen using CW toolkit v1.0.123"

# CW toolkit dependency (deployed snapshot on server)
CW_DEP_ID       = "2069.cebc1c06-68a5-4d2e-986a-ef2b04a791c3"
CW_PROJECT_ID   = "2066.cebc1c06-68a5-4d2e-986a-aaae3072cefb"
CW_BRANCH_ID    = "2063.58d1876b-64f7-4b1a-b064-e0c97b073a8b"
CW_SNAPSHOT_ID  = "2064.164ecf6e-ef01-4373-8219-85759e792252"   # CW 1.0.125

# System toolkit dependencies (from server-exported base TWX)
SYSDATA_DEP_ID  = "2069.cf3f1815-aea7-43ed-ab46-f113df9c91a7"
SYSDATA_PROJ_ID = "2066.1b351583-e5cb-43b7-baee-340a63130ea7"
SYSDATA_BR_ID   = "2063.0798815e-0346-4ef4-8946-ab4301c9f340"
SYSDATA_SNAP_ID = "2064.1080ded6-d153-4654-947c-2d16fce170db"

UITK_DEP_ID     = "2069.1a9b167f-fac5-4196-92f0-99ba493ec77c"
UITK_PROJ_ID    = "2066.ec5973da-aebe-40f6-aa02-a77962288f52"
UITK_BR_ID      = "2063.83ee2bb2-72b4-4a4d-b8ae-37ecd983c05e"
UITK_SNAP_ID    = "2064.304ac881-16c3-47d2-97d5-6e4c4a893177"

BUILD_ID        = "BPM8600-20260427-190847"
BUILD_VERSION   = "8.6.10"
BUILD_DESC      = "IBM Business Process Manager V8.6.10.25010 - 20260427_2123 - BPM8600-20260427-190847"

SETTINGS_ID         = "63.fa3b8811-d2c1-4e09-0000-000000000001"
SETTINGS_VERSION_ID = "fa3b8811-d2c1-4e09-0000-000000000002"

OUTPUT_FILE     = f"output/eContract_Approval_Review_{APP_VERSION}.twx"

# ── CW BO type IDs (from CW toolkit objects/12.*.xml) ─────────────────────────
# Used in processVariable classId and ns16:dataObject itemSubjectRef.
# The CW toolkit project UUID (container prefix for classId):
CW_PROJ_UUID    = "cebc1c06-68a5-4d2e-986a-aaae3072cefb"   # = CW_PROJECT_ID without "2066."
# BAW system String type (from SysData toolkit — well-known fixed ID):
SYS_STRING_ID   = "12.0b208895-bdb3-4e67-a402-af17a05858d2"
# CW custom BO type IDs:
CW_BO = {
    "contractTitle":        SYS_STRING_ID,
    "approvalProgressData": "12.923f5df1-5485-4c01-b678-eac5709807a4",  # ApprovalProgress
    "processStatusData":    "12.b9954ce1-8b11-4130-a8f8-d7479b2b6053",  # ProcessStatus
    "approvalChainData":    "12.ea04d218-6efb-475b-b3f4-14978f2dc992",  # ApprovalChain
    "approvalRouteData":    "12.15bb2f6e-43c7-4011-baf7-eafb0587d47c",  # ApprovalRoute
    "approverActionData":   "12.fbcf2799-dac9-4173-be65-1df74ff89a9f",  # ApproverAction
    "auditLogData":         "12.e0145554-ce9b-42b8-a835-b66a8ae6db2d",  # AuditLog
}

# Clean single-coach CSHS template (valid <jsonData> + <coachflow> for this server)
CSHS_TEMPLATE   = "templates/BaseTWX/24.0.1/objects/1.52b15e50-3ddc-426b-a7f2-d5706e43ddf7.xml"
# Server-exported ECS base for dependency / theme preservation
BASE_TWX        = "output/eContract_External_Signing_base.twx"

# ── Helpers ────────────────────────────────────────────────────────────────────

def now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)

def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

def new_uuid() -> str:
    return str(uuid.uuid4())

def esc(s: str) -> str:
    return (s.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;"))

# ── CSHS patcher ───────────────────────────────────────────────────────────────

def patch_cshs(template_xml: str) -> tuple:
    """
    Patch the clean BaseTWX CSHS template for the 簽核 process identity.

    Rules:
      - Replace all occurrences of the template process ID → HS_ID
      - Replace process name attribute → HS_NAME
      - Replace top-level versionId only (first occurrence)
      - Update lastModified, lastModifiedBy, description, guid
      - Replace the single statusCard variable with our six 簽核 process variables
      - Keep ALL 2025.xxx / 2027.xxx internal node IDs untouched
      - Keep <jsonData> and <coachflow> blobs exactly as-is
    """
    orig_id   = "1.52b15e50-3ddc-426b-a7f2-d5706e43ddf7"
    orig_name = "Client-side human service"
    new_vid   = new_uuid()
    ts        = now_ms()
    new_guid  = uuid.uuid4().hex[:16]

    x = template_xml

    # 1. Replace all process ID occurrences
    x = x.replace(orig_id, HS_ID)

    # 2. Replace process name attribute
    x = x.replace(f'name="{orig_name}"', f'name="{HS_NAME}"')

    # 3. Replace top-level versionId (first occurrence only)
    orig_vid_m = re.search(r'<versionId>([^<]+)</versionId>', x)
    if orig_vid_m:
        x = x.replace(
            f'<versionId>{orig_vid_m.group(1)}</versionId>',
            f'<versionId>{new_vid}</versionId>',
            1
        )

    # 4. Update metadata fields
    x = re.sub(r'<lastModified>\d+</lastModified>',
               f'<lastModified>{ts}</lastModified>', x, count=1)
    x = re.sub(r'<lastModifiedBy>[^<]+</lastModifiedBy>',
               '<lastModifiedBy>cpmanager</lastModifiedBy>', x, count=1)
    x = re.sub(r'<description isNull="true" />',
               f'<description>{esc(HS_DESC)}</description>', x, count=1)
    x = re.sub(r'<guid>guid:[^<]+</guid>',
               f'<guid>guid:{new_guid}</guid>', x, count=1)

    # 5. Replace the single processVariable block with our six 簽核 variables
    old_var = re.search(
        r'        <processVariable name="statusCard">.*?</processVariable>',
        x, re.DOTALL
    )
    if old_var:
        x = x.replace(old_var.group(0), _build_process_variables(HS_ID))
    else:
        # Fallback: insert before first <item>
        x = x.replace(
            '        <item>',
            _build_process_variables(HS_ID) + '\n        <item>',
            1
        )

    # 6a. Replace the scriptTask script in jsonData (JSON-embedded, uses \\r\\n + \\" escaping)
    #     Pattern: "script":{"content":["...any chars including escaped quotes..."]}
    old_json_script = re.search(
        r'"script":\{"content":\["(?:[^"\\]|\\.)*"\]\}',
        x
    )
    if old_json_script:
        x = x.replace(old_json_script.group(0), _build_preload_script_json())
    else:
        raise RuntimeError("jsonData script block not found — template changed")

    # 6b. Replace the coachflow <ns16:script> block (XML text, uses &#xD; for CR)
    #     This is the runtime version BAW actually executes; must match 6a.
    old_cf_script = re.search(
        r'<ns16:script>tw\.local\.statusCard.*?</ns16:script>',
        x, re.DOTALL
    )
    if old_cf_script:
        x = x.replace(old_cf_script.group(0), _build_coachflow_script_xml())
    else:
        raise RuntimeError("coachflow <ns16:script> block not found — template changed")

    # 6c. Replace remaining statusCard references in the coachflow XML:
    #     - <ns19:binding>tw.local.statusCard</ns19:binding>  → approvalProgressData
    #     - <ns16:dataObject ...> statusCard declaration        → remove (no longer needed)
    #     - Any statusCard occurrence remaining in jsonData layout JSON → patch inline
    x = x.replace(
        '<ns19:binding>tw.local.statusCard</ns19:binding>',
        '<ns19:binding>tw.local.approvalProgressData</ns19:binding>'
    )
    # Replace the <ns16:dataObject> statusCard declaration with our 7 variable declarations
    x = re.sub(
        r'\s*<ns16:dataObject\b[^/]*/>\s*(?=\s*<ns16:scriptTask)',
        '\n' + _build_coachflow_dataobjects(),
        x
    )
    # Patch jsonData layout binding reference: "binding":"tw.local.statusCard"
    x = x.replace(
        '"binding":"tw.local.statusCard"',
        '"binding":"tw.local.approvalProgressData"'
    )

    # Remove the dataObject JSON entry in jsonData: {"itemSubjectRef":"...","name":"statusCard",...}
    # It appears as a comma-preceded element in the flowElement array.
    x = re.sub(
        r',\{"itemSubjectRef":"[^"]+","name":"statusCard","isCollection":false,"declaredType":"dataObject","id":"[^"]+"\}',
        '',
        x
    )

    # 7. Replace the entire coach layoutItem array in jsonData with our 6 ECA widgets.
    #    The template has 2 items: StatusCard1 + okbutton.
    #    We replace "layout":{"layoutItem":[...]} inside the coachDefinition.
    old_layout = re.search(
        r'"layout":\{"layoutItem":\[.*?\]\}',
        x, re.DOTALL
    )
    if old_layout:
        x = x.replace(old_layout.group(0), _build_coach_layout_json(), 1)
    else:
        raise RuntimeError("coach layoutItem block not found in jsonData — template changed")

    # 8. Replace the coachflow <ns16:view> binding to point to approvalProgressData
    #    (the first/only widget binding in the template coachflow references the old view)
    #    Also patch all widget bindings in the coachflow XML.
    x = _patch_coachflow_views(x)

    return x, new_vid


# Coach view IDs from CW 1.0.125 (from package.xml in Custom_Widgets_1.0.125.twx)
CW_VIEWS = {
    "ApprovalProgressBar": "64.ec1a0003-aaf1-4b11-9c33-012345670001",
    "ApprovalChain":       "64.ec1a0002-aaf1-4b11-9c33-012345670001",
    "ProcessStatusCard":   "64.ec1a0005-aaf1-4b11-9c33-012345670001",
    "AuditTimeline":       "64.ec1a0007-aaf1-4b11-9c33-012345670001",
    "ApproverActionPanel": "64.ec1a0001-aaf1-4b11-9c33-012345670001",
    "ApprovalRouteFlow":   "64.ec1a0004-aaf1-4b11-9c33-012345670001",
}


def _cfg(opt_id: str, name: str, value: str) -> dict:
    """Build a coach configData entry."""
    return {
        "declaredType": "com.ibm.bpmsdk.model.coach.ConfigData",
        "id": opt_id, "optionName": name, "value": value
    }


def _widget_item(item_id: str, label: str, view_uuid: str, binding: str, extra_cfg=None) -> dict:
    """Build a coach layoutItem for one of our custom widgets."""
    cfg = [
        _cfg(f"{item_id}-lbl", "@label",           label),
        _cfg(f"{item_id}-hlp", "@helpText",         ""),
        _cfg(f"{item_id}-vis", "@labelVisibility",  "HIDE"),
    ]
    if extra_cfg:
        cfg.extend(extra_cfg)
    return {
        "layoutItemId":  item_id,
        "configData":    cfg,
        "viewUUID":      view_uuid,
        "binding":       binding,
        "declaredType":  "com.ibm.bpmsdk.model.coach.ViewRef",
        "id":            item_id,
        "version":       "8550",
    }


def _build_coach_layout_json() -> str:
    """
    Return the JSON fragment replacing "layout":{"layoutItem":[...]}
    inside the coachDefinition in jsonData.

    Layout mirrors the screenshot:
      Row 1: ApprovalProgressBar  (full width, bound to approvalProgressData)
      Row 2: Output Text label    (contractTitle — uses built-in Text view)
      Row 3: two columns
        Left  60%: ApprovalChain, ProcessStatusCard, AuditTimeline
        Right 40%: ApproverActionPanel, ApprovalRouteFlow
      Row 4: OK button (required by CSHS flow to proceed)
    """
    import json as _json

    # UI Toolkit built-in view UUIDs (from ECS base TWX coach)
    OUTPUT_TEXT_UUID = "64.7133c7d4-1a54-45c8-89cd-a8e8fa4a8e36"   # Button/OK — we keep it
    # Section (horizontal layout) UUID from ECS base
    SECTION_UUID     = "64.455e44ab-b77b-4337-b3f9-435e234fb569"

    items = [
        # ── Row 1: ApprovalProgressBar ────────────────────────────────────────
        _widget_item("ApprovalProgressBar1",
                     "ApprovalProgressBar",
                     CW_VIEWS["ApprovalProgressBar"],
                     "tw.local.approvalProgressData"),

        # ── Row 2: Contract title (Output Text) ───────────────────────────────
        {
            "layoutItemId": "contractTitleText",
            "configData": [
                _cfg("ct-lbl", "@label",          "contractTitle"),
                _cfg("ct-hlp", "@helpText",        ""),
                _cfg("ct-vis", "@labelVisibility", "HIDE"),
            ],
            "viewUUID":    OUTPUT_TEXT_UUID,
            "binding":     "tw.local.contractTitle",
            "declaredType":"com.ibm.bpmsdk.model.coach.ViewRef",
            "id":          "contractTitleText",
            "version":     "8550",
        },

        # ── Row 3 Left: ApprovalChain ─────────────────────────────────────────
        _widget_item("ApprovalChain1",
                     "ApprovalChain",
                     CW_VIEWS["ApprovalChain"],
                     "tw.local.approvalChainData"),

        # ── Row 3 Left: ProcessStatusCard ─────────────────────────────────────
        _widget_item("ProcessStatusCard1",
                     "ProcessStatusCard",
                     CW_VIEWS["ProcessStatusCard"],
                     "tw.local.processStatusData"),

        # ── Row 3 Left: AuditTimeline ─────────────────────────────────────────
        _widget_item("AuditTimeline1",
                     "AuditTimeline",
                     CW_VIEWS["AuditTimeline"],
                     "tw.local.auditLogData"),

        # ── Row 3 Right: ApproverActionPanel ─────────────────────────────────
        _widget_item("ApproverActionPanel1",
                     "ApproverActionPanel",
                     CW_VIEWS["ApproverActionPanel"],
                     "tw.local.approverActionData"),

        # ── Row 3 Right: ApprovalRouteFlow ────────────────────────────────────
        _widget_item("ApprovalRouteFlow1",
                     "ApprovalRouteFlow",
                     CW_VIEWS["ApprovalRouteFlow"],
                     "tw.local.approvalRouteData"),

        # ── OK button (required by CSHS sequenceFlow to end) ─────────────────
        {
            "layoutItemId": "okbutton",
            "configData": [
                _cfg("ok-lbl", "@label", "OK"),
            ],
            "viewUUID":    OUTPUT_TEXT_UUID,
            "declaredType":"com.ibm.bpmsdk.model.coach.ViewRef",
            "id":          "okbutton",
        },
    ]

    layout = {"layoutItem": items}
    return '"layout":' + _json.dumps(layout, ensure_ascii=False, separators=(',', ':'))


def _patch_coachflow_views(x: str) -> str:
    """
    Patch the coachflow XML to reference all 6 ECA widget coach views
    instead of the single template StatusCard view.

    The coachflow <ns16:view> elements reference viewUUIDs.
    Replace the old single view reference with all 6 new ones.
    """
    OLD_STATUSCARD_UUID = "64.8d1a9716-6a0b-49b5-9f8c-b69f2d3d1d14"

    # Replace the old StatusCard view UUID with ApprovalProgressBar UUID
    # (the first/primary widget; others are in the jsonData layout)
    x = x.replace(OLD_STATUSCARD_UUID, CW_VIEWS["ApprovalProgressBar"])

    # Replace ns16:view entries for the coach - add all 6 widget view refs
    # The template has one <ns16:view> for StatusCard; replace with all 6
    old_view_block = re.search(
        r'<ns16:view[^>]*/>\s*' * 1 + r'|<ns16:view\b[^>]*/?>',
        x
    )
    # Build the 6 view declarations for coachflow
    new_views = ''.join(
        f'<ns16:view viewUUID="{uuid}" />\n                                '
        for uuid in CW_VIEWS.values()
    )
    # Replace ALL ns16:view occurrences that reference the old StatusCard
    x = re.sub(
        r'<ns16:view\s+viewUUID="' + re.escape(CW_VIEWS["ApprovalProgressBar"]) + r'"\s*/>',
        new_views.strip(),
        x, count=1
    )
    return x




def _build_preload_script_json() -> str:
    """
    Return the JSON fragment that replaces the scriptTask 'script' content
    inside jsonData. BAW executes this Client-side script before the coach
    renders, so every tw.local variable is populated with sample data.

    Rules for the JSON string value:
      - newlines  → \\r\\n  (BAW stores CRLF)
      - double-quotes inside the JS → \\"
      - backslashes → \\\\
    The outer wrapper must be exactly:
      "script":{"content":["<JS HERE>"]}
    """
    js_lines = [
        # ── contractTitle ────────────────────────────────────────────────
        'tw.local.contractTitle = "2026 年度軟體維護服務合約";',

        # ── approvalProgressData ─────────────────────────────────────────
        'tw.local.approvalProgressData = {};',
        'tw.local.approvalProgressData.currentStageIndex = 1;',
        'tw.local.approvalProgressData.ctaLabel = "已完成 → 外部簽署 →";',
        'tw.local.approvalProgressData.ctaAction = "proceed_to_external_signing";',
        'tw.local.approvalProgressData.stages = [];',
        'tw.local.approvalProgressData.stages[0] = {};',
        'tw.local.approvalProgressData.stages[0].index = 0;',
        'tw.local.approvalProgressData.stages[0].label = "起草送件";',
        'tw.local.approvalProgressData.stages[0].status = "completed";',
        'tw.local.approvalProgressData.stages[1] = {};',
        'tw.local.approvalProgressData.stages[1].index = 1;',
        'tw.local.approvalProgressData.stages[1].label = "簽核路由";',
        'tw.local.approvalProgressData.stages[1].status = "current";',
        'tw.local.approvalProgressData.stages[2] = {};',
        'tw.local.approvalProgressData.stages[2].index = 2;',
        'tw.local.approvalProgressData.stages[2].label = "外部簽署";',
        'tw.local.approvalProgressData.stages[2].status = "pending";',
        'tw.local.approvalProgressData.stages[3] = {};',
        'tw.local.approvalProgressData.stages[3].index = 3;',
        'tw.local.approvalProgressData.stages[3].label = "完成歸檔";',
        'tw.local.approvalProgressData.stages[3].status = "pending";',

        # ── approvalChainData ────────────────────────────────────────────
        'tw.local.approvalChainData = {};',
        'tw.local.approvalChainData.title = "串簽流程（3 層）";',
        'tw.local.approvalChainData.routeType = "串簽";',
        'tw.local.approvalChainData.totalLayers = 3;',
        'tw.local.approvalChainData.approvers = [];',
        'tw.local.approvalChainData.approvers[0] = {};',
        'tw.local.approvalChainData.approvers[0].name = "王志明";',
        'tw.local.approvalChainData.approvers[0].avatarInitial = "王";',
        'tw.local.approvalChainData.approvers[0].role = "直屬主管";',
        'tw.local.approvalChainData.approvers[0].department = "採購部門";',
        'tw.local.approvalChainData.approvers[0].status = "approved";',
        'tw.local.approvalChainData.approvers[0].layer = 1;',
        'tw.local.approvalChainData.approvers[1] = {};',
        'tw.local.approvalChainData.approvers[1].name = "李雅婷";',
        'tw.local.approvalChainData.approvers[1].avatarInitial = "李";',
        'tw.local.approvalChainData.approvers[1].role = "上一層主管";',
        'tw.local.approvalChainData.approvers[1].department = "採購總監";',
        'tw.local.approvalChainData.approvers[1].status = "current";',
        'tw.local.approvalChainData.approvers[1].layer = 2;',
        'tw.local.approvalChainData.approvers[2] = {};',
        'tw.local.approvalChainData.approvers[2].name = "張文豪";',
        'tw.local.approvalChainData.approvers[2].avatarInitial = "張";',
        'tw.local.approvalChainData.approvers[2].role = "最終核准";',
        'tw.local.approvalChainData.approvers[2].department = "副總經理";',
        'tw.local.approvalChainData.approvers[2].status = "pending";',
        'tw.local.approvalChainData.approvers[2].layer = 3;',

        # ── processStatusData ────────────────────────────────────────────
        'tw.local.processStatusData = {};',
        'tw.local.processStatusData.routeType = "串簽 Sequential";',
        'tw.local.processStatusData.submittedAt = "2026-07-14 09:32";',
        'tw.local.processStatusData.estimatedCompletion = "2026-07-16";',
        'tw.local.processStatusData.aiScore = 82;',
        'tw.local.processStatusData.aiMaxScore = 100;',
        'tw.local.processStatusData.aiSuggestionLabel = "建議修改";',
        'tw.local.processStatusData.aiSuggestionAction = "view_ai_report";',

        # ── approverActionData ───────────────────────────────────────────
        'tw.local.approverActionData = {};',
        'tw.local.approverActionData.approverName = "待我審核";',
        'tw.local.approverActionData.currentLayer = 2;',
        'tw.local.approverActionData.totalLayers = 3;',
        'tw.local.approverActionData.contextMessage = "您目前為本案第 2 層審核人，請確認合約條款並做出決策。";',
        'tw.local.approverActionData.comment = "";',
        'tw.local.approverActionData.decision = "";',
        'tw.local.approverActionData.actions = [];',
        'tw.local.approverActionData.actions[0] = {};',
        'tw.local.approverActionData.actions[0].label = "退回";',
        'tw.local.approverActionData.actions[0].actionKey = "return";',
        'tw.local.approverActionData.actions[0].style = "danger";',
        'tw.local.approverActionData.actions[0].enabled = true;',
        'tw.local.approverActionData.actions[1] = {};',
        'tw.local.approverActionData.actions[1].label = "轉派";',
        'tw.local.approverActionData.actions[1].actionKey = "delegate";',
        'tw.local.approverActionData.actions[1].style = "secondary";',
        'tw.local.approverActionData.actions[1].enabled = true;',
        'tw.local.approverActionData.actions[2] = {};',
        'tw.local.approverActionData.actions[2].label = "核准";',
        'tw.local.approverActionData.actions[2].actionKey = "approve";',
        'tw.local.approverActionData.actions[2].style = "primary";',
        'tw.local.approverActionData.actions[2].enabled = true;',

        # ── auditLogData ─────────────────────────────────────────────────
        'tw.local.auditLogData = {};',
        'tw.local.auditLogData.events = [];',
        'tw.local.auditLogData.events[0] = {};',
        'tw.local.auditLogData.events[0].timestamp = "07-14 09:32";',
        'tw.local.auditLogData.events[0].actor = "陳大明";',
        'tw.local.auditLogData.events[0].action = "送審";',
        'tw.local.auditLogData.events[0].detail = "陳大明送審，附 AI 報告";',
        'tw.local.auditLogData.events[0].isHighlighted = false;',
        'tw.local.auditLogData.events[1] = {};',
        'tw.local.auditLogData.events[1].timestamp = "07-14 11:05";',
        'tw.local.auditLogData.events[1].actor = "王志明";',
        'tw.local.auditLogData.events[1].action = "核准";',
        'tw.local.auditLogData.events[1].detail = "王志明核准 — 「條款無誤，同意送上級」";',
        'tw.local.auditLogData.events[1].isHighlighted = true;',
        'tw.local.auditLogData.events[2] = {};',
        'tw.local.auditLogData.events[2].timestamp = "07-14 11:05";',
        'tw.local.auditLogData.events[2].actor = "系統";',
        'tw.local.auditLogData.events[2].action = "通知";',
        'tw.local.auditLogData.events[2].detail = "系統通知李雅婷待審";',
        'tw.local.auditLogData.events[2].isHighlighted = false;',

        # ── approvalRouteData ────────────────────────────────────────────
        'tw.local.approvalRouteData = {};',
        'tw.local.approvalRouteData.steps = [];',
        'tw.local.approvalRouteData.steps[0] = {};',
        'tw.local.approvalRouteData.steps[0].label = "申請人送審";',
        'tw.local.approvalRouteData.steps[0].sublabel = "";',
        'tw.local.approvalRouteData.steps[0].status = "completed";',
        'tw.local.approvalRouteData.steps[1] = {};',
        'tw.local.approvalRouteData.steps[1].label = "直屬主管核准";',
        'tw.local.approvalRouteData.steps[1].sublabel = "";',
        'tw.local.approvalRouteData.steps[1].status = "completed";',
        'tw.local.approvalRouteData.steps[2] = {};',
        'tw.local.approvalRouteData.steps[2].label = "上一階核准";',
        'tw.local.approvalRouteData.steps[2].sublabel = "";',
        'tw.local.approvalRouteData.steps[2].status = "current";',
        'tw.local.approvalRouteData.steps[3] = {};',
        'tw.local.approvalRouteData.steps[3].label = "最終核准執行";',
        'tw.local.approvalRouteData.steps[3].sublabel = "";',
        'tw.local.approvalRouteData.steps[3].status = "pending";',
        'tw.local.approvalRouteData.steps[4] = {};',
        'tw.local.approvalRouteData.steps[4].label = "外部簽署";',
        'tw.local.approvalRouteData.steps[4].sublabel = "";',
        'tw.local.approvalRouteData.steps[4].status = "pending";',
    ]
    # Join with CRLF, escape for JSON string embedding
    js = '\\r\\n'.join(js_lines)
    # Escape double-quotes inside the JS for JSON string value
    js = js.replace('"', '\\"')
    return '"script":{"content":["' + js + '"]}'


def _build_coachflow_script_xml() -> str:
    """
    Return the <ns16:script>...</ns16:script> content for the coachflow block.
    BAW actually executes THIS version at runtime (not the jsonData copy).
    Newlines must be encoded as &#xD;&#xA; (CRLF in XML).
    Double-quotes are safe as literal " in XML text content.
    """
    lines = [
        'tw.local.contractTitle = "2026 年度軟體維護服務合約";',
        'tw.local.approvalProgressData = {};',
        'tw.local.approvalProgressData.currentStageIndex = 1;',
        'tw.local.approvalProgressData.ctaLabel = "已完成 → 外部簽署 →";',
        'tw.local.approvalProgressData.ctaAction = "proceed_to_external_signing";',
        'tw.local.approvalProgressData.stages = [];',
        'tw.local.approvalProgressData.stages[0] = {};',
        'tw.local.approvalProgressData.stages[0].index = 0;',
        'tw.local.approvalProgressData.stages[0].label = "起草送件";',
        'tw.local.approvalProgressData.stages[0].status = "completed";',
        'tw.local.approvalProgressData.stages[1] = {};',
        'tw.local.approvalProgressData.stages[1].index = 1;',
        'tw.local.approvalProgressData.stages[1].label = "簽核路由";',
        'tw.local.approvalProgressData.stages[1].status = "current";',
        'tw.local.approvalProgressData.stages[2] = {};',
        'tw.local.approvalProgressData.stages[2].index = 2;',
        'tw.local.approvalProgressData.stages[2].label = "外部簽署";',
        'tw.local.approvalProgressData.stages[2].status = "pending";',
        'tw.local.approvalProgressData.stages[3] = {};',
        'tw.local.approvalProgressData.stages[3].index = 3;',
        'tw.local.approvalProgressData.stages[3].label = "完成歸檔";',
        'tw.local.approvalProgressData.stages[3].status = "pending";',
        'tw.local.approvalChainData = {};',
        'tw.local.approvalChainData.title = "串簽流程（3 層）";',
        'tw.local.approvalChainData.routeType = "串簽";',
        'tw.local.approvalChainData.totalLayers = 3;',
        'tw.local.approvalChainData.approvers = [];',
        'tw.local.approvalChainData.approvers[0] = {};',
        'tw.local.approvalChainData.approvers[0].name = "王志明";',
        'tw.local.approvalChainData.approvers[0].avatarInitial = "王";',
        'tw.local.approvalChainData.approvers[0].role = "直屬主管";',
        'tw.local.approvalChainData.approvers[0].department = "採購部門";',
        'tw.local.approvalChainData.approvers[0].status = "approved";',
        'tw.local.approvalChainData.approvers[0].layer = 1;',
        'tw.local.approvalChainData.approvers[1] = {};',
        'tw.local.approvalChainData.approvers[1].name = "李雅婷";',
        'tw.local.approvalChainData.approvers[1].avatarInitial = "李";',
        'tw.local.approvalChainData.approvers[1].role = "上一層主管";',
        'tw.local.approvalChainData.approvers[1].department = "採購總監";',
        'tw.local.approvalChainData.approvers[1].status = "current";',
        'tw.local.approvalChainData.approvers[1].layer = 2;',
        'tw.local.approvalChainData.approvers[2] = {};',
        'tw.local.approvalChainData.approvers[2].name = "張文豪";',
        'tw.local.approvalChainData.approvers[2].avatarInitial = "張";',
        'tw.local.approvalChainData.approvers[2].role = "最終核准";',
        'tw.local.approvalChainData.approvers[2].department = "副總經理";',
        'tw.local.approvalChainData.approvers[2].status = "pending";',
        'tw.local.approvalChainData.approvers[2].layer = 3;',
        'tw.local.processStatusData = {};',
        'tw.local.processStatusData.routeType = "串簽 Sequential";',
        'tw.local.processStatusData.submittedAt = "2026-07-14 09:32";',
        'tw.local.processStatusData.estimatedCompletion = "2026-07-16";',
        'tw.local.processStatusData.aiScore = 82;',
        'tw.local.processStatusData.aiMaxScore = 100;',
        'tw.local.processStatusData.aiSuggestionLabel = "建議修改";',
        'tw.local.processStatusData.aiSuggestionAction = "view_ai_report";',
        'tw.local.approverActionData = {};',
        'tw.local.approverActionData.approverName = "待我審核";',
        'tw.local.approverActionData.currentLayer = 2;',
        'tw.local.approverActionData.totalLayers = 3;',
        'tw.local.approverActionData.contextMessage = "您目前為本案第 2 層審核人，請確認合約條款並做出決策。";',
        'tw.local.approverActionData.comment = "";',
        'tw.local.approverActionData.decision = "";',
        'tw.local.approverActionData.actions = [];',
        'tw.local.approverActionData.actions[0] = {};',
        'tw.local.approverActionData.actions[0].label = "退回";',
        'tw.local.approverActionData.actions[0].actionKey = "return";',
        'tw.local.approverActionData.actions[0].style = "danger";',
        'tw.local.approverActionData.actions[0].enabled = true;',
        'tw.local.approverActionData.actions[1] = {};',
        'tw.local.approverActionData.actions[1].label = "轉派";',
        'tw.local.approverActionData.actions[1].actionKey = "delegate";',
        'tw.local.approverActionData.actions[1].style = "secondary";',
        'tw.local.approverActionData.actions[1].enabled = true;',
        'tw.local.approverActionData.actions[2] = {};',
        'tw.local.approverActionData.actions[2].label = "核准";',
        'tw.local.approverActionData.actions[2].actionKey = "approve";',
        'tw.local.approverActionData.actions[2].style = "primary";',
        'tw.local.approverActionData.actions[2].enabled = true;',
        'tw.local.auditLogData = {};',
        'tw.local.auditLogData.events = [];',
        'tw.local.auditLogData.events[0] = {};',
        'tw.local.auditLogData.events[0].timestamp = "07-14 09:32";',
        'tw.local.auditLogData.events[0].actor = "陳大明";',
        'tw.local.auditLogData.events[0].action = "送審";',
        'tw.local.auditLogData.events[0].detail = "陳大明送審，附 AI 報告";',
        'tw.local.auditLogData.events[0].isHighlighted = false;',
        'tw.local.auditLogData.events[1] = {};',
        'tw.local.auditLogData.events[1].timestamp = "07-14 11:05";',
        'tw.local.auditLogData.events[1].actor = "王志明";',
        'tw.local.auditLogData.events[1].action = "核准";',
        'tw.local.auditLogData.events[1].detail = "王志明核准 — 「條款無誤，同意送上級」";',
        'tw.local.auditLogData.events[1].isHighlighted = true;',
        'tw.local.auditLogData.events[2] = {};',
        'tw.local.auditLogData.events[2].timestamp = "07-14 11:05";',
        'tw.local.auditLogData.events[2].actor = "系統";',
        'tw.local.auditLogData.events[2].action = "通知";',
        'tw.local.auditLogData.events[2].detail = "系統通知李雅婷待審";',
        'tw.local.auditLogData.events[2].isHighlighted = false;',
        'tw.local.approvalRouteData = {};',
        'tw.local.approvalRouteData.steps = [];',
        'tw.local.approvalRouteData.steps[0] = {};',
        'tw.local.approvalRouteData.steps[0].label = "申請人送審";',
        'tw.local.approvalRouteData.steps[0].sublabel = "";',
        'tw.local.approvalRouteData.steps[0].status = "completed";',
        'tw.local.approvalRouteData.steps[1] = {};',
        'tw.local.approvalRouteData.steps[1].label = "直屬主管核准";',
        'tw.local.approvalRouteData.steps[1].sublabel = "";',
        'tw.local.approvalRouteData.steps[1].status = "completed";',
        'tw.local.approvalRouteData.steps[2] = {};',
        'tw.local.approvalRouteData.steps[2].label = "上一階核准";',
        'tw.local.approvalRouteData.steps[2].sublabel = "";',
        'tw.local.approvalRouteData.steps[2].status = "current";',
        'tw.local.approvalRouteData.steps[3] = {};',
        'tw.local.approvalRouteData.steps[3].label = "最終核准執行";',
        'tw.local.approvalRouteData.steps[3].sublabel = "";',
        'tw.local.approvalRouteData.steps[3].status = "pending";',
        'tw.local.approvalRouteData.steps[4] = {};',
        'tw.local.approvalRouteData.steps[4].label = "外部簽署";',
        'tw.local.approvalRouteData.steps[4].sublabel = "";',
        'tw.local.approvalRouteData.steps[4].status = "pending";',
    ]
    return '<ns16:script>' + '&#xD;\n'.join(lines) + '</ns16:script>'


# Variable metadata: (pvId suffix, varName, description, seq, classId, hasDefault, defaultValue)
_VAR_META = [
    # pvId-suffix               name                     description                                          seq  hasDefault  default
    ("ca01bb01-cc01-dd01-ee01-ff0100000000", "contractTitle",        "合約標題，顯示於進度條下方",                  0,   True,  "2026 年度軟體維護服務合約"),
    ("aa01bb01-cc01-dd01-ee01-ff0100000001", "approvalProgressData", "Approval stage progress bar",              1,   False, None),
    ("aa01bb01-cc01-dd01-ee01-ff0100000003", "processStatusData",    "Process status metadata",                  2,   False, None),
    ("aa01bb01-cc01-dd01-ee01-ff0100000005", "approvalChainData",    "Approval chain approvers",                 3,   False, None),
    ("aa01bb01-cc01-dd01-ee01-ff0100000007", "approvalRouteData",    "Approval route flow steps",                4,   False, None),
    ("aa01bb01-cc01-dd01-ee01-ff0100000009", "approverActionData",   "Approver action panel",                    5,   False, None),
    ("aa01bb01-cc01-dd01-ee01-ff010000000b", "auditLogData",         "Audit trail timeline",                     6,   False, None),
]


def _build_process_variables(proc_id: str) -> str:
    """Build the seven 簽核 process variable XML blocks.

    classId uses the actual CW BO type IDs (not 'ANY') so BAW resolves types
    correctly. Format: <container-uuid>/<type-object-id>  (standard BAW pattern).
    For String (contractTitle): use the BAW system String type ID directly.
    """
    blocks = []
    for guid_raw, varname, desc, seq, has_default, default_val in _VAR_META:
        type_id = CW_BO[varname]
        # String type uses the system ID directly; CW BO types are prefixed with container UUID
        if type_id == SYS_STRING_ID:
            class_id = f"/{type_id}"
        else:
            class_id = f"{CW_PROJ_UUID}/{type_id}"

        if has_default:
            default_xml = f"            <defaultValue>{default_val}</defaultValue>"
        else:
            default_xml = '            <defaultValue isNull="true" />'

        blocks.append(f"""        <processVariable name="{varname}">
            <lastModified isNull="true" />
            <lastModifiedBy isNull="true" />
            <tenantId isNull="true" />
            <processVariableId>2056.{guid_raw}</processVariableId>
            <description>{desc}</description>
            <processId>{proc_id}</processId>
            <namespace>2</namespace>
            <seq>{seq}</seq>
            <isArrayOf>false</isArrayOf>
            <isTransient>false</isTransient>
            <classId>{class_id}</classId>
            <hasDefault>{"true" if has_default else "false"}</hasDefault>
{default_xml}
            <guid>guid:{guid_raw}</guid>
            <versionId>{guid_raw[:-1]}1</versionId>
        </processVariable>""")
    return "\n".join(blocks)


def _build_coachflow_dataobjects() -> str:
    """
    Build <ns16:dataObject> declarations for all 7 process variables.

    These go in the coachflow XML right before <ns16:scriptTask>.
    BAW Designer reads these declarations to populate the Variables tab.
    Without them the Variables tab appears empty even if processVariable
    XML blocks exist in the outer object structure.

    itemSubjectRef format: "itm.<type-object-id>"  (strips leading slash,
    strips container-prefix — only the 12.xxx part).
    """
    indent = "                            "
    lines = []
    for guid_raw, varname, _, _, _, _ in _VAR_META:
        type_id = CW_BO[varname]
        # Strip to just the 12.xxx portion for itemSubjectRef
        item_ref = f"itm.{type_id}"
        pv_id = f"2056.{guid_raw}"
        lines.append(
            f'{indent}<ns16:dataObject itemSubjectRef="{item_ref}" '
            f'isCollection="false" name="{varname}" id="{pv_id}" />'
        )
    return "\n".join(lines)


# ── package.xml builder (fallback for fresh TWX) ──────────────────────────────

def build_package_xml(hs_vid: str) -> str:
    ts = now_iso()
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<p:package buildId="{BUILD_ID}" buildVersion="{BUILD_VERSION}" buildDescription="{esc(BUILD_DESC)}" fixPack="25010" containsECM="false" containsBPMN2="false" xmlns:p="http://lombardisoftware.com/schema/teamworks/7.0.0/package.xsd">
    <target>
        <project id="{APP_ID}" name="{esc(APP_NAME)}" description="{esc(HS_DESC)}" shortName="{APP_SHORT_NAME}" isToolkit="false" isHidden="false" isSystem="false" solutionID="" solutionServerName="" solutionPrefix="" type="" isTemplate="false" isIconSet="false" caseDisplayName=""/>
        <branch id="{BRANCH_ID}" name="Main" acronym="Main" description=""/>
        <snapshot id="{SNAPSHOT_ID}" name="{APP_VERSION}" acronym="{APP_VERSION}" originalCreationDate="{ts}" description=""/>
    </target>
    <dependencies>
        <dependency rank="2" isManaged="false" id="{CW_DEP_ID}">
            <project id="{CW_PROJECT_ID}" name="Custom Widgets" shortName="CW" isToolkit="true" isHidden="false" isSystem="false"/>
            <branch id="{CW_BRANCH_ID}" name="Main"/>
            <snapshot id="{CW_SNAPSHOT_ID}" name="1.0.125" originalCreationDate="2026-08-16T09:10:26.000Z"/>
        </dependency>
        <dependency rank="1" isManaged="false" id="{UITK_DEP_ID}">
            <project id="{UITK_PROJ_ID}" name="UI Toolkit" shortName="SYSBPMUI" isToolkit="true" isHidden="false" isSystem="true"/>
            <branch id="{UITK_BR_ID}" name="Main"/>
            <snapshot id="{UITK_SNAP_ID}" name="8.6.0.0" originalCreationDate="2017-05-24T23:23:53.574Z"/>
        </dependency>
        <dependency rank="0" isManaged="false" id="{SYSDATA_DEP_ID}">
            <project id="{SYSDATA_PROJ_ID}" name="System Data" shortName="TWSYS" isToolkit="true" isHidden="false" isSystem="true"/>
            <branch id="{SYSDATA_BR_ID}" name="Main"/>
            <snapshot id="{SYSDATA_SNAP_ID}" name="8.6.0.0_TC" originalCreationDate="2015-08-25T00:00:00.000Z"/>
        </dependency>
    </dependencies>
    <objects>
        <object id="{SETTINGS_ID}" versionId="{SETTINGS_VERSION_ID}" name="Toolkit Settings" type="projectDefaults"/>
        <object id="{HS_ID}" versionId="{hs_vid}" name="{esc(HS_NAME)}" type="process"/>
    </objects>
    <files/>
</p:package>
"""


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print(f"eContract Approval Review (簽核)  v{APP_VERSION}")
    print("=" * 70)

    Path("output").mkdir(exist_ok=True)

    # ── Load and patch CSHS template ─────────────────────────────────────────
    tmpl_path = Path(CSHS_TEMPLATE)
    if not tmpl_path.exists():
        print(f"ERROR: CSHS template not found: {CSHS_TEMPLATE}")
        return 1
    print(f"  ✓  Template: {CSHS_TEMPLATE}")

    template_xml = tmpl_path.read_text(encoding="utf-8")
    hs_xml, new_vid = patch_cshs(template_xml)

    # Verify the result is well-formed
    assert HS_ID in hs_xml,                    "Process ID not injected"
    assert HS_NAME in hs_xml,                  "Process name not injected"
    assert '<jsonData>' in hs_xml,             "jsonData missing"
    assert '<coachflow>' in hs_xml,            "coachflow missing"
    assert 'approvalProgressData' in hs_xml,   "approvalProgressData variable missing"
    assert 'processStatusData' in hs_xml,      "processStatusData variable missing"
    assert 'approvalChainData' in hs_xml,      "approvalChainData variable missing"
    assert 'approvalRouteData' in hs_xml,      "approvalRouteData variable missing"
    assert 'approverActionData' in hs_xml,     "approverActionData variable missing"
    assert 'auditLogData' in hs_xml,           "auditLogData variable missing"
    print(f"  ✓  Patched CSHS:  {HS_ID}")
    print(f"  ✓  New versionId: {new_vid}")
    print(f"  ✓  Variables:     approvalProgressData, processStatusData,")
    print(f"                    approvalChainData, approvalRouteData,")
    print(f"                    approverActionData, auditLogData")

    import io as _io
    out = Path(OUTPUT_FILE)

    # ── Inject into server-exported base TWX (only format BAW Workflow Server accepts) ─
    base_path = Path(BASE_TWX)
    CW_NEW_TWX = Path("output/Custom_Widgets_1.0.125.twx")
    OLD_CW_ZIP = "toolkits/2064.48dcd114-5561-41f1-b1a9-bff551490e51.zip"
    NEW_CW_ZIP = f"toolkits/{CW_SNAPSHOT_ID}.zip"

    if not base_path.exists():
        print(f"ERROR: Base TWX not found: {BASE_TWX}")
        return 1

    print(f"\n  Loading server base TWX: {BASE_TWX}")
    with zipfile.ZipFile(base_path) as z_in:
        existing = {n: z_in.read(n) for n in z_in.namelist()}

    # Build CW 1.0.125 toolkit zip from deployed CW TWX
    new_cw_zip_data = None
    if CW_NEW_TWX.exists():
        buf = _io.BytesIO()
        with zipfile.ZipFile(CW_NEW_TWX) as src_z, \
             zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as dst_z:
            for entry in src_z.namelist():
                if not entry.startswith("toolkits/"):
                    dst_z.writestr(entry, src_z.read(entry))
        new_cw_zip_data = buf.getvalue()
        print(f"  ✓  Built CW 1.0.125 toolkit zip ({len(new_cw_zip_data)//1024} KB)")

    NS = "http://lombardisoftware.com/schema/teamworks/7.0.0/package.xsd"
    ET.register_namespace("p", NS)
    root = ET.fromstring(existing["META-INF/package.xml"].decode())

    # 1. Update <target> — project, branch, snapshot
    target_elem = root.find(f"{{{NS}}}target") or root.find("target")
    if target_elem is not None:
        t_proj = target_elem.find(f"{{{NS}}}project") or target_elem.find("project")
        if t_proj is not None:
            t_proj.set("id",          APP_ID)
            t_proj.set("name",        APP_NAME)
            t_proj.set("shortName",   APP_SHORT_NAME)
            t_proj.set("description", HS_DESC)
            t_proj.set("isToolkit",   "false")
        t_branch = target_elem.find(f"{{{NS}}}branch") or target_elem.find("branch")
        if t_branch is not None:
            t_branch.set("id",      BRANCH_ID)
            t_branch.set("name",    "Main")
            t_branch.set("acronym", "Main")
        t_snap = target_elem.find(f"{{{NS}}}snapshot") or target_elem.find("snapshot")
        if t_snap is not None:
            t_snap.set("id",      SNAPSHOT_ID)
            t_snap.set("name",    APP_VERSION)
            t_snap.set("acronym", APP_VERSION)
            t_snap.set("originalCreationDate", now_iso())

    # 2. Replace ECS CSHS + settings objects in <objects>
    ECS_HS_ID       = "1.5de5c687-c6a6-46c8-8487-d0ed66de4aa2"
    ECS_SETTINGS_ID = "63.d1e2f3a4-b5c6-7890-def0-1234567890ab"
    for obj in root.iter():
        tag_local = obj.tag.split("}")[-1] if "}" in obj.tag else obj.tag
        if tag_local != "object":
            continue
        oid   = obj.get("id", "")
        oname = obj.get("name", "")
        if oid in (HS_ID, ECS_HS_ID):
            obj.set("id", HS_ID); obj.set("versionId", new_vid)
            obj.set("name", HS_NAME); obj.set("type", "process")
        elif oname == "Toolkit Settings" or oid == ECS_SETTINGS_ID:
            obj.set("id", SETTINGS_ID); obj.set("versionId", SETTINGS_VERSION_ID)

    # 3. Update CW dep snapshot in <dependencies>
    for dep in root.iter():
        tag_local = dep.tag.split("}")[-1] if "}" in dep.tag else dep.tag
        if tag_local != "dependency":
            continue
        proj = dep.find(f"{{{NS}}}project") or dep.find("project")
        snap = dep.find(f"{{{NS}}}snapshot") or dep.find("snapshot")
        if proj is None or snap is None:
            continue
        pid = proj.get("id", "")
        if pid == CW_PROJECT_ID:
            snap.set("id", CW_SNAPSHOT_ID); snap.set("name", "1.0.125")

    # 4. Update toolkit zip ref
    for tk in root.iter():
        tag_local = tk.tag.split("}")[-1] if "}" in tk.tag else tk.tag
        if tag_local == "toolkit":
            if "48dcd114-5561-41f1-b1a9-bff551490e51" in tk.get("ref", ""):
                tk.set("ref", NEW_CW_ZIP)

    pkg = ET.tostring(root, encoding="unicode", xml_declaration=True)

    # Build unique ECA settings XML
    # Patch the ECS settings XML to get ECA-unique IDs while keeping all required
    # fields (defaultTheme, targetEnvironment, etc.) that Workflow Center needs.
    ecs_settings_raw = existing[f"objects/{ECS_SETTINGS_ID}.xml"].decode("utf-8")
    eca_settings_xml = (ecs_settings_raw
        .replace(f'id="{ECS_SETTINGS_ID}"',        f'id="{SETTINGS_ID}"')
        .replace(f'<projectDefaultsId>{ECS_SETTINGS_ID}</projectDefaultsId>',
                 f'<projectDefaultsId>{SETTINGS_ID}</projectDefaultsId>')
        .replace(f'<guid>guid:{ECS_SETTINGS_ID.split(".",1)[1]}</guid>',
                 f'<guid>guid:{SETTINGS_ID.split(".",1)[1]}</guid>')
        .replace(f'<versionId>e2f3a4b5-c6d7-8901-ef01-23456789abcd</versionId>',
                 f'<versionId>{SETTINGS_VERSION_ID}</versionId>')
    )
    settings_ts = now_ms()
    import re as _re
    eca_settings_xml = _re.sub(
        r'<lastModified>\d+</lastModified>',
        f'<lastModified>{settings_ts}</lastModified>',
        eca_settings_xml, count=1
    )

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z_out:
        for name, data in existing.items():
            if name == "META-INF/package.xml":
                z_out.writestr(name, pkg.encode())
            elif name == f"objects/{ECS_HS_ID}.xml":
                z_out.writestr(f"objects/{HS_ID}.xml", hs_xml.encode("utf-8"))
            elif name == f"objects/{HS_ID}.xml":
                pass  # already written above
            elif name == f"objects/{ECS_SETTINGS_ID}.xml":
                z_out.writestr(f"objects/{SETTINGS_ID}.xml", eca_settings_xml.encode("utf-8"))
            elif name == OLD_CW_ZIP and new_cw_zip_data is not None:
                z_out.writestr(NEW_CW_ZIP, new_cw_zip_data)
                print(f"  ✓  Replaced CW toolkit zip: old → 1.0.125")
            else:
                z_out.writestr(name, data)

    print(f"  ✓  Injected into base TWX — ECA CSHS + unique settings")
    print(f"  ✓  ECA project ID: {APP_ID}")
    print(f"  ✓  ECA settings ID: {SETTINGS_ID}")

    size_kb = out.stat().st_size / 1024
    print(f"\n{'=' * 70}")
    print(f"✅  {out}  ({size_kb:.1f} KB)")
    print(f"    App:      {APP_NAME}  ({APP_SHORT_NAME})")
    print(f"    Version:  {APP_VERSION}")
    print(f"    CSHS ID:  {HS_ID}")
    print(f"    CW dep:   1.0.125  ({CW_SNAPSHOT_ID})")
    print(f"    Snapshot: {SNAPSHOT_ID}")
    print(f"{'=' * 70}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
