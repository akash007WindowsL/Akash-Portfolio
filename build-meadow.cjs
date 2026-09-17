// Lossless transparent-padding crop for the Meadow's animated layers.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const meadowDir = path.join(__dirname, 'images', 'meadow');
const sourceDir = path.join(meadowDir, 'source');
const layers = [
  ['Left Cluster', 'left', 0, 561, 438, 260],
  ['Middle Cluster', 'middle', 375, 576, 990, 245],
  ['Right Cluster', 'right', 1354, 564, 562, 257],
  ['Left Flower Dept Cluster', 'depth-left', 44, 540, 410, 281],
  ['Middle Flower Dept Cluster', 'depth-middle', 468, 603, 589, 218],
  ['Right Flower Dept Cluster', 'depth-right', 1139, 609, 421, 212],
];
(async () => {
  fs.mkdirSync(meadowDir, { recursive: true });
  const clouds = [
    ['Cloud 1', 'cloud-1', 208, 102, 205, 79],
    ['Cloud 3', 'cloud-3', 553, 78, 173, 84],
    ['Top Cloud', 'cloud-top', 386, 0, 255, 49],
  ];
  for (const [source, name, left, top, width, height] of clouds) {
    await sharp(path.join(sourceDir, `${source}.png`))
      .extract({ left, top, width, height }).png()
      .toFile(path.join(meadowDir, `${name}.png`));
  }
  for (const [source, name, left, top, width, height] of layers) {
    await sharp(path.join(sourceDir, `${source}.png`))
      .extract({ left, top, width, height }).png()
      .toFile(path.join(meadowDir, `${name}.png`));
  }
})();
