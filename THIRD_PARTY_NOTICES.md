# Third-party notices

Cemaris is a Python/React port of Sunrise CMS at commit
`451ce034863b16502484367044f3e9b65370111a` (1.0.0-beta.21).

Sunrise CMS: Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
The upstream MIT license is preserved without modification in
[licenses/Sunrise-LICENSE.md](licenses/Sunrise-LICENSE.md).
The React shell follows the layout of Sunrise's `views/_header.ejs` and
`views/login.ejs`. Source mappings are maintained in `docs/portierung/UMFANG.md`.
The database schema, initial catalog values, shared date/search helpers and
the copied reference probes also derive from this MIT-licensed source. Their
module headers identify the fixed source commit; the license applies to these
derived portions as well.

The login, permission, user/settings workflows and the eight English/German
translation catalogs also derive from that frozen Sunrise source. Authentication
and login abuse adapters were compared with the exact packages in its lockfile:

- `@cityssm/authentication-helper` 1.0.0: [MIT notice](licenses/authentication-helper-LICENSE.md).
- `@cityssm/ad-web-auth-connector` 1.2.0: [MIT notice](licenses/ad-web-auth-connector-LICENSE.md).
- `@cityssm/activedirectory-authenticate` 2.0.0: [MIT notice](licenses/activedirectory-authenticate-LICENSE.md).
- `@cityssm/express-abuse-points` 4.0.0: [MIT notice](licenses/express-abuse-points-LICENSE.txt).
- `i18next` 26.4.5: [MIT notice](licenses/i18next-LICENSE.txt).
- `i18next-http-middleware` 3.9.9: [MIT notice](licenses/i18next-http-middleware-LICENSE.txt).
- `@cityssm/bulma-webapp-js` 2.0.0-beta.2: [MIT notice](licenses/bulma-webapp-js-LICENSE.md); the locked browser form serializer was executed for the catalog port.
- `@cityssm/utils-datetime` 1.4.1: [MIT notice](licenses/utils-datetime-LICENSE.md); the locked date/time helpers were executed and their behaviour translated for comments and audit dialogs.

The catalog views, fields, ordering, print assignments and fee administration
also derive from the frozen Sunrise source. They are implemented in
`backend/cemaris/catalogs.py` and `frontend/src/catalogs.tsx`; their reference
probes execute the original database modules without installing Sunrise.

The cemetery and burial site forms, searches, related-record displays, comments,
record audit dialogs and database workflows also derive from the frozen Sunrise
source. They are reimplemented in `cemeteries.py`, `burial_sites.py`,
`places_audit.py` and `frontend/src/places.tsx`.

The geographic tools derive from the same Sunrise map/GPS/range handlers,
views and browser helpers. `backend/cemaris/geography.py` reimplements the
locked `@cityssm/fill-block-range` 0.3.0 behaviour. Find-a-Grave URL and name
helpers in `backend/cemaris/findagrave.py` and its first-name data derive from
`@cityssm/cemetery-utils` 0.3.0 and `parse-full-name` 1.2.7; their preserved
notices are [cemetery-utils](licenses/cemetery-utils-LICENSE.md) and
[parse-full-name](licenses/parse-full-name-LICENSE.md). The latter records the
actual tarball license declaration and attribution; it does not invent a
missing upstream license text. Exact lockfile archive integrity is checked by
`scripts/reference_geography.mjs` before executing the reference packages.
The translated block-range rules also retain the original
[fill-block-range MIT notice](licenses/fill-block-range-LICENSE.md) and
[fill-range MIT notice](licenses/fill-range-LICENSE.txt).

The React maps bundle the same `leaflet` 2.0.0-alpha.1 as Sunrise. Its BSD
license is copied from the installed fixed package to `/licenses/leaflet-LICENSE.txt`
in every web build. OpenStreetMap attribution remains visible on maps.

Standalone interment/service forms, CRUD, age calculation and their audit
workflows also derive from the frozen Sunrise source, implemented in
`backend/cemaris/contract_items.py` and `frontend/src/contracts.tsx`.
The purchaser relationship suggestions retain the exact `cemetery-utils`
list and notice above. The step-08 oracle executes the locked
`@cityssm/object-difference` 0.1.0; its
[MIT notice](licenses/object-difference-LICENSE.md) is preserved, including
both upstream copyright holders. No new Node package becomes an API runtime
dependency.

Contract fee/transaction calculations, grouped additions, quantity/payment
forms and audit workflows also derive from the frozen Sunrise source. They
are implemented in `backend/cemaris/contract_finance.py` and
`frontend/src/contract-finance.tsx`. The step-09 oracle executes the original
fee/transaction bodies and browser renderers with the same locked
`utils-datetime` and `object-difference` packages and preserved notices above.

