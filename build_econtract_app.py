#!/usr/bin/env python3
"""
Build the eContract External Signing process-application TWX.

Strategy (same as Life Insurance Demo v1.0.2 which works correctly):
  1. Start from BaseTWX/24.0.1 template's clean single-coach CSHS XML
     (1.52b15e50 — has valid <jsonData> + <coachflow> with stable IDs)
  2. Replace ONLY top-level process identity (id, name, description,
     versionId, timestamps, guid). Keep ALL internal 2025.xxx / 2027.xxx
     node IDs exactly as-is — BAW resolves them locally.
  3. Replace the single variable definition (statusCard → approvalProgressData)
  4. Inject the patched XML into the server-exported ECS base TWX so the
     server's own theme, settings, and dependency resolution are preserved.

Usage:
    python3 build_econtract_app.py
Output:
    output/eContract_External_Signing_1.0.3.twx
"""
import re
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

# ── App identity ───────────────────────────────────────────────────────────────

APP_NAME        = "eContract External Signing"
APP_SHORT_NAME  = "ECS"
APP_VERSION     = "1.0.4"

# Stable persistent IDs — same across all versions so BAW treats them as upgrades
APP_ID          = "2066.a1b2c3d4-e5f6-7890-abcd-ef1234567890"
BRANCH_ID       = "2063.b2c3d4e5-f6a7-8901-bcde-f01234567891"
SNAPSHOT_ID     = "2064.e5f6a7b8-c9d0-1234-ef01-234567890124"   # fresh per version

# Process object — stable ID so BAW upgrades it in-place
HS_ID           = "1.5de5c687-c6a6-46c8-8487-d0ed66de4aa2"
HS_NAME         = APP_NAME
HS_DESC         = "eContract 外部簽署 — DocuSign signing workflow using CW toolkit v1.0.123"

# CW toolkit dependency (deployed 2026-08-16, snapshot confirmed from server)
CW_DEP_ID       = "2069.cebc1c06-68a5-4d2e-986a-ef2b04a791c3"
CW_PROJECT_ID   = "2066.cebc1c06-68a5-4d2e-986a-aaae3072cefb"
CW_BRANCH_ID    = "2063.58d1876b-64f7-4b1a-b064-e0c97b073a8b"
CW_SNAPSHOT_ID  = "2064.48dcd114-5561-41f1-b1a9-bff551490e51"   # 1.0.123

# System toolkit dependencies
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

SETTINGS_ID         = "63.d1e2f3a4-b5c6-7890-def0-1234567890ab"
SETTINGS_VERSION_ID = "e2f3a4b5-c6d7-8901-ef01-23456789abcd"

OUTPUT_FILE    = f"output/eContract_External_Signing_{APP_VERSION}.twx"
# Always generate a fresh snapshot ID at build time so BAW never deduplicates
import uuid as _uuid
SNAPSHOT_ID    = f"2064.{_uuid.uuid4()}"
# Use the server-exported ECS TWX as the injection base (preserves theme + settings)
BASE_TWX       = "output/eContract_External_Signing_base.twx"
# Clean CSHS template from BaseTWX — has valid jsonData + coachflow
CSHS_TEMPLATE  = "templates/BaseTWX/24.0.1/objects/1.52b15e50-3ddc-426b-a7f2-d5706e43ddf7.xml"

# ── Helpers ────────────────────────────────────────────────────────────────────

def now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)

def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

def new_uuid() -> str:
    return str(uuid.uuid4())

def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

# ── CSHS patcher ───────────────────────────────────────────────────────────────

