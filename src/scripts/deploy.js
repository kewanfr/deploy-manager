const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config/machines.json");

const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

// const noHostAuthenticityCheck = "";
const noHostAuthenticityCheck = "-o StrictHostKeyChecking=no";

const [, , target, project] = process.argv;
if (!target || !project) {
  console.error("Usage: node deploy.js <machine> <project>");
  process.exit(1);
}
const machine = cfg.machines[target];
if (!machine) {
  console.error(`Machine '${target}' not found.`);
  process.exit(1);
}
const proj = machine.projects[project];
if (!proj) {
  console.error(`Project '${project}' not found on '${target}'.`);
  process.exit(1);
}

console.log(`Deploying project '${project}' on machine '${target}'...`);


const identity = proj.sshKeyPath ? `-i ${proj.sshKeyPath}` : "";
console.log(`proj: ${proj}`);
const sshBase = `ssh ${identity} -o StrictHostKeyChecking=no -p ${machine.port} ${machine.user}@${machine.host}`;
// If autoClone and first deploy, clone repo if path doesn't exist
if (proj.autoClone && proj.repo) {
  const pathBeforeProject = proj.path.split("/").slice(0, -1).join("/");
  const createDirCmd = `${sshBase} 'mkdir -p ${pathBeforeProject}'`;
  console.log("[+] Creating directory...");
  execSync(createDirCmd, { stdio: "inherit" });
  // Check if directory exists
  const cloneCmd = `${sshBase} 'if [ ! -d "${proj.path}" ]; then git clone ${proj.repo} ${proj.path}; fi'`;
  console.log("[+] Checking/cloning repo...");
  execSync(cloneCmd, { stdio: "inherit" });
}


// const sshBase = `ssh ${noHostAuthenticityCheck} -p ${machine.port} ${machine.user}@${machine.host}`;
let cmd = `cd ${proj.path} && git pull`;
if (proj.type === "docker") {
  cmd += " && docker compose down && docker compose up -d --build";
} else {
  if (proj.commands && proj.commands.length) {
    cmd += " && " + proj.commands.join(" && ");
  }
}
console.log(`Deploying ${project}@${target}...`);
execSync(`${sshBase} '${cmd}'`, { stdio: "inherit" });
