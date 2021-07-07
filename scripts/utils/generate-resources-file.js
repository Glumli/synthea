const { readdirSync, statSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const getVariableName = (path) =>
  path
    .split("/")
    [path.split("/").length - 1].split(/-|\./)
    .slice(0, -1)
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join("")
    .replace("'", "");

function getDirectories(path) {
  return readdirSync(path).filter(function (file) {
    return statSync(path + "/" + file).isDirectory();
  });
}

function getFiles(dirname) {
  let files = [];
  readdirSync(dirname).forEach((dirContent) => {
    const contentPath = resolve(dirname, dirContent);
    const contentStat = statSync(contentPath);
    if (contentStat.isDirectory()) {
      const dirFiles = getFiles(`${dirname}/${dirContent}`);
      files = [...files, ...dirFiles];
    } else {
      files.push(contentPath);
    }
  });
  return files;
}

function generateResourcesFile(inputDir, outputFile) {
  let files = getFiles(inputDir);
  files = files.filter((file) => {
    return getVariableName(file) !== "TestResources";
  });
  let code = "";
  files.forEach((file) => {
    const variableName = getVariableName(file);
    code = `${code}import ${variableName} from "./${file.split("/").pop()}";\n`;
  });
  code = `${code}\nexport default {\n`;
  files.forEach((file) => {
    const variableName = getVariableName(file);
    code = `${code}  ${variableName},\n`;
  });
  code = `${code}};\n`;

  writeFileSync(outputFile, code);
}

function generateCohortsFile(inputDir, cohorts) {
  code = "";
  cohorts.forEach((cohort) => {
    code = `${code}import ${cohort} from "./${cohort}/testPatients";\n`;
    generateCohortFile(inputDir, cohort);
  });
  code = `${code}\nexport default {\n`;
  cohorts.forEach((cohort) => {
    code = `${code}  ${cohort},\n`;
  });
  code = `${code}};\n`;

  writeFileSync(`${inputDir}/testCohorts.ts`, code);
}

function generateCohortFile(inputDir, cohort) {
  const patientDirs = getDirectories(`${inputDir}/${cohort}`);
  let code = "";
  patientDirs.forEach((dir) => {
    code = `${code}import ${getVariableName(
      dir
    )} from "./${dir}/testResources";\n`;
  });
  code = `${code}\nexport default {\n`;
  patientDirs.forEach((dir) => {
    code = `${code}  ${getVariableName(dir)},\n`;
  });
  code = `${code}};\n`;

  writeFileSync(`${inputDir}/${cohort}/testPatients.ts`, code);
}

module.exports = { generateResourcesFile, getFiles, generateCohortsFile };
