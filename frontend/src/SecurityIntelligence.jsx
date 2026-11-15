import React, { useMemo, useState } from "react";

import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  Bug,
  Activity,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/* ---------------------------------------
   CONSTANTS
--------------------------------------- */

const SEVERITY_COLORS = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
  Unknown: "#64748b",
};

/* ---------------------------------------
   DATA HELPERS
--------------------------------------- */

function getArray(...values) {
  return values.find(Array.isArray) || [];
}

function getSeverity(value) {
  const severity = String(value || "Unknown").toLowerCase();

  if (severity.includes("critical")) return "Critical";
  if (severity.includes("high")) return "High";
  if (severity.includes("medium")) return "Medium";
  if (severity.includes("low")) return "Low";

  return "Unknown";
}

function getPackageName(item) {
  return (
    item?.package_name ||
    item?.package ||
    item?.name ||
    item?.dependency ||
    "Unknown package"
  );
}

function getPackageVersion(item) {
  return (
    item?.version ||
    item?.current_version ||
    item?.installed_version ||
    "Unknown"
  );
}

function getVulnerabilityAnalysis(data) {
  return (
    data?.vulnerability_analysis ||
    data?.security_analysis ||
    data ||
    {}
  );
}

function getPackageResults(data) {
  return getArray(
    data?.package_results,
    data?.packages,
    data?.results
  );
}

/* ---------------------------------------
   VULNERABILITY EXTRACTION
--------------------------------------- */

function getVulnerabilities(data) {
  if (!data) return [];

  const analysis = getVulnerabilityAnalysis(data);

  const direct = getArray(analysis?.vulnerabilities);

  if (direct.length > 0) {
    return direct.map((vulnerability) => ({
      ...vulnerability,
      package:
        vulnerability.package ||
        vulnerability.package_name ||
        vulnerability.name ||
        "Unknown package",
    }));
  }

  const packages = getPackageResults(analysis);

  return packages.flatMap((pkg) => {
    const packageVulnerabilities = getArray(
      pkg?.vulnerabilities,
      pkg?.findings
    );

    return packageVulnerabilities.map((vulnerability) => ({
      ...vulnerability,

      package:
        vulnerability.package ||
        vulnerability.package_name ||
        vulnerability.name ||
        getPackageName(pkg),

      version:
        vulnerability.version ||
        pkg?.version ||
        pkg?.current_version ||
        "Unknown",
    }));
  });
}

/* ---------------------------------------
   SUMMARY HELPERS
--------------------------------------- */

function getSummary(data) {
  const analysis = getVulnerabilityAnalysis(data);

  return (
    analysis?.severity_summary ||
    analysis?.severity_counts ||
    analysis?.summary ||
    analysis?.statistics ||
    {}
  );
}

function getCount(summary, severity) {
  const lower = severity.toLowerCase();

  const value =
    summary?.[severity] ??
    summary?.[lower] ??
    summary?.[`${lower}_count`] ??
    summary?.[`${lower}_severity`] ??
    summary?.[`${lower}_vulnerabilities`];

  return Number(value) || 0;
}

function getTotalPackages(data) {
  const analysis = getVulnerabilityAnalysis(data);

  return Number(
    analysis?.total_packages ??
    analysis?.packages_checked ??
    analysis?.successfully_checked ??
    analysis?.summary?.total_packages ??
    getPackageResults(analysis).length
  ) || 0;
}

function getFailedChecks(data) {
  const analysis = getVulnerabilityAnalysis(data);

  return Number(analysis?.failed_checks || 0);
}

/* ---------------------------------------
   STAT CARD
--------------------------------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 transition hover:border-white/20">

      <div className="flex items-center justify-between">

        <p className="text-sm text-gray-400">
          {title}
        </p>

        <div
          className="rounded-xl p-2"
          style={{
            backgroundColor: `${color}20`,
            color,
          }}
        >
          <Icon size={19} />
        </div>

      </div>

      <h2 className="mt-4 text-3xl font-bold text-white">
        {value}
      </h2>

      <p className="mt-1 text-xs text-gray-500">
        {subtitle}
      </p>

    </div>
  );
}

/* ---------------------------------------
   SEVERITY BADGE
--------------------------------------- */

