const {
  getFiles,
  generateResourcesFile,
  generateCohortsFile,
} = require("./generate-resources-file");
const {
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  statSync,
  copyFileSync,
  rmdirSync,
} = require("fs");

function getResourcesFromBundle(bundle) {
  return bundle.entry.map((entry) => entry.resource);
}

function splitBundlesToResourcesDep(inputDir, outputDir) {
  const bundleFiles = getFiles(inputDir);
  let resources = [];
  bundleFiles.forEach((bundleFile) => {
    const bundle = JSON.parse(readFileSync(bundleFile));
    resources = [...resources, ...getResourcesFromBundle(bundle)];
  });
  resources.forEach((resource) =>
    writeFileSync(
      `${outputDir}/${resource.resourceType}${resource.id}.json`,
      JSON.stringify(resource, null, 2).replace(
        /"reference": "urn:uuid:/g,
        '"reference": "'
      )
    )
  );
}

function ensureDirectory(outDir) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir);
  }
}

function writeResource(resource, outDir) {
  const filePath = `${outDir}/${resource.resourceType}${resource.id}.json`;
  writeFileSync(
    `${outDir}/${resource.resourceType}${resource.id}.json`,
    JSON.stringify(resource, null, 2).replace(
      /"reference": "urn:uuid:/g,
      '"reference": "'
    )
  );
  return filePath;
}

function processSharedResources(bundle, outputDir) {
  const bundleInformation = {};
  const resources = getResourcesFromBundle(bundle);
  ensureDirectory(outputDir);
  resources.forEach((resource) => {
    let filePath = writeResource(resource, outputDir);
    bundleInformation[resource.id] = filePath;
  });
  return bundleInformation;
}

function prepareCohorts(inputDir, outputDir, cohorts = []) {
  rmdirSync(outputDir, { recursive: true });
  ensureDirectory(outputDir);

  const bundleFiles = getFiles(inputDir);
  let hospitalInformation, practitionerInformation;

  bundleFiles.forEach((bundleFile) => {
    const bundle = JSON.parse(readFileSync(bundleFile));
    const filename = bundleFile.split("/").pop();
    if (filename.startsWith("hospitalInformation")) {
      hospitalInformation = processSharedResources(
        bundle,
        `${outputDir}/hospitalInformation`
      );
      return;
    }
    if (filename.startsWith("practitionerInformation")) {
      practitionerInformation = processSharedResources(
        bundle,
        `${outputDir}/practitionerInformation`
      );
      return;
    }
  });

  const hospitalIds = Object.keys(hospitalInformation);
  const practitionerIds = Object.keys(practitionerInformation);

  bundleFiles.forEach((bundleFile) => {
    const filename = bundleFile.split("/").pop();
    if (
      filename.startsWith("hospitalInformation") ||
      filename.startsWith("practitionerInformation")
    ) {
      return;
    }
    const bundleString = readFileSync(bundleFile);

    console.log(`Processiong ${filename}`);

    cohorts.forEach((cohort) => {
      if (String(bundleString).search(cohort) === -1) {
        return;
      }
      console.log(`-${cohort}`);

      const bundle = JSON.parse(bundleString);
      const resources = getResourcesFromBundle(bundle);
      const cohortDir = `${outputDir}/${cohort}`;
      ensureDirectory(cohortDir);
      const patientDir = `${cohortDir}/${filename.split(".")[0]}`;
      ensureDirectory(patientDir);

      resources.forEach((resource, resourcenumber) => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          Number((resourcenumber * 100) / resources.length).toFixed(0) + "%"
        );

        writeFileSync(
          `${patientDir}/${resource.resourceType}${resource.id}.json`,
          JSON.stringify(resource, null, 2).replace(
            /"reference": "urn:uuid:/g,
            '"reference": "'
          )
        );

        hospitalIds.forEach((id) => {
          if (JSON.stringify(resource).search(id) > -1) {
            copyFileSync(
              hospitalInformation[id],
              `${patientDir}/${hospitalInformation[id].split("/").pop()}`
            );
          }
        });
        practitionerIds.forEach((id) => {
          if (JSON.stringify(resource).search(id) > -1) {
            copyFileSync(
              practitionerInformation[id],
              `${patientDir}/${practitionerInformation[id].split("/").pop()}`
            );
          }
        });
      });
      console.log();
      generateResourcesFile(patientDir, `${patientDir}/testResources.js`);
    });
  });
  generateCohortsFile(outputDir, cohorts);
}

module.exports = { prepareCohorts };