def patch_cshs(template_xml: str) -> tuple:
    """
    Patch the clean BaseTWX CSHS template for the eContract process identity.

    Rules:
      - Replace process id="1.52b15e50..." → HS_ID  (ALL occurrences)
      - Replace name="Client-side human service" → HS_NAME
      - Replace versionId (first occurrence only)
      - Replace description, lastModified, lastModifiedBy, guid
      - Keep ALL internal 2025.xxx / 2027.xxx node IDs unchanged
      - Keep <jsonData> and <coachflow> blobs unchanged (BAW needs them intact)
      - Replace the one processVariable (statusCard) with our three BO variables
    """
    orig_id   = "1.52b15e50-3ddc-426b-a7f2-d5706e43ddf7"
    orig_name = "Client-side human service"
    new_vid   = new_uuid()
    ts        = now_ms()
    new_guid  = uuid.uuid4().hex[:16]

    x = template_xml

    # 1. Replace process id everywhere (id attr, processId text, processId refs inside items)
    x = x.replace(orig_id, HS_ID)

    # 2. Replace process name attribute (on <process> element and inside coachflow)
    x = x.replace(f'name="{orig_name}"', f'name="{HS_NAME}"')

    # 3. Replace top-level versionId (first occurrence only — don't touch internal ones)
    orig_vid_m = re.search(r'<versionId>([^<]+)</versionId>', x)
    if orig_vid_m:
        x = x.replace(
            f'<versionId>{orig_vid_m.group(1)}</versionId>',
            f'<versionId>{new_vid}</versionId>',
            1
        )

    # 4. Replace metadata fields
    x = re.sub(r'<lastModified>\d+</lastModified>',
               f'<lastModified>{ts}</lastModified>', x, count=1)
    x = re.sub(r'<lastModifiedBy>[^<]+</lastModifiedBy>',
               '<lastModifiedBy>cpmanager</lastModifiedBy>', x, count=1)
    x = re.sub(r'<description isNull="true" />',
               f'<description>{esc(HS_DESC)}</description>', x, count=1)
    x = re.sub(r'<guid>guid:[^<]+</guid>',
               f'<guid>guid:{new_guid}</guid>', x, count=1)

    # 5. Replace the single processVariable block (statusCard → our three variables)
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

    return x, new_vid


def _build_process_variables(proc_id: str) -> str:
    """Build the three eContract process variable XML blocks."""
    return f"""        <processVariable name="approvalProgressData">
            <lastModified isNull="true" />
            <lastModifiedBy isNull="true" />
            <tenantId isNull="true" />
            <processVariableId>2056.3cde2995-e1b0-4fb6-8bee-a7fb225f25d1</processVariableId>
            <description>Horizontal approval stage progress bar — 起草送件→簽核路由→外部簽署(active)→完成歸檔</description>
            <processId>{proc_id}</processId>
            <namespace>2</namespace>
            <seq>1</seq>
            <isArrayOf>false</isArrayOf>
            <isTransient>false</isTransient>
            <classId>ApprovalProgressData</classId>
            <hasDefault>false</hasDefault>
            <defaultValue isNull="true" />
            <guid>guid:3cde2995-e1b0-4fb6-8bee-a7fb225f25d1</guid>
            <versionId>ffaca9c2-e43a-4f87-94a3-cfa6f30795d6</versionId>
        </processVariable>
        <processVariable name="signingProgressData">
            <lastModified isNull="true" />
            <lastModifiedBy isNull="true" />
            <tenantId isNull="true" />
            <processVariableId>2056.e6538051-c667-41c3-8d69-bae85e5d24b7</processVariableId>
            <description>Signing completion progress — 1 of 2 signers complete (50%)</description>
            <processId>{proc_id}</processId>
            <namespace>2</namespace>
            <seq>2</seq>
            <isArrayOf>false</isArrayOf>
            <isTransient>false</isTransient>
            <classId>ProgressData</classId>
            <hasDefault>false</hasDefault>
            <defaultValue isNull="true" />
            <guid>guid:e6538051-c667-41c3-8d69-bae85e5d24b7</guid>
            <versionId>cfebca3f-b446-4a73-932f-273ae1c852e8</versionId>
        </processVariable>
        <processVariable name="webhookTimelineData">
            <lastModified isNull="true" />
            <lastModifiedBy isNull="true" />
            <tenantId isNull="true" />
            <processVariableId>2056.10c9e64b-5b99-4bea-b668-403fd8efc6df</processVariableId>
            <description>DocuSign Webhook event timeline — 4 events</description>
            <processId>{proc_id}</processId>
            <namespace>2</namespace>
            <seq>3</seq>
            <isArrayOf>true</isArrayOf>
            <isTransient>false</isTransient>
            <classId>TimelineData</classId>
            <hasDefault>false</hasDefault>
            <defaultValue isNull="true" />
            <guid>guid:10c9e64b-5b99-4bea-b668-403fd8efc6df</guid>
            <versionId>deeda9ed-850f-48eb-9e2f-745839e68eb5</versionId>
        </processVariable>"""


