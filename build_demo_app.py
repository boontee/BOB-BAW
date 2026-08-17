#!/usr/bin/env python3
"""
Build a standalone process-application TWX from coaches/*.xml files.

The output is a TWX with isToolkit=false that depends on the CW toolkit.
It is packaged separately from the main toolkit TWX because BAW toolkits
cannot contain Human Services (process objects with prefix 1.xxx).

KEY LESSON (learned from failed imports):
  A BAW CSHS XML requires BOTH <jsonData> (BPMN2 JSON) AND <coachflow>
  (BPMN2 XML, ~317 KB). These cannot be hand-crafted — they must come from
  a real BAW-exported CSHS. The approach taken here:
    1. Use a real exported CSHS as the structural template.
    2. Replace ONLY the top-level IDs: process id, processId, name,
       participantRef, versionId, timestamps.
    3. Keep ALL internal UUIDs (2025.xxx items, 2027.xxx links, coachflow
       node IDs) exactly as-is — BAW resolves these locally.
    4. Inject the patched XML into the server's own round-tripped TWX export
       (preserves native theme + settings objects BAW already knows).

The CSHS template source is the Hiring Sample (HSS) "Create Position Request
CSHS" — a well-formed CSHS exported from the same server.

Usage:
    python3 build_demo_app.py [--template /path/to/template_hs.xml]
Output:
    output/Life_Insurance_Demo_<version>.twx
"""
import argparse
import os
import re
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

# ── Constants ──────────────────────────────────────────────────────────────────

APP_NAME        = "Life Insurance Demo"
APP_SHORT_NAME  = "LID"
APP_DESC        = "Demo process application showcasing Custom Widgets (CW) toolkit — Life Insurance Application Human Service"
APP_VERSION     = "1.0.1"
APP_ID          = "2066.507a123f-9bfe-4cab-a586-39823d08c1e6"   # stable persistent ID
BRANCH_ID       = "2063.0bef1389-d46f-4684-ade9-a497dc2e3e24"
SNAPSHOT_ID     = "2064.271826ca-bc29-4814-981e-38af50bd71d6"

# CW toolkit dependency (must already be installed on the target server)
CW_DEP_ID       = "2069.cebc1c06-68a5-4d2e-986a-ef2b04a791c3"  # dependency relation ID
CW_PROJECT_ID   = "2066.cebc1c06-68a5-4d2e-986a-aaae3072cefb"
CW_BRANCH_ID    = "2063.58d1876b-64f7-4b1a-b064-e0c97b073a8b"
CW_SNAPSHOT_ID  = "2064.c1be0ed1-2416-4f2e-88e3-1ffc8f8be747"   # 1.0.69

# System toolkit dependencies (same as CW toolkit)
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

OUTPUT_FILE     = f"output/Life_Insurance_Demo_{APP_VERSION}.twx"
COACHES_DIR     = Path("coaches")

# ── Helpers ────────────────────────────────────────────────────────────────────

def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

def gen_version_id() -> str:
    return str(uuid.uuid4())

