const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const configPath = path.join(__dirname, "../config/machines.json");
let config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const app = express();
const HOST = "192.168.0.151";
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "views")));

// Serve main page
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "views/index.html"))
);

// Get full config
app.get("/api/config", (req, res) => res.json(config));

app.set("trust proxy", true);

app.set("trust proxy", "loopback"); // 127.0.0.1 seulement
app.set("trust proxy", "uniquelocal"); // 127.0.0.1 + 192.168.x.x
app.set("trust proxy", "172.18.0.0/16"); // réseau docker bridge
app.set("trust proxy", 1); // 1 proxy devant (classique)

app.set("trust proxy", true); // déjà ajouté

app.use((req, res, next) => {
  console.log("--- NOUVELLE REQUÊTE ---");
  console.log("IP :", req.ip);
  console.log("X-Forwarded-For :", req.headers["x-forwarded-for"]);
  console.log("Protocole :", req.protocol);
  console.log("Host :", req.headers.host);
  console.log("Path :", req.path);
  next();
});

app.get("/debug", (req, res) => {
  res.json({
    ip: req.ip,
    forwardedFor: req.headers["x-forwarded-for"],
    protocol: req.protocol,
    host: req.headers.host,
    secure: req.secure,
  });
});


// Create new project
// app.post("/api/project/create", (req, res) => {
//   const { machine, project, projectData } = req.body;
//   if (!config.machines[machine])
//     return res.status(400).json({ error: "Machine not found" });
//   if (config.machines[machine].projects[project])
//     return res.status(400).json({ error: "Project exists" });
//   // Set defaults
//   const pd = { ...projectData };
//   pd.commands = pd.commands || [];
//   pd.version = pd.version || "1.0.0";
//   pd.https = !!pd.https;
//   pd.repo = pd.repo || "";
//   pd.autoClone = !!pd.autoClone;
//   // Pangolin config
//   pd.pangolin = pd.pangolin || {
//     siteId: null,
//     domainId: "",
//     protocol: "http",
//     port: 80,
//     enable: false,
//     subdomain: "",
//   };
//   config.machines[machine].projects[project] = pd;
//   fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
//   res.json({ success: true });
// });

app.post("/api/project/create", async (req, res) => {
  const { machine, project, projectData } = req.body;
  if (!config.machines[machine])
    return res.status(400).json({ error: "Machine not found" });
  if (config.machines[machine].projects[project])
    return res.status(400).json({ error: "Project exists" });
  // Set defaults
  const pd = { ...projectData };
  pd.commands = pd.commands || [];
  pd.version = pd.version || "1.0.0";
  pd.https = !!pd.https;
  pd.repo = pd.repo || "";
  pd.autoClone = !!pd.autoClone;
  config.machines[machine].projects[project] = pd;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  res.json({ success: true });
  ({ success: true });
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
app.post("/api/deploy", async (req, res) => {
  const { machine, project } = req.body;
  const cmd = `node ./scripts/deploy.js ${machine} ${project}`;
  console.log("[+] Deploying", machine, project, cmd);
  exec(cmd, async (err, stdout, stderr) => {
    if (err) {
      console.error("[!] Deploy error:", err);
      return res.status(500).json({ error: "Deploy error" });
    }

    console.log("[+] Deploy output:", stdout);
    if (stderr) console.error(stderr);

    res.json({ deploy: stdout });
  });
});

app.listen(PORT, HOST, () =>
  console.log(`Server running at http://${HOST}:${PORT}`)
);