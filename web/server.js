const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const pangolin = require("../utils/pangolin");
const configPath = path.join(__dirname, "../config/machines.json");
let config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const app = express();
const PORT = 3000;
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "views")));

// Serve main page
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "views/index.html"))
);

// Get full config
app.get("/api/config", (req, res) => res.json(config));

// Create new project
app.post("/api/project/create", (req, res) => {
  const { machine, project, projectData } = req.body;
  if (!config.machines[machine])
    return res.status(400).json({ error: "Machine not found" });
  if (config.machines[machine].projects[project])
    return res.status(400).json({ error: "Project exists" });
  // Default fields
  projectData.commands = projectData.commands || [];
  projectData.version = projectData.version || "1.0.0";
  projectData.https = projectData.https || false;
  projectData.repo = projectData.repo || "";
  projectData.autoClone = !!projectData.autoClone;
  config.machines[machine].projects[project] = projectData;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Create directory if autoClone is enabled
  

  res.json({ success: true });
});

// Update project
app.post("/api/project/update", (req, res) => {
  const { machine, project, data } = req.body;
  if (!config.machines[machine] || !config.machines[machine].projects[project])
    return res.status(400).json({ error: "Invalid" });
  Object.assign(config.machines[machine].projects[project], data);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  res.json({ success: true });
});

// Deploy project
app.post("/api/deploy", (req, res) => {
  const { machine, project } = req.body;
  const cmd = `node ../scripts/deploy.js ${machine} ${project}`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

// Pangolin endpoints
app.get("/api/pangolin/domains", async (req, res) => {
  try {
    res.json(await pangolin.listDomains());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/pangolin/sites", async (req, res) => {
  try {
    res.json(await pangolin.listSites());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/pangolin/full-setup", async (req, res) => {
  try {
    const rs = await pangolin.fullSetup(req.body.resource, req.body.target);
    res.json(rs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