function SeverityBadge({ severity }) {
  const styles = {
    Critical: "bg-red-500/15 text-red-400 border-red-500/30",
    High: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    Low: "bg-green-500/15 text-green-400 border-green-500/30",
    Unknown: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[severity] || styles.Unknown
      }`}
    >
      {severity}
    </span>
  );
}

/* ---------------------------------------
   VULNERABILITY CARD
--------------------------------------- */

function VulnerabilityCard({ vulnerability }) {
  const [expanded, setExpanded] = useState(false);

  const severity = getSeverity(
    vulnerability.severity ||
    vulnerability.database_specific?.severity ||
    vulnerability.cvss_severity
  );

  const identifiers = vulnerability.identifiers || {};

  const cveIds = getArray(
    identifiers.cve_ids,
    identifiers.CVE
  );

  const ghsaIds = getArray(
    identifiers.ghsa_ids,
    identifiers.GHSA
  );

  const aliases = getArray(vulnerability.aliases);

  const allIds = [
    vulnerability.id,
    ...cveIds,
    ...ghsaIds,
    ...aliases,
  ].filter(Boolean);

  const affectedVersions = getArray(
    vulnerability.affected_versions,
    vulnerability.affected_ranges
  );

  const fixedVersions = getArray(
    vulnerability.fixed_versions,
    vulnerability.fixed_version
  );

  const references = getArray(
    vulnerability.references
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111827]">

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.03]"
      >

        <div className="flex min-w-0 items-start gap-4">

          <div className="mt-1 rounded-lg bg-red-500/10 p-2">
            <Bug size={18} className="text-red-400" />
          </div>

          <div className="min-w-0">

            <div className="mb-2 flex flex-wrap items-center gap-2">

              <span className="font-semibold text-white">
                {vulnerability.package ||
                  vulnerability.package_name ||
                  vulnerability.name ||
                  "Unknown package"}
              </span>

              <SeverityBadge severity={severity} />

            </div>

            <p className="line-clamp-2 text-sm text-gray-400">
              {vulnerability.summary ||
                vulnerability.details ||
                "No vulnerability description available."}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              ID: {vulnerability.id || "Not available"}

              {vulnerability.version
                ? ` • Version: ${vulnerability.version}`
                : ""}
            </p>

          </div>

        </div>

        {expanded ? (
          <ChevronUp className="shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="shrink-0 text-gray-400" />
        )}

      </button>

      {expanded && (

        <div className="space-y-5 border-t border-white/10 p-5">

          <div>

            <h4 className="mb-2 text-sm font-semibold text-white">
              Description
            </h4>

            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-400">
              {vulnerability.details ||
                vulnerability.summary ||
                "No additional details available."}
            </p>

          </div>

          {vulnerability.cvss_score != null && (

            <div>

              <h4 className="mb-2 text-sm font-semibold text-white">
                CVSS Score
              </h4>

              <p className="text-2xl font-bold text-white">
                {vulnerability.cvss_score}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  / 10
                </span>
              </p>

              {vulnerability.cvss_vector && (
                <p className="mt-1 break-all text-xs text-gray-500">
                  {vulnerability.cvss_vector}
                </p>
              )}

            </div>

          )}

          {allIds.length > 0 && (

            <div>

              <h4 className="mb-2 text-sm font-semibold text-white">
                Vulnerability identifiers
              </h4>

              <div className="flex flex-wrap gap-2">

                {[...new Set(allIds)].map((id) => (
                  <span
                    key={id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                  >
                    {id}
                  </span>
                ))}

              </div>

            </div>

          )}

          <div className="grid gap-4 md:grid-cols-2">

            <div>

              <h4 className="mb-2 text-sm font-semibold text-white">
                Affected versions
              </h4>

              {affectedVersions.length > 0 ? (

                <div className="flex flex-wrap gap-2">

                  {affectedVersions.map((version, index) => (
                    <span
                      key={`${version}-${index}`}
                      className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300"
                    >
                      {typeof version === "string"
                        ? version
                        : JSON.stringify(version)}
                    </span>
                  ))}

                </div>

              ) : (

                <p className="text-xs text-gray-500">
                  No affected-version information provided.
                </p>

              )}

            </div>

            <div>

              <h4 className="mb-2 text-sm font-semibold text-white">
                Fixed versions
              </h4>

              {fixedVersions.length > 0 ? (

                <div className="flex flex-wrap gap-2">

                  {fixedVersions.map((version, index) => (
                    <span
                      key={`${version}-${index}`}
                      className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300"
                    >
                      {typeof version === "string"
                        ? version
                        : JSON.stringify(version)}
                    </span>
                  ))}

                </div>

              ) : (

                <p className="text-xs text-gray-500">
                  No fixed-version information provided.
                </p>

              )}

            </div>

          </div>

          {references.length > 0 && (

            <div>

              <h4 className="mb-2 text-sm font-semibold text-white">
                References
              </h4>

              <div className="space-y-2">

                {references.map((reference, index) => {

                  const url =
                    typeof reference === "string"
                      ? reference
                      : reference?.url;

                  if (!url) return null;

                  return (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 break-all text-xs text-blue-400 hover:text-blue-300"
                    >
                      {url}

                      <ExternalLink
                        size={12}
                        className="shrink-0"
                      />

                    </a>
                  );
                })}

              </div>

            </div>

          )}

        </div>

      )}

    </div>
  );
}

/* ---------------------------------------
   MAIN SECURITY COMPONENT
--------------------------------------- */

export default function SecurityIntelligence({ data }) {

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  const analysis = useMemo(
    () => getVulnerabilityAnalysis(data),
    [data]
  );

  const vulnerabilities = useMemo(
    () => getVulnerabilities(data),
    [data]
  );

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-10 text-center">
        <ShieldAlert
          size={40}
          className="mx-auto mb-4 text-gray-500"
        />

        <p className="text-white">
          No vulnerability analysis available.
        </p>
      </div>
    );
  }

  const summary = getSummary(data);

  const totalPackages = getTotalPackages(data);

  const failedChecks = getFailedChecks(data);

  const totalVulnerabilities =
    Number(
      analysis?.total_vulnerabilities ??
      summary?.total_vulnerabilities ??
      summary?.total ??
      vulnerabilities.length
    ) || 0;

  /*
    Prefer the backend's severity summary.
    If it is unavailable, calculate counts
    directly from vulnerability records.
  */

  const calculateSeverity = (severity) => {
    const summaryCount = getCount(summary, severity);

    if (summaryCount > 0) {
      return summaryCount;
    }

    return vulnerabilities.filter((item) =>
      getSeverity(
        item.severity ||
        item.database_specific?.severity ||
        item.cvss_severity
      ) === severity
    ).length;
  };

  const critical = calculateSeverity("Critical");
  const high = calculateSeverity("High");
  const medium = calculateSeverity("Medium");
  const low = calculateSeverity("Low");
  const unknown = calculateSeverity("Unknown");

  const severityData = [
    { name: "Critical", value: critical },
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
    { name: "Unknown", value: unknown },
  ].filter((item) => item.value > 0);

  const filteredVulnerabilities = vulnerabilities.filter(
    (vulnerability) => {

      const severity = getSeverity(
        vulnerability.severity ||
        vulnerability.database_specific?.severity ||
        vulnerability.cvss_severity
      );

      const packageName =
        vulnerability.package ||
        vulnerability.package_name ||
        vulnerability.name ||
        "";

      const description =
        vulnerability.summary ||
        vulnerability.details ||
        "";

      const matchesSearch =
        `${packageName} ${description} ${vulnerability.id || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesSeverity =
        severityFilter === "All" ||
        severity === severityFilter;

      return matchesSearch && matchesSeverity;
    }
  );

  const packageResults = getPackageResults(analysis);

  return (

    <section className="mt-8 space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>

          <div className="mb-2 flex items-center gap-3">

            <div className="rounded-xl bg-red-500/10 p-3">
              <ShieldAlert
                size={24}
                className="text-red-400"
              />
            </div>

            <div>

              <h2 className="text-2xl font-bold text-white">
                Security Intelligence
              </h2>

              <p className="text-sm text-gray-400">
                Dependency vulnerability analysis
              </p>

            </div>

          </div>

        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs text-green-400">
          <Activity size={15} />
          OSV vulnerability scan
        </div>

      </div>

      {/* STATUS BANNER */}

      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

        <Info
          size={19}
          className="mt-0.5 shrink-0 text-blue-400"
        />

        <div>

          <p className="text-sm font-semibold text-blue-300">
            Vulnerability analysis completed
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-400">
            Dependencies were checked against available
            vulnerability information from the OSV database.
            A result with no matching vulnerability does not
            guarantee that a package is completely secure.
          </p>

        </div>

      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total vulnerabilities"
          value={totalVulnerabilities}
          subtitle="Findings detected"
          icon={Bug}
          color="#ef4444"
        />

        <StatCard
          title="Packages checked"
          value={totalPackages}
          subtitle="Dependencies analyzed"
          icon={Package}
          color="#3b82f6"
        />

        <StatCard
          title="High severity"
          value={high + critical}
          subtitle="Critical and high findings"
          icon={ShieldAlert}
          color="#f97316"
        />

        <StatCard
          title="Failed checks"
          value={failedChecks}
          subtitle="Packages requiring review"
          icon={AlertTriangle}
          color="#eab308"
        />

      </div>

      {/* SEVERITY DISTRIBUTION */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">

          <h3 className="mb-1 text-lg font-semibold text-white">
            Severity Distribution
          </h3>

          <p className="text-xs text-gray-500">
            Vulnerabilities grouped by severity
          </p>

          {severityData.length > 0 ? (

            <>

              <div className="mt-4 h-56">

                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >

                      {severityData.map((item) => (
                        <Cell
                          key={item.name}
                          fill={SEVERITY_COLORS[item.name]}
                        />
                      ))}

                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "10px",
                        color: "#fff",
                      }}
                    />

                  </PieChart>

                </ResponsiveContainer>

              </div>

              <div className="space-y-3">

                {severityData.map((item) => (

                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >

                    <div className="flex items-center gap-2">

                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            SEVERITY_COLORS[item.name],
                        }}
                      />

                      <span className="text-sm text-gray-400">
                        {item.name}
                      </span>

                    </div>

                    <span className="text-sm font-semibold text-white">
                      {item.value}
                    </span>

                  </div>

                ))}

              </div>

            </>

          ) : (

            <div className="flex h-56 flex-col items-center justify-center text-center">

              <ShieldCheck
                size={40}
                className="mb-3 text-green-400"
              />

              <p className="text-sm text-gray-300">
                No vulnerabilities reported
              </p>

              <p className="mt-2 text-xs text-gray-500">
                No matching findings were returned by the scan.
              </p>

            </div>

          )}

        </div>

        {/* SEVERITY CARDS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {[
            {
              name: "Critical",
              count: critical,
              description: "Immediate attention required",
            },
            {
              name: "High",
              count: high,
              description: "High-priority security issues",
            },
            {
              name: "Medium",
              count: medium,
              description: "Should be reviewed",
            },
            {
              name: "Low",
              count: low,
              description: "Lower-priority findings",
            },
          ].map((item) => (

            <div
              key={item.name}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111827] p-5"
            >

              <div className="flex items-center justify-between">

                <span className="text-sm text-gray-400">
                  {item.name}
                </span>

                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      SEVERITY_COLORS[item.name],
                  }}
                />

              </div>

              <div>

                <p className="mt-4 text-3xl font-bold text-white">
                  {item.count}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {item.description}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* PACKAGE SECURITY STATUS */}

      {packageResults.length > 0 && (

        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">

          <div className="mb-5 flex items-center gap-3">

            <Package
              size={20}
              className="text-blue-400"
            />

            <div>

              <h3 className="font-semibold text-white">
                Package Security Status
              </h3>

              <p className="text-xs text-gray-500">
                Individual dependency scan results
              </p>

            </div>

          </div>

          <div className="space-y-3">

            {packageResults.map((item, index) => {

              const count = getArray(
                item.vulnerabilities,
                item.findings
              ).length;

              const failed =
                item.status === "error" ||
                item.status === "failed";

              return (

                <div
                  key={`${getPackageName(item)}-${index}`}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center"
                >

                  <div className="flex items-center gap-3">

                    {failed ? (

                      <XCircle
                        size={19}
                        className="text-red-400"
                      />

                    ) : count > 0 ? (

                      <ShieldAlert
                        size={19}
                        className="text-orange-400"
                      />

                    ) : (

                      <CheckCircle2
                        size={19}
                        className="text-green-400"
                      />

                    )}

                    <div>

                      <p className="text-sm font-semibold text-white">
                        {getPackageName(item)}
                      </p>

                      <p className="text-xs text-gray-500">
                        Version: {getPackageVersion(item)}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    <span className="text-xs text-gray-400">
                      {failed
                        ? "Check failed"
                        : `${count} vulnerabilities`}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        failed
                          ? "bg-red-500/10 text-red-400"
                          : count > 0
                          ? "bg-orange-500/10 text-orange-400"
                          : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {failed
                        ? "Failed"
                        : count > 0
                        ? "At risk"
                        : "No matches"}
                    </span>

                  </div>

                </div>

              );
            })}

          </div>

        </div>

      )}

      {/* VULNERABILITY EXPLORER */}

      <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">

        <div className="mb-5">

          <h3 className="text-lg font-semibold text-white">
            Vulnerability Explorer
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Search and investigate detected vulnerabilities
          </p>

        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search package, CVE or description..."
              className="w-full rounded-xl border border-white/10 bg-[#0b1120] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
            />

          </div>

          <select
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >

            <option value="All">All severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Unknown">Unknown</option>

          </select>

        </div>

        <div className="space-y-3">

          {filteredVulnerabilities.length > 0 ? (

            filteredVulnerabilities.map((vulnerability, index) => (

              <VulnerabilityCard
                key={`${vulnerability.id || "vulnerability"}-${index}`}
                vulnerability={vulnerability}
              />

            ))

          ) : (

            <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">

              <ShieldCheck
                size={38}
                className="mx-auto mb-3 text-gray-500"
              />

              <p className="text-sm font-medium text-gray-300">
                No matching vulnerabilities found
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Try changing your search or severity filter.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* DISCLAIMER */}

      <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">

        <Info
          size={18}
          className="mt-0.5 shrink-0 text-yellow-400"
        />

        <p className="text-xs leading-5 text-gray-400">
          Security findings are based on available vulnerability
          database information. Always verify affected versions,
          review official advisories, and test upgrades before
          deploying changes to production.
        </p>

      </div>

    </section>

  );
}