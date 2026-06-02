#!/usr/bin/env node
/**
 * BPMN extraction pipeline.
 *
 * Reads every .bpmn file in ../diagrams (the source of truth for all process
 * logic) and emits, per diagram, a normalized graph JSON under
 * src/lib/bpmn/derived/<id>.graph.json containing:
 *   - lanes:  [{ id, name, role }]            (role = lane name, the actor)
 *   - nodes:  [{ id, type, name, lane, documentation }]
 *   - flows:  [{ id, from, to, guard }]       (guard = sequenceFlow @name, the
 *                                              guard expression in near-code form)
 *
 * Also emits an index (index.json) and a flat catalog (catalog.json) of every
 * node and guard across all diagrams, which downstream tooling (coverage,
 * content-audit, state-machine cross-check) consumes.
 *
 * This script is the mechanical bridge from the diagrams to the codebase. It
 * does not invent anything; it only normalizes what the BPMN already encodes.
 */
import { XMLParser } from "fast-xml-parser";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIAGRAMS_DIR = resolve(__dirname, "../../diagrams");
const OUT_DIR = resolve(__dirname, "../src/lib/bpmn/derived");

const NODE_TYPES = new Set([
  "task",
  "userTask",
  "serviceTask",
  "sendTask",
  "receiveTask",
  "businessRuleTask",
  "manualTask",
  "scriptTask",
  "exclusiveGateway",
  "parallelGateway",
  "inclusiveGateway",
  "eventBasedGateway",
  "startEvent",
  "endEvent",
  "intermediateCatchEvent",
  "intermediateThrowEvent",
  "boundaryEvent",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  // keep text content of <documentation>
  textNodeName: "#text",
  isArray: (name) =>
    [
      "lane",
      "flowNodeRef",
      "sequenceFlow",
      "task",
      "userTask",
      "serviceTask",
      "sendTask",
      "receiveTask",
      "businessRuleTask",
      "manualTask",
      "scriptTask",
      "exclusiveGateway",
      "parallelGateway",
      "inclusiveGateway",
      "eventBasedGateway",
      "startEvent",
      "endEvent",
      "intermediateCatchEvent",
      "intermediateThrowEvent",
      "boundaryEvent",
      "textAnnotation",
      "association",
    ].includes(name),
});

function asArray(x) {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

function getDocumentation(node) {
  const doc = node.documentation;
  if (!doc) return "";
  if (typeof doc === "string") return doc.trim();
  if (Array.isArray(doc)) {
    return doc
      .map((d) => (typeof d === "string" ? d : d["#text"] || ""))
      .join("\n")
      .trim();
  }
  if (typeof doc === "object") return (doc["#text"] || "").trim();
  return "";
}

function extractProcess(proc) {
  // Lane membership: flowNodeRef -> lane name
  const laneOfNode = {};
  const lanes = [];
  const laneSet = proc.laneSet;
  const rawLanes = laneSet ? asArray(laneSet.lane) : [];
  for (const lane of rawLanes) {
    const id = lane["@_id"];
    const name = lane["@_name"] || id;
    lanes.push({ id, name, role: name });
    for (const ref of asArray(lane.flowNodeRef)) {
      const nodeId = typeof ref === "string" ? ref : ref["#text"];
      if (nodeId) laneOfNode[nodeId] = name;
    }
  }

  // Nodes
  const nodes = [];
  for (const type of NODE_TYPES) {
    for (const el of asArray(proc[type])) {
      const id = el["@_id"];
      if (!id) continue;
      nodes.push({
        id,
        type,
        name: el["@_name"] || "",
        lane: laneOfNode[id] || null,
        documentation: getDocumentation(el),
      });
    }
  }

  // Flows (guard = name)
  const flows = [];
  for (const sf of asArray(proc.sequenceFlow)) {
    flows.push({
      id: sf["@_id"],
      from: sf["@_sourceRef"],
      to: sf["@_targetRef"],
      guard: (sf["@_name"] || "").trim(),
    });
  }

  return { lanes, nodes, flows };
}

function main() {
  if (!existsSync(DIAGRAMS_DIR)) {
    console.error(`[bpmn-extract] diagrams dir not found: ${DIAGRAMS_DIR}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(DIAGRAMS_DIR)
    .filter((f) => f.endsWith(".bpmn"))
    .sort();

  const index = [];
  const catalog = { nodes: [], guards: [] };
  let totalNodes = 0;
  let totalFlows = 0;
  let totalGuards = 0;

  for (const file of files) {
    const id = file.replace(/\.bpmn$/, "");
    const xml = readFileSync(join(DIAGRAMS_DIR, file), "utf8");
    const doc = parser.parse(xml);

    // process may be under definitions.process or definitions.collaboration->process
    const defs = doc.definitions || doc;
    const procs = asArray(defs.process);
    if (procs.length === 0) {
      console.warn(`[bpmn-extract] no process in ${file}`);
      continue;
    }
    // Most diagrams have a single process; merge if multiple.
    let merged = { lanes: [], nodes: [], flows: [] };
    let collabName = "";
    const collab = defs.collaboration;
    if (collab) {
      const participant = asArray(collab.participant)[0];
      collabName = participant ? participant["@_name"] || "" : "";
    }
    for (const proc of procs) {
      const r = extractProcess(proc);
      merged.lanes.push(...r.lanes);
      merged.nodes.push(...r.nodes);
      merged.flows.push(...r.flows);
    }

    const graph = {
      id,
      file,
      name: collabName || id,
      lanes: merged.lanes,
      nodes: merged.nodes,
      flows: merged.flows,
    };

    writeFileSync(
      join(OUT_DIR, `${id}.graph.json`),
      JSON.stringify(graph, null, 2) + "\n",
    );

    const guarded = merged.flows.filter((f) => f.guard);
    totalNodes += merged.nodes.length;
    totalFlows += merged.flows.length;
    totalGuards += guarded.length;

    index.push({
      id,
      name: graph.name,
      lanes: merged.lanes.map((l) => l.name),
      nodeCount: merged.nodes.length,
      flowCount: merged.flows.length,
      guardCount: guarded.length,
    });

    for (const n of merged.nodes) {
      catalog.nodes.push({ diagram: id, id: n.id, type: n.type, name: n.name, lane: n.lane });
    }
    for (const g of guarded) {
      catalog.guards.push({ diagram: id, id: g.id, from: g.from, to: g.to, guard: g.guard });
    }
  }

  writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
  writeFileSync(join(OUT_DIR, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

  console.log(`[bpmn-extract] ${files.length} diagrams -> ${OUT_DIR}`);
  console.log(`[bpmn-extract] ${totalNodes} nodes, ${totalFlows} flows, ${totalGuards} guarded flows`);
  // Sanity: all lanes (roles) seen
  const allRoles = new Set();
  for (const e of index) e.lanes.forEach((l) => allRoles.add(l));
  console.log(`[bpmn-extract] ${allRoles.size} distinct lane/roles: ${[...allRoles].sort().join(", ")}`);
}

main();
