import React, { useMemo } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

function PackageNode({ data }) {
  const statusColors = {
    safe: "#22c55e",
    outdated: "#f59e0b",
    vulnerable: "#ef4444",
  };

  const color = statusColors[data.status] || "#64748b";

  return (
    <div
      style={{
        minWidth: "190px",
        padding: "15px",
        borderRadius: "12px",
        background: "#151c2c",
        border: `1px solid ${color}`,
        color: "#ffffff",
        boxShadow: `0 0 15px ${color}20`,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            background: color,
          }}
        />

        <strong style={{ fontSize: "13px" }}>
          {data.name}
        </strong>
      </div>

      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
        Version: {data.version || "Not specified"}
      </div>

      <div
        style={{
          marginTop: "10px",
          display: "inline-block",
          padding: "4px 9px",
          borderRadius: "20px",
          background: `${color}20`,
          color,
          fontSize: "10px",
          fontWeight: "600",
          textTransform: "uppercase",
        }}
      >
        {data.status}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ProjectNode({ data }) {
  return (
    <div
      style={{
        padding: "18px 25px",
        background: "#312e81",
        border: "1px solid #818cf8",
        borderRadius: "14px",
        color: "white",
        textAlign: "center",
        minWidth: "190px",
        boxShadow: "0 0 25px #6366f130",
      }}
    >
      <Handle type="source" position={Position.Bottom} />

      <div style={{ fontSize: "20px", marginBottom: "6px" }}>
        📦
      </div>

      <strong>{data.label}</strong>

      <div
        style={{
          fontSize: "11px",
          color: "#c7d2fe",
          marginTop: "5px",
        }}
      >
        Dependency Root
      </div>
    </div>
  );
}

const nodeTypes = {
  packageNode: PackageNode,
  projectNode: ProjectNode,
};

function getPackageName(pkg) {
  return (
    pkg.name ||
    pkg.package_name ||
    pkg.package ||
    pkg.dependency ||
    "Unknown package"
  );
}

function getPackageVersion(pkg) {
  return (
    pkg.version ||
    pkg.current_version ||
    pkg.required_version ||
    pkg.installed_version ||
    ""
  );
}

function getPackageStatus(pkg) {
  const vulnerabilities =
    Number(pkg.vulnerability_count || pkg.total_vulnerabilities || 0);

  const risk = String(
    pkg.risk_level || pkg.severity || pkg.status || ""
  ).toLowerCase();

  if (
    vulnerabilities > 0 ||
    pkg.is_vulnerable === true ||
    risk.includes("critical") ||
    risk.includes("high") ||
    risk.includes("vulnerable")
  ) {
    return "vulnerable";
  }

  if (
    pkg.is_outdated === true ||
    pkg.outdated === true ||
    risk.includes("outdated")
  ) {
    return "outdated";
  }

  return "safe";
}

export default function DependencyGraph({
  dependencies = [],
  onPackageSelect,
}) {
  const graphData = useMemo(() => {
    const packages = Array.isArray(dependencies)
      ? dependencies
      : [];

    const nodes = [
      {
        id: "project-root",
        type: "projectNode",
        position: { x: 350, y: 40 },
        data: { label: "Your Project" },
      },
    ];

    const edges = [];

    packages.forEach((pkg, index) => {
      const name = getPackageName(pkg);
      const status = getPackageStatus(pkg);

      const column = index % 3;
      const row = Math.floor(index / 3);

      const nodeId = `package-${index}`;

      nodes.push({
        id: nodeId,
        type: "packageNode",
        position: {
          x: 50 + column * 310,
          y: 240 + row * 190,
        },
        data: {
          name,
          version: getPackageVersion(pkg),
          status,
          originalPackage: pkg,
        },
      });

      edges.push({
        id: `edge-${index}`,
        source: "project-root",
        target: nodeId,
        animated: status === "vulnerable",
        style: {
          stroke:
            status === "vulnerable"
              ? "#ef4444"
              : status === "outdated"
              ? "#f59e0b"
              : "#475569",
          strokeWidth: 2,
        },
      });
    });

    return { nodes, edges };
  }, [dependencies]);

  const handleNodeClick = (_, node) => {
    if (
      node.type === "packageNode" &&
      onPackageSelect
    ) {
      onPackageSelect(node.data.originalPackage);
    }
  };

  if (!dependencies || dependencies.length === 0) {
    return (
      <div
        style={{
          padding: "50px 20px",
          textAlign: "center",
          color: "#94a3b8",
          background: "#111827",
          borderRadius: "14px",
          border: "1px solid #263244",
        }}
      >
        <div style={{ fontSize: "35px", marginBottom: "12px" }}>
          🔗
        </div>

        <h3 style={{ color: "#ffffff" }}>
          No Dependency Data Available
        </h3>

        <p style={{ fontSize: "13px" }}>
          Upload and analyze a dependency file to generate
          your dependency graph.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0b1120",
        border: "1px solid #263244",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #263244",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ color: "white", margin: 0 }}>
            Dependency Relationship Map
          </h3>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              margin: "6px 0 0",
            }}
          >
            Explore your project's analyzed packages.
          </p>
        </div>

        <div style={{ display: "flex", gap: "14px", fontSize: "11px" }}>
          <span style={{ color: "#22c55e" }}>● Safe</span>
          <span style={{ color: "#f59e0b" }}>● Outdated</span>
          <span style={{ color: "#ef4444" }}>● Vulnerable</span>
        </div>
      </div>

      <div style={{ height: "570px" }}>
        <ReactFlow
          nodes={graphData.nodes}
          edges={graphData.edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={22} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "projectNode") return "#6366f1";

              return (
                {
                  safe: "#22c55e",
                  outdated: "#f59e0b",
                  vulnerable: "#ef4444",
                }[node.data.status] || "#64748b"
              );
            }}
            maskColor="rgba(5, 10, 25, 0.75)"
          />
        </ReactFlow>
      </div>

      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #263244",
          color: "#94a3b8",
          fontSize: "11px",
        }}
      >
        {dependencies.length} packages visualized · Click a package
        to inspect its details.
      </div>
    </div>
  );
}