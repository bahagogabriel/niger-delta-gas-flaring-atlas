# Niger Delta Gas-Flaring Evidence Atlas

Static Stage 05 presentation of the locked Niger Delta gas-flaring evidence. It is suitable for GitHub Pages and has no backend, API key, paid tile dependency, or Earth Engine operation.

## Run locally

From this directory:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). Loading the page from `file://` is not supported because the browser must fetch its local JSON data.

## Rebuild web data from the authoritative R2 release

The companion `build_web_data.py` script is the only transformation step. From the package root, run:

```bash
python build_web_data.py --input /path/to/ND_GF_STAGE04_R2_EDITORIAL_POLISH --out site
```

It validates locked counts and copies the supplied report/maps to `site/downloads`. It does not recalculate any scientific result or alter coordinates, classifications, volumes, priorities, or methods.

## Validate the delivered website

From the package root, run:

```bash
python qa_stage05.py
node --check site/app.js
```

The QA is self-contained. If the original Stage 04 R2 input tree is available, its preserved source checksums can additionally be checked with `python qa_stage05.py --source-root /path/to/R2/input`.

## Data and interpretation

The explorer contains all 476 inventoried source IDs: 372 confirmed nine-state onshore candidates, 70 offshore screening records, 33 spatial/source conflicts, and one other Nigerian onshore record. `s_38320` is retained at its source coordinate but is outside the nine-state display extent. Its focused view intentionally moves outside the regional frame.

Annual time series are authoritative aggregate estimates for the 372 eligible onshore candidates, with verified-state breakdowns. The supplied locked release does not provide a separate annual series for every individual site; the atlas therefore shows each site’s retained historical metrics rather than fabricating site-year charts.

Reported zero estimates remain distinct from missing information and do not prove flare elimination. Community and ecosystem values are independent, per-site contextual screening indicators. They must not be added across overlapping buffers or interpreted as measured exposure, health outcomes, mangrove damage, legal responsibility, or intervention feasibility.

## Credits

Analysis and author attribution: Gabriel Bahago Samuel. Administrative boundaries: geoBoundaries gbOpen / GRID3, CC BY 4.0. Source provenance, methods and limitations are in the downloadable final scientific report.
