const {
  generateResourcesFile,
  getFiles,
  getDirectories,
  generateCohortsFile,
} = require("./utils/generate-resources-file");

const RESOURCES_DIR = `${__dirname}/../output/resources`;

const COHORTS = ["Hypertension"];

COHORTS.forEach((cohort) => {
  const patients = getDirectories(`${RESOURCES_DIR}/${cohort}`);
  patients.forEach((patient) => {
    const patientDir = `${RESOURCES_DIR}/${cohort}/${patient}`;
    generateResourcesFile(patientDir, `${patientDir}/testResources.ts`);
  });
  generateCohortsFile(`${RESOURCES_DIR}`, COHORTS);
});

// generateResourcesFile(RESOURCES_DIR, FILE_PATH);
