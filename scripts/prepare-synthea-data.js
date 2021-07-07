const fs = require("fs");
const { generateResourcesFile } = require("./utils/generate-resources-file");
const { prepareCohorts } = require("./utils/split-bundles-to-resources");

const BASE_DIR = `${__dirname}/../output`;
const BUNDLES_DIR = `${BASE_DIR}/bundles`;
const OUTPUT_DIR = `${BASE_DIR}/resources`;
// const FILE_PATH = `${SYNTHEA_DIR}/testResources.ts`;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}
prepareCohorts(BUNDLES_DIR, OUTPUT_DIR, ["Hypertension"]);