def escape_xml(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

# ── Coach loader ───────────────────────────────────────────────────────────────

def load_coaches():
    """Return list of (coach_id, version_id, coach_name, xml_bytes) tuples."""
    coaches = []
    for coach_file in sorted(COACHES_DIR.glob("*.xml")):
        raw = coach_file.read_text(encoding="utf-8")
        # Strip XML comments before parsing
        clean = re.sub(r"<!--.*?-->", "", raw, flags=re.DOTALL)
        root = ET.fromstring(clean)
        if root.tag == "teamworks":
            proc = root.find("process")
        else:
            proc = root if root.tag == "process" else None
        if proc is None:
            print(f"  ⚠  Skipping {coach_file.name}: no <process> element")
            continue
        coach_id   = proc.get("id", "").strip()
        coach_name = proc.get("name", coach_file.stem).strip()
        if not coach_id:
            print(f"  ⚠  Skipping {coach_file.name}: missing id attribute")
            continue
        version_id = gen_version_id()
        coaches.append((coach_id, version_id, coach_name, raw.encode("utf-8")))
        print(f"  ✓  Loaded coach: {coach_name}  ({coach_file.name})")
    return coaches

# ── Package XML ────────────────────────────────────────────────────────────────

def build_package_xml(coaches) -> str:
    ts = now_iso()
    settings_line = f'        <object id="{SETTINGS_ID}" versionId="{SETTINGS_VERSION_ID}" name="Toolkit Settings" type="projectDefaults"/>'
    coach_lines   = "\n".join(
        f'        <object id="{cid}" versionId="{vid}" name="{escape_xml(cname)}" type="process"/>'
        for cid, vid, cname, _ in coaches
    )
    object_lines  = settings_line + "\n" + coach_lines
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<p:package buildId="{BUILD_ID}" buildVersion="{BUILD_VERSION}" buildDescription="{escape_xml(BUILD_DESC)}" fixPack="25010" containsECM="false" containsBPMN2="false" xmlns:p="http://lombardisoftware.com/schema/teamworks/7.0.0/package.xsd">
    <target>
        <project id="{APP_ID}" name="{escape_xml(APP_NAME)}" description="{escape_xml(APP_DESC)}" shortName="{APP_SHORT_NAME}" isToolkit="false" isHidden="false" isSystem="false" solutionID="" solutionServerName="" solutionPrefix="" type="" isTemplate="false" isIconSet="false" caseDisplayName=""/>
        <branch id="{BRANCH_ID}" name="Main" acronym="Main" description=""/>
        <snapshot id="{SNAPSHOT_ID}" name="{APP_VERSION}" acronym="{APP_VERSION}" originalCreationDate="{ts}" description=""/>
    </target>
    <dependencies>
        <dependency rank="2" isManaged="false" id="{CW_DEP_ID}">
            <project id="{CW_PROJECT_ID}" name="Custom Widgets" shortName="CW" isToolkit="true" isHidden="false" isSystem="false"/>
            <branch id="{CW_BRANCH_ID}" name="Main"/>
            <snapshot id="{CW_SNAPSHOT_ID}" name="1.0.69" originalCreationDate="2026-08-12T15:23:22.000Z"/>
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
{object_lines}
    </objects>
    <files/>
</p:package>
"""

# ── Toolkit settings object ────────────────────────────────────────────────────

# Use a unique settings ID for this process app (different from CW toolkit's 63.xxx)
SETTINGS_ID         = "63.6fef1fbe-0597-425f-a05e-c6ad3893b894"
SETTINGS_VERSION_ID = "6bd7f738-7c2d-4817-ae77-ccf6d9c7a413"

def build_settings_xml() -> str:
    ts_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    guid_part = SETTINGS_ID.split(".")[1]
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<teamworks>
    <projectDefaults id="{SETTINGS_ID}" name="Toolkit Settings">
        <lastModified>{ts_ms}</lastModified>
        <lastModifiedBy>cpmanager</lastModifiedBy>
        <tenantId isNull="true" />
        <projectDefaultsId>{SETTINGS_ID}</projectDefaultsId>
        <description isNull="true" />
        <guid>guid:{guid_part}</guid>
        <versionId>{SETTINGS_VERSION_ID}</versionId>
        <participantRef isNull="true" />
        <defaultXslRef isNull="true" />
        <defaultCssRef isNull="true" />
        <defaultTheme>cf3f1815-aea7-43ed-ab46-f113df9c91a7/72.993e03e9-2574-40fc-807c-65b06be378fd</defaultTheme>
        <themeVersion isNull="true" />
        <defaultJsRefs isNull="true" />
        <isWbmEnabled>false</isWbmEnabled>
        <namespace isNull="true" />
        <isIidOptimized>false</isIidOptimized>
        <isQueueBypass isNull="true" />
        <templateAcronymReference isNull="true" />
        <templateSnapshotReference isNull="true" />
        <targetEnvironment>BAW_CP4A</targetEnvironment>
        <subtype isNull="true" />
        <capability isNull="true" />
        <solutionTargetStore isNull="true" />
        <appLoggingEnabled>false</appLoggingEnabled>
        <logName isNull="true" />
        <logLevel>0</logLevel>
    </projectDefaults>
</teamworks>
"""

# ── CSHS patcher ───────────────────────────────────────────────────────────────

def patch_cshs(template_xml: str, new_hs_id: str, new_hs_name: str,
               participant_id: str) -> tuple[str, str]:
    """
    Patch a real BAW-exported CSHS XML for re-import under a new identity.

    Replaces ONLY top-level identifiers — process id, processId text nodes,
    name, participantRef, versionId, timestamps, description, guid.
    All internal UUIDs (2025.xxx items, 2027.xxx links, coachflow node IDs,
    jsonData flow IDs) are kept exactly as exported so BAW resolves them
    locally without cross-reference failures.

    Returns (patched_xml, new_version_id).
    """
    ts_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    new_vid = str(uuid.uuid4())

    # Detect original process ID
    m = re.search(r'<process id="(1\.[^"]+)"', template_xml)
    if not m:
        raise ValueError("Template XML has no <process id='1.xxx'> element")
    orig_id   = m.group(1)
    orig_name = re.search(r'<process id="[^"]+" name="([^"]+)"', template_xml).group(1)

    x = template_xml
    # 1. process element attributes
    x = x.replace(f'id="{orig_id}"',    f'id="{new_hs_id}"',    1)
    x = x.replace(f'>{orig_id}<',       f'>{new_hs_id}<'        )  # all <processId> text refs
    x = x.replace(f'name="{orig_name}"', f'name="{new_hs_name}"')  # process + coachflow name attrs
    # 2. participantRef header element
    x = re.sub(r'<participantRef>[^<]+</participantRef>',
               f'<participantRef>{participant_id}</participantRef>', x, count=1)
    # 3. participantRef inside jsonData JSON
    orig_part = re.search(r'"participantRef":\["(24\.[^"]+)"\]', x)
    if orig_part:
        x = x.replace(f'"participantRef":["{orig_part.group(1)}"]',
                       f'"participantRef":["{participant_id}"]')
    # 4. participantRef inside coachflow BPMN2
    x = re.sub(r'ns2:teamRef="[^"]*"', f'ns2:teamRef="{participant_id}"', x)
    # 5. Process-level versionId (first occurrence only)
    orig_vid = re.search(r'<versionId>([^<]+)</versionId>', x)
    if orig_vid:
        x = x.replace(f'<versionId>{orig_vid.group(1)}</versionId>',
                       f'<versionId>{new_vid}</versionId>', 1)
    # 6. Metadata
    x = re.sub(r'<lastModified>\d+</lastModified>',
               f'<lastModified>{ts_ms}</lastModified>', x, count=1)
    x = re.sub(r'<lastModifiedBy>[^<]+</lastModifiedBy>',
               '<lastModifiedBy>cpmanager</lastModifiedBy>', x, count=1)
    x = re.sub(r'<description>[^<]*</description>',
               f'<description>Life Insurance Application CSHS — uses Custom Widgets: Breadcrumb, Stepper, MyProgressBar</description>',
               x, count=1)
    x = re.sub(r'<guid>guid:[^<]+</guid>',
               f'<guid>guid:{uuid.uuid4().hex[:16]}</guid>', x, count=1)
    return x, new_vid


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Build Life Insurance Demo TWX")
    parser.add_argument("--template", default=None,
        help="Path to a BAW-exported CSHS XML to use as structural template. "
             "Required on first run. Cached to templates/cshs_template.xml after first use.")
    parser.add_argument("--base-twx", default=None,
        help="Path to server-exported LID TWX to inject into (preserves native theme). "
             "If omitted, a fresh TWX is built.")
    args = parser.parse_args()

    os.chdir(Path(__file__).parent)

    print("=" * 70)
    print("Life Insurance Demo App Builder  (template-based CSHS)")
    print("=" * 70)

    Path("output").mkdir(exist_ok=True)

    # ── Locate CSHS template ──────────────────────────────────────────────────
    TEMPLATE_CACHE = Path("templates/cshs_template.xml")
    if args.template:
        template_xml = Path(args.template).read_text(encoding="utf-8")
        TEMPLATE_CACHE.parent.mkdir(exist_ok=True)
        TEMPLATE_CACHE.write_text(template_xml, encoding="utf-8")
        print(f"  Template loaded from: {args.template}")
        print(f"  Cached to: {TEMPLATE_CACHE}")
    elif TEMPLATE_CACHE.exists():
        template_xml = TEMPLATE_CACHE.read_text(encoding="utf-8")
        print(f"  Template loaded from cache: {TEMPLATE_CACHE}")
    else:
        print("ERROR: No CSHS template found.")
        print("  Export a working CSHS from BAW (e.g. Hiring Sample) and run:")
        print("    python3 build_demo_app.py --template /path/to/cshs.xml")
        return

    # ── Patch CSHS ────────────────────────────────────────────────────────────
    HS_ID   = "1.3524bf7a-e194-4651-b5bd-123c1968e5a7"
    HS_NAME = "Life Insurance Application"
    PART_ID = "24.a0b1c2d3-e4f5-6789-abcd-ef0123456789"

    print(f"\nPatching CSHS → {HS_NAME} ({HS_ID}) ...")
    hs_xml, new_vid = patch_cshs(template_xml, HS_ID, HS_NAME, PART_ID)

    # Verify
    assert hs_xml.count(HS_ID) >= 1,         "HS ID not injected"
    assert f'name="{HS_NAME}"' in hs_xml,     "HS name not injected"
    assert '<jsonData>{' in hs_xml,            "jsonData missing — template is not a CSHS"
    assert '<coachflow>' in hs_xml,            "coachflow missing — template is not a CSHS"
    print(f"  ✓ jsonData present ({hs_xml.count('<jsonData>')} occurrences)")
    print(f"  ✓ coachflow present ({len(re.findall('<coachflow>', hs_xml))} occurrences)")
    print(f"  ✓ versionId: {new_vid}")

    # ── Build TWX ─────────────────────────────────────────────────────────────
    if args.base_twx:
        # Inject into server-exported TWX (best approach — preserves native theme)
        base_path = Path(args.base_twx)
        print(f"\nInjecting into base TWX: {base_path.name} ...")
        with zipfile.ZipFile(base_path) as z_in:
            existing = {n: z_in.read(n) for n in z_in.namelist()}
            pkg_orig = existing["META-INF/package.xml"].decode()

        new_obj  = f'        <object id="{HS_ID}" versionId="{new_vid}" name="{HS_NAME}" type="process"/>'
        pkg_patched = pkg_orig.replace("</objects>", f"\n{new_obj}\n    </objects>")

        out = Path(OUTPUT_FILE)
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z_out:
            for name, data in existing.items():
                z_out.writestr(name, data if name != "META-INF/package.xml" else pkg_patched)
            z_out.writestr(f"objects/{HS_ID}.xml", hs_xml.encode("utf-8"))
    else:
        # Fresh build (no base TWX)
        coaches = [(HS_ID, new_vid, HS_NAME, hs_xml.encode("utf-8"))]
        out = Path(OUTPUT_FILE)
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as twx:
            twx.writestr("META-INF/MANIFEST.MF", "Manifest-Version: 1.0\n\n")
            twx.writestr("META-INF/metadata.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<metadata>\n</metadata>\n')
            twx.writestr("META-INF/package.xml", build_package_xml(coaches))
            twx.writestr("META-INF/properties.json", '{"twxWithoutToolkits":"false"}')
            twx.writestr(f"objects/{SETTINGS_ID}.xml", build_settings_xml())
            twx.writestr(f"objects/{HS_ID}.xml", hs_xml.encode("utf-8"))

    size_kb = out.stat().st_size / 1024
    print(f"\n✅  Package created: {out}  ({size_kb:.1f} KB)")
    print("=" * 70)

if __name__ == "__main__":
    main()
