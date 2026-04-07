from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path

content_types = """<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Types xmlns='http://schemas.openxmlformats.org/package/2006/content-types'>
  <Default Extension='rels' ContentType='application/vnd.openxmlformats-package.relationships+xml'/>
  <Default Extension='xml' ContentType='application/xml'/>
  <Override PartName='/word/document.xml' ContentType='application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'/>
  <Override PartName='/docProps/core.xml' ContentType='application/vnd.openxmlformats-package.core-properties+xml'/>
  <Override PartName='/docProps/app.xml' ContentType='application/vnd.openxmlformats-officedocument.extended-properties+xml'/>
</Types>
"""

rels = """<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'>
  <Relationship Id='rId1' Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument' Target='word/document.xml'/>
  <Relationship Id='rId2' Type='http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties' Target='docProps/core.xml'/>
  <Relationship Id='rId3' Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties' Target='docProps/app.xml'/>
</Relationships>
"""

# Management-friendly summary with the same structured headings used in engineering docs.
doc = """<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w:document xmlns:w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'>
  <w:body>
    <w:p><w:r><w:t>Versioning: v1.1, date 2026-04-07</w:t></w:r></w:p>
    <w:p><w:r><w:t>Resources and information: Node.js, TypeScript, Playwright, BullMQ, Redis.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Why?: Remove manual weekly work and achieve near-real-time lead submission.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Assumptions: Partner portal remains accessible and selectors stay mostly stable.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Decisions: Queue-first architecture, strict validation, status model, screenshot evidence.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Config setup: All secrets and runtime values are environment-based.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Migration scripts: Not required in blueprint phase; needed when persistence is introduced.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Open questions: API auth scope, selector drift governance, dead-letter queue policy.</w:t></w:r></w:p>
    <w:p><w:r><w:t>As is: Manual process, delayed processing, low traceability.</w:t></w:r></w:p>
    <w:p><w:r><w:t>To be (components and data fields): API intake, queue, worker automation, status endpoint.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Edge cases and unhappy flows: validation failures, timeouts, UI drift, credential errors.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Considered alternatives: Batch cron and synchronous submission were rejected.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Future work: Persistent storage, dead-letter handling, CI integration tests.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Security impact: Secrets management, PII-safe logs/screenshots, least-privilege access.</w:t></w:r></w:p>
    <w:sectPr/>
  </w:body>
</w:document>
"""

core = """<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<cp:coreProperties xmlns:cp='http://schemas.openxmlformats.org/package/2006/metadata/core-properties' xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:dcterms='http://purl.org/dc/terms/' xmlns:dcmitype='http://purl.org/dc/dcmitype/' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>
  <dc:title>RPA Lead Submission Management Summary</dc:title>
  <dc:creator>Codex</dc:creator>
</cp:coreProperties>
"""

app = """<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Properties xmlns='http://schemas.openxmlformats.org/officeDocument/2006/extended-properties' xmlns:vt='http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes'>
  <Application>Codex</Application>
</Properties>
"""

output = Path('docs/management-summary.docx')
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as zf:
  zf.writestr('[Content_Types].xml', content_types)
  zf.writestr('_rels/.rels', rels)
  zf.writestr('word/document.xml', doc)
  zf.writestr('docProps/core.xml', core)
  zf.writestr('docProps/app.xml', app)

print(f'Written {output}')
