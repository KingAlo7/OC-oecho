# Ketcher 3.12.0 (vendored)

`standalone/` is the standalone build of **Ketcher 3.12.0** by EPAM Systems,
<https://github.com/epam/ketcher> (tag `v3.12.0`, npm `ketcher-standalone@3.12.0`),
licensed under the **Apache License 2.0**:

- [`LICENSE.txt`](LICENSE.txt) — the licence, copied verbatim from the Ketcher repository
- [`NOTICE.txt`](NOTICE.txt) — Ketcher's NOTICE file, copied verbatim
- `standalone/static/js/*.LICENSE.txt` — notices of the libraries bundled into the build
  (Indigo, Miew, Three.js, React, lodash …), as shipped by EPAM

**No file in `standalone/` has been changed.** The admin page loads it in an
iframe and configures it at runtime through `ketcher-ui.js`: Ketcher's own
`?hiddenControls=` option, a few CSS rules, and an extra toolbar button.

All third-party notices of this project are collected in
[`THIRD-PARTY-NOTICES.txt`](../../THIRD-PARTY-NOTICES.txt) and shown on the
site at `lizenzen.html`.

## Updating Ketcher

1. Replace `standalone/` with the new build, unchanged.
2. Copy `LICENSE` and `NOTICE` of the same release tag over `LICENSE.txt` and `NOTICE.txt`.
3. Update the version and the NOTICE text in `THIRD-PARTY-NOTICES.txt` and `lizenzen.html`,
   and the names of the bundle's `*.LICENSE.txt` files linked there.
4. Check that the control names in `ketcher-ui.js` still exist.