Work-order CRUD, milestones, workday/month calendars and the iCalendar export
also derive from the frozen Sunrise source. The Python calendar serializer
reproduces the locked `ical-generator` 11.1.2 formatting and escaping; its
[MIT notice](licenses/ical-generator-LICENSE.txt) is preserved. The Node package
is only executed by the comparison probe and is not an API runtime dependency.

The preceding protocol and behavioural adaptations are implemented in Python.
ConsignO Cloud signing and the ntfy lifecycle notifications translate the fixed
`@cityssm/consigno-cloud-api` 1.2.0 and `@cityssm/ntfy-publish` 1.1.1 packages.
Their [ConsignO API MIT notice](licenses/consigno-cloud-api-LICENSE.md) and
[ntfy MIT notice](licenses/ntfy-publish-LICENSE.md) are preserved. The packages
are executed only by the reference probes; their HTTP adapters run in Python.
The optional GP/Diamond SQL adapter translates the locked
`@cityssm/dynamics-gp` 1.7.1 package; its original
[MIT notice](licenses/Dynamics-GP-LICENSE.md) is retained. Portal protocol
constants/payloads follow `sunrise-cms-shared` 0.0.11 and the frozen Sunrise
MIT sources; both carry the preserved [Sunrise MIT notice](licenses/Sunrise-LICENSE.md). These packages execute only in comparison probes; the application
uses Python SQL/HTTP adapters.
All notices above are included in the API image. Python's `ldap3` and `pyasn1` retain their installed
package notices and the versions recorded in `backend/uv.lock`.

Attachment naming and metadata workflows derive from the same Sunrise source.
The Python filename sanitizer translates `sanitize-filename` 1.6.4; its
[dual license and authors](licenses/sanitize-filename-LICENSE.md) are preserved.
The multipart filename adapter translates the locked `multer` 2.4.0 rules;
its [MIT notice](licenses/multer-LICENSE.txt) is retained. The source parser
is executed only by the comparison probe; target multipart parsing uses the
locked Python `python-multipart` package with its installed notices.

The document templates, print CSS, report-data protocol and contract helpers
also derive from the frozen Sunrise source. `backend/printing-runtime` retains
EJS and the original JavaScript date/configuration/barcode helper packages to
support administrator-installed EJS and `index.js` customizations. It has its
own `package-lock.json`; the API image installs the locked packages and their
license files. This narrowly scoped rendering runtime is separate from the
Python business implementation. The source `pdf-puppeteer` lifecycle is
replaced by a configured installed browser and `puppeteer-core`; browser
downloads are explicit installation tasks. Print-specific package notices and
a version/integrity manifest are retained under
`backend/printing-runtime/licenses/` and copied with the runtime into the API
image. The translated filename sanitizer notice is in `licenses/`.
The original PDF lifecycle/options and customization interface are examined
by executable probes; their upstream notices are preserved as
[pdf-puppeteer](licenses/pdf-puppeteer-LICENSE.txt) and
[sunrise-cms-customizations](licenses/sunrise-cms-customizations-LICENSE.md).

The CSV report registry, dashboard/update-log flows, navigation and historical
UNIX CSV import processors also derive from the frozen Sunrise source (MIT).
They are implemented in Python and React. CSV serialization reproduces the
locked Papa Parse 5.7.0 defaults; the package is executed only as a comparison
oracle, with its original license retained in the downloaded test archive.
Python's standard-library csv/argparse replace the historical CSV/CLI runtime.
The unfinished original Find-a-Grave importer remains validation-only.

Operational administration, cleanup statements, audit filters/purge rules and
backup scheduling in step 15 are also derived from the frozen Sunrise source.
Python's native SQL Server COPY_ONLY/CHECKSUM and restore helpers replace the
SQLite file backup. `@cityssm/configurator` 0.2.0 and `@cityssm/scheduled-task`
0.3.0 are executed only as locked comparison oracles under `.local`; their
runtime behavior is translated to Python settings and the backup worker.
The Windows-service/Node cluster runtime is replaced by the documented
Uvicorn/Compose operating model. No node-windows runtime is distributed.

The supplied Cemaris Logo.png and Cemaris Icon.png are project branding assets
provided by the project owner, copied unchanged to `frontend/public/branding/`.
They are not Sunrise assets. No additional license for these assets is asserted.

Python and npm dependencies retain their own licenses. Their exact versions,
download locations and integrity hashes are recorded in `backend/uv.lock`,
`backend/printing-runtime/package-lock.json` and `frontend/package-lock.json`.
They are installed with their package notices in
the API and web-build environments; no upstream attribution is replaced by the
Cemaris product name.
