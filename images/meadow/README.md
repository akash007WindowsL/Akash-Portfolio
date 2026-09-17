# Meadow assets

The website loads these files directly from this folder:

- `background.jpg` — high-resolution 6264 × 2688 static landscape
- `cloud-top.png`, `cloud-1.png`, `cloud-3.png` — cropped animated cloud layers
- `left.png`, `middle.png`, `right.png` — cropped foreground flower layers
- `depth-left.png`, `depth-middle.png`, `depth-right.png` — cropped depth flower layers

The `source` folder contains the nine original transparent PNGs used to rebuild
the cropped layers with `build-meadow.cjs`. The build no longer reads images
from the Desktop or Downloads folders.
