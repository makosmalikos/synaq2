Question illustration sources
=============================
Run from repository root. Generated SVGs are checked in; the website needs no Python dependencies.

1. python3 scripts/figures/geometry.py
2. python3 scripts/figures/logic.py
3. python3 scripts/figures/details.py
4. python3 scripts/figures/trace_complex.py
5. python3 scripts/figures/refinements.py

Step 4 requires Pillow, numpy, opencv-python-headless and vtracer.
Step 5 deliberately replaces nine traced drafts with constructed geometry.
asset-map.json records 114 original-to-vector replacements. The previously rebuilt
bil_v1_q14.svg and its bil-half answer cards are separate.

Most diagrams are constructed from geometric primitives. Complex silhouettes,
folding puzzles, matching illustrations and the geographical map retain the source
linework as SVG paths. They are not all manually reconstructed. Originals remain
in public/figures as reference; the active bank references the new SVGs.

When editing, compare the visual givens and answer order with the original.
Never infer missing details from a cropped source or change the answer key to
match a new drawing. The tests validate asset safety/existence, not mathematical
fidelity; visual review is required.