# ── package.xml builder (for fresh TWX fallback) ──────────────────────────────

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
            <snapshot id="{CW_SNAPSHOT_ID}" name="1.0.123" originalCreationDate="2026-08-15T15:44:28.000Z"/>
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
    print(f"eContract External Signing  v{APP_VERSION}  (clean-template build)")
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
    assert HS_ID in hs_xml,               "Process ID not injected"
    assert HS_NAME in hs_xml,             "Process name not injected"
    assert '<jsonData>' in hs_xml,        "jsonData missing"
    assert '<coachflow>' in hs_xml,       "coachflow missing"
    assert 'approvalProgressData' in hs_xml, "Variables not injected"
    print(f"  ✓  Patched CSHS:  {HS_ID}")
    print(f"  ✓  New versionId: {new_vid}")
    print(f"  ✓  Variables:     approvalProgressData, signingProgressData, webhookTimelineData")

    out = Path(OUTPUT_FILE)

    # ── Preferred: inject into server-exported base TWX ──────────────────────
    base_path = Path(BASE_TWX)
    if base_path.exists():
        print(f"\n  Injecting into server base TWX: {BASE_TWX}")
        with zipfile.ZipFile(base_path) as z_in:
            existing = {n: z_in.read(n) for n in z_in.namelist()}

        # Update package.xml using XML-aware patching — never touch dependency nodes
        import xml.etree.ElementTree as ET
        NS = "http://lombardisoftware.com/schema/teamworks/7.0.0/package.xsd"
        ET.register_namespace("p", NS)

        root = ET.fromstring(existing["META-INF/package.xml"].decode())

        # 1. Update <target><snapshot> only — NOT dependency snapshots
        target_snap = root.find(f".//{{{NS}}}target/{{{NS}}}snapshot")
        if target_snap is None:
            target_snap = root.find(".//target/snapshot")
        target_snap.set("id",   SNAPSHOT_ID)
        target_snap.set("name", APP_VERSION)
        target_snap.set("acronym", APP_VERSION)
        target_snap.set("originalCreationDate", now_iso())

        # 2. Update the process object versionId in <objects>
        for obj in root.iter(f"{{{NS}}}object") or root.iter("object"):
            pass  # handled below
        for obj in list(root.iter()):
            if obj.get("id") == HS_ID:
                obj.set("versionId", new_vid)

        # 3. Restore CW dependency snapshot to the real CW snapshot ID
        #    (the base TWX may have had it correct already, but be explicit)
        for dep_snap in root.iter():
            snap_id = dep_snap.get("id", "")
            # Fix any dependency snapshot that accidentally matches the old ECS snapshot
            parent_project = None
            for elem in root.iter():
                # Find the snapshot inside the CW dependency
                if elem.get("id") == CW_SNAPSHOT_ID:
                    break
            # Ensure CW snapshot is correct
            for elem in root.iter():
                if elem.tag in (f"{{{NS}}}dependency", "dependency"):
                    proj = elem.find(f"{{{NS}}}project") or elem.find("project")
                    snap = elem.find(f"{{{NS}}}snapshot") or elem.find("snapshot")
                    if proj is not None and snap is not None:
                        pid = proj.get("id", "")
                        if pid == CW_PROJECT_ID:
                            snap.set("id",   CW_SNAPSHOT_ID)
                            snap.set("name", "1.0.123")
                        elif pid == UITK_PROJ_ID:
                            snap.set("id",   UITK_SNAP_ID)
                            snap.set("name", "8.6.0.0")
                        elif pid == SYSDATA_PROJ_ID:
                            snap.set("id",   SYSDATA_SNAP_ID)
                            snap.set("name", "8.6.0.0_TC")

        pkg = ET.tostring(root, encoding="unicode", xml_declaration=True)

        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z_out:
            for name, data in existing.items():
                if name == "META-INF/package.xml":
                    z_out.writestr(name, pkg.encode())
                elif name == f"objects/{HS_ID}.xml":
                    z_out.writestr(name, hs_xml.encode("utf-8"))
                else:
                    z_out.writestr(name, data)
        print(f"  ✓  Injected into base TWX")

    else:
        # Fallback: fresh TWX build
        print(f"\n  ⚠  Base TWX not found, building fresh TWX...")
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as twx:
            twx.writestr("META-INF/MANIFEST.MF",    "Manifest-Version: 1.0\n\n")
            twx.writestr("META-INF/metadata.xml",   '<?xml version="1.0" encoding="UTF-8"?>\n<metadata/>\n')
            twx.writestr("META-INF/package.xml",    build_package_xml(new_vid))
            twx.writestr("META-INF/properties.json", '{"twxWithoutToolkits":"false"}')
            twx.writestr(f"objects/{HS_ID}.xml",    hs_xml.encode("utf-8"))

    size_kb = out.stat().st_size / 1024
    print(f"\n{'=' * 70}")
    print(f"✅  {out}  ({size_kb:.1f} KB)")
    print(f"    App:     {APP_NAME}  ({APP_SHORT_NAME})")
    print(f"    Version: {APP_VERSION}")
    print(f"    CW dep:  1.0.123  ({CW_SNAPSHOT_ID})")
    print(f"{'=' * 70}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
