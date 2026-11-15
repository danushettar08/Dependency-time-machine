import React, { useMemo, useRef, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Bug,
  CheckCircle2,
  Clock3,
  FileCode2,
  GitBranch,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
  ChevronRight,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { analyzeDependencies } from "./services/api";
import SecurityIntelligence from "./SecurityIntelligence";


const COLORS = {
  critical: "#fb7185",
  high: "#f97316",
  medium: "#eab308",
  low: "#34d399",
  safe: "#22c55e",
  accent: "#818cf8",
};

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "dependencies", label: "Dependencies", icon: Package },
  { id: "recommendations", label: "Recommendations", icon: Sparkles },
  { id: "security", label: "Vulnerability Center", icon: ShieldAlert },
  { id: "ai-report", label: "AI Intelligence", icon: Zap },
];

const activityData = [
  { day: "Mon", value: 32 },
  { day: "Tue", value: 46 },
  { day: "Wed", value: 38 },
  { day: "Thu", value: 72 },
  { day: "Fri", value: 51 },
  { day: "Sat", value: 61 },
  { day: "Sun", value: 43 },
];

const panel =
  "rounded-2xl border border-white/[0.08] bg-[#0d0f12]";


function getArray(...values) {
  return values.find(Array.isArray) || [];
}

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getSeverity(item) {
  return String(
    item?.severity ||
    item?.risk_level ||
    item?.risk ||
    item?.priority ||
    "unknown"
  ).toLowerCase();
}

function severityColor(severity) {
  if (severity.includes("critical")) return COLORS.critical;
  if (severity.includes("high")) return COLORS.high;
  if (severity.includes("medium")) return COLORS.medium;
  if (severity.includes("low")) return COLORS.low;
  return "#8b93a1";
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  return `${(bytes / 1024).toFixed(1)} KB`;
}


function extractDependencies(analysis) {
  return getArray(
    analysis?.dependency_analysis?.dependencies,
    analysis?.dependencies,
    analysis?.dependency_analysis?.packages
  );
}


function extractRisks(analysis) {
  return getArray(
    analysis?.risk_analysis?.results
  );
}


function extractRecommendations(analysis) {
  return getArray(
    analysis?.recommendation_analysis?.recommendations
  );
}


function getPackageName(item) {
  return (
    item?.name ||
    item?.package_name ||
    item?.dependency ||
    item?.package ||
    "Unknown package"
  );
}


function getPackageVersion(item) {
  return (
    item?.version ||
    item?.current_version ||
    item?.required_version ||
    item?.installed_version ||
    "Not specified"
  );
}


function StatCard({
  icon: Icon,
  label,
  value,
  description,
  color = "#818cf8",
  trend,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-6 transition-all duration-300 hover:border-white/[0.16] hover:bg-[#111419]">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: color }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#858b97]">
            {label}
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white">
            {value}
          </h2>

          <p className="mt-3 text-xs text-[#717784]">
            {description}
          </p>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border"
          style={{
            color,
            backgroundColor: `${color}12`,
            borderColor: `${color}30`,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      {trend && (
        <div className="mt-5 flex items-center gap-2 text-xs">
          <span
            className="rounded-md px-2 py-1"
            style={{
              color,
              backgroundColor: `${color}16`,
            }}
          >
            {trend}
          </span>
          <span className="text-[#6f7580]">Current analysis</span>
        </div>
      )}
    </div>
  );
}


function SeverityBadge({ severity }) {
  const color = severityColor(String(severity || "").toLowerCase());

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        color,
        backgroundColor: `${color}12`,
        borderColor: `${color}35`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {severity || "Unknown"}
    </span>
  );
}


function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#9299a8]">
        <Icon size={25} />
      </div>

      <h3 className="text-lg font-medium text-white">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-[#777e8a]">
        {description}
      </p>
    </div>
  );
}


function App() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragging, setDragging] = useState(false);


  const dependencies = useMemo(
    () => extractDependencies(analysis),
    [analysis]
  );

  const risks = useMemo(
    () => extractRisks(analysis),
    [analysis]
  );

  const recommendations = useMemo(
    () => extractRecommendations(analysis),
    [analysis]
  );


  // Vulnerability data from backend
  const vulnerabilityAnalysis = analysis?.vulnerability_analysis || {};

  const vulnerabilities = getArray(
    vulnerabilityAnalysis?.vulnerabilities
  ).map((vulnerability) => ({
    ...vulnerability,
    package_name:
      vulnerability.package ||
      vulnerability.package_name ||
      "Unknown package",
  }));


  // Dependency statistics
  const totalDependencies =
    getNumber(analysis?.dependency_analysis?.total_dependencies) ||
    dependencies.length;

  const totalVulnerabilities =
    getNumber(vulnerabilityAnalysis?.total_vulnerabilities) ||
    vulnerabilities.length;


  // Vulnerability severity summary
  const severitySummary =
    vulnerabilityAnalysis?.severity_summary || {};

  const criticalCount =
    getNumber(severitySummary.Critical) ||
    vulnerabilities.filter(
      (item) => getSeverity(item).includes("critical")
    ).length;

  const highCount =
    getNumber(severitySummary.High) ||
    vulnerabilities.filter(
      (item) => getSeverity(item).includes("high")
    ).length;

  const mediumCount =
    getNumber(severitySummary.Medium) ||
    vulnerabilities.filter(
      (item) => getSeverity(item).includes("medium")
    ).length;

  const lowCount =
    getNumber(severitySummary.Low) ||
    vulnerabilities.filter(
      (item) => getSeverity(item).includes("low")
    ).length;


  // Upgrade risk statistics
  const highRiskCount = risks.filter((item) => {
    const severity = getSeverity(item);

    return (
      severity.includes("critical") ||
      severity.includes("high")
    );
  }).length;


  // Vulnerability chart data
  const riskChartData = [
    {
      name: "Critical",
      value: criticalCount,
      color: COLORS.critical,
    },
    {
      name: "High",
      value: highCount,
      color: COLORS.high,
    },
    {
      name: "Medium",
      value: mediumCount,
      color: COLORS.medium,
    },
    {
      name: "Low",
      value: lowCount,
      color: COLORS.low,
    },
  ].filter((item) => item.value > 0);


  // Dependency search
  const filteredDependencies = dependencies.filter((item) => {
    const name = getPackageName(item).toLowerCase();
    const version = getPackageVersion(item).toLowerCase();

    return (
      name.includes(searchTerm.toLowerCase()) ||
      version.includes(searchTerm.toLowerCase())
    );
  });


  // File validation
  function validateFile(selectedFile) {
    if (!selectedFile) return false;

    const allowedExtensions = [
      ".txt",
      ".json",
      ".toml",
      ".lock",
      ".mod",
    ];

    const extension = selectedFile.name
      .slice(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError(
        "Unsupported file. Upload a .txt, .json, .toml, .lock or .mod file."
      );

      return false;
    }

    setError("");
    setFile(selectedFile);
    setAnalysis(null);
    setSelectedPackage(null);

    return true;
  }


  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    validateFile(selectedFile);

    event.target.value = "";
  }


  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();

    setDragging(true);
  }


  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragging(false);
    }
  }


  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      validateFile(droppedFile);
    }
  }


  // Analyze dependencies
  async function handleAnalyze() {
    if (!file) {
      setError("Please select a dependency file first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSelectedPackage(null);

      const result = await analyzeDependencies(file);

      setAnalysis(result);
      setActiveTab("overview");

    } catch (err) {
      console.error("Dependency analysis failed:", err);

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Analysis failed. Please check whether the backend is running."
      );

    } finally {
      setLoading(false);
    }
  }


  // Reset analysis
  function resetAnalysis() {
    setFile(null);
    setAnalysis(null);
    setError("");
    setSearchTerm("");
    setSelectedPackage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }


  // OVERVIEW PAGE
  function renderOverview() {
    if (!analysis) {
      return (
        <div className="space-y-8">

          <section className={`${panel} overflow-hidden p-8 lg:p-12`}>
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">

              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-3 py-1.5 text-xs text-indigo-300">
                  <Sparkles size={14} />
                  Intelligent dependency security
                </div>

                <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  See the future of your
                  <span className="text-indigo-400">
                    {" "}dependencies.
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-[#858b97] sm:text-base">
                  Discover outdated packages, identify security exposure,
                  and understand what could happen to your project before
                  dependency problems reach production.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">

                  <div className="flex items-center gap-2 text-xs text-[#9299a5]">
                    <ShieldCheck size={15} className="text-emerald-400" />
                    Security analysis
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#9299a5]">
                    <GitBranch size={15} className="text-indigo-400" />
                    Dependency intelligence
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#9299a5]">
                    <Zap size={15} className="text-yellow-400" />
                    AI recommendations
                  </div>

                </div>
              </div>


              <div className="relative hidden min-h-[260px] items-center justify-center lg:flex">

                <div className="absolute h-64 w-64 rounded-full border border-indigo-400/10" />
                <div className="absolute h-48 w-48 rounded-full border border-indigo-400/15" />
                <div className="absolute h-32 w-32 rounded-full border border-indigo-400/20" />

                <div className="absolute h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-indigo-300/20 bg-[#151827] shadow-[0_0_70px_rgba(99,102,241,0.15)]">
                  <Shield size={44} className="text-indigo-300" />
                </div>

                <div className="absolute right-4 top-10 rounded-xl border border-white/10 bg-[#15171c] p-3">
                  <Package size={19} className="text-indigo-300" />
                </div>

                <div className="absolute bottom-8 left-6 rounded-xl border border-white/10 bg-[#15171c] p-3">
                  <Bug size={19} className="text-rose-300" />
                </div>

              </div>

            </div>
          </section>


          {/* FILE UPLOAD */}
          <section
            className={`relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 lg:p-12 ${
              dragging
                ? "border-indigo-400 bg-indigo-500/[0.08]"
                : "border-white/[0.12] bg-[#0d0f12] hover:border-indigo-400/40"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.09),transparent_55%)]" />

            <div className="relative mx-auto max-w-3xl text-center">

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
                <Upload size={27} />
              </div>

              <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                Upload your project dependencies
              </h3>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#858b97]">
                Drag and drop your dependency file here, or browse your
                computer to begin a security analysis.
              </p>


              <div className="mx-auto mt-9 max-w-xl">

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json,.toml,.lock,.mod"
                  onChange={handleFileChange}
                  className="hidden"
                />


                {file ? (

                  <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-indigo-400/20 bg-indigo-400/[0.06] p-5 sm:flex-row">

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
                        <FileCode2 size={23} />
                      </div>

                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-medium text-white">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-[#838a97]">
                          {formatBytes(file.size)} · Ready for analysis
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() => setFile(null)}
                      className="rounded-lg p-2 text-[#9299a5] transition hover:bg-white/10 hover:text-white"
                      title="Remove file"
                    >
                      <X size={18} />
                    </button>

                  </div>

                ) : (

                  <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-9">

                    <p className="text-sm text-[#9ba1ad]">
                      {dragging
                        ? "Drop your file to upload"
                        : "Drop your file anywhere in this area"}
                    </p>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-indigo-100"
                    >
                      <Plus size={17} />
                      Browse files
                    </button>

                    <p className="text-xs text-[#646b78]">
                      Supported formats: .txt, .json, .toml, .lock and .mod
                    </p>

                  </div>

                )}


                {file && (
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {loading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Analyzing dependencies...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Analyze dependencies
                        <ArrowUpRight size={17} />
                      </>
                    )}

                  </button>
                )}

              </div>


              {error && (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-300">
                  <AlertTriangle size={17} />
                  {error}
                </div>
              )}

            </div>
          </section>


          {/* FEATURES */}
          <div className="grid gap-5 md:grid-cols-3">

            {[
              {
                icon: ShieldCheck,
                title: "Security intelligence",
                description:
                  "Identify known vulnerabilities in your project dependencies.",
                color: "#34d399",
              },
              {
                icon: GitBranch,
                title: "Version intelligence",
                description:
                  "Understand outdated packages and available updates.",
                color: "#818cf8",
              },
              {
                icon: Sparkles,
                title: "AI recommendations",
                description:
                  "Get understandable explanations and actionable suggestions.",
                color: "#eab308",
              },
            ].map((item) => (

              <div
                key={item.title}
                className={`${panel} p-6 transition hover:border-white/15`}
              >
                <item.icon
                  size={23}
                  style={{ color: item.color }}
                />

                <h3 className="mt-5 text-base font-medium text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#7d8490]">
                  {item.description}
                </p>
              </div>

            ))}

          </div>

        </div>
      );
    }


    // ANALYSIS RESULTS
    return (
      <div className="space-y-7">

        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={15} />
              Analysis completed
            </div>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              Project security overview
            </h2>

            <p className="mt-2 text-sm text-[#7d8490]">
              Analysis results for {analysis.filename || file?.name || "your project"}
            </p>
          </div>

          <button
            onClick={resetAnalysis}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            <RefreshCw size={16} />
            New analysis
          </button>

        </section>


        {/* STAT CARDS */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={Package}
            label="Total dependencies"
            value={totalDependencies}
            description="Packages detected in project"
            color="#818cf8"
          />

          <StatCard
            icon={Bug}
            label="Vulnerabilities"
            value={totalVulnerabilities}
            description="Known vulnerability matches"
            color="#fb7185"
          />

          <StatCard
            icon={ShieldAlert}
            label="High-risk packages"
            value={highRiskCount}
            description="Critical and high upgrade risk"
            color="#f97316"
          />

          <StatCard
            icon={ShieldCheck}
            label="Recommendations"
            value={recommendations.length}
            description="Suggested package improvements"
            color="#34d399"
          />

        </div>


        {/* CHARTS */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">

          <section className={`${panel} p-6 lg:p-8`}>

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <h3 className="text-lg font-semibold text-white">
                  Dependency risk activity
                </h3>

                <p className="mt-1 text-xs text-[#737a87]">
                  Illustrative weekly activity view
                </p>
              </div>

              <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#8e95a1]">
                <Clock3 className="mr-2 inline" size={13} />
                Weekly overview
              </span>

            </div>


            <div className="mt-8 h-[260px] w-full">

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart data={activityData}>

                  <defs>
                    <linearGradient
                      id="activityGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#818cf8"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
                        stopColor="#818cf8"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>


                  <CartesianGrid
                    stroke="#ffffff0b"
                    vertical={false}
                    strokeDasharray="3 5"
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#737a87", fontSize: 12 }}
                    dy={12}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#737a87", fontSize: 11 }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#171a20",
                      border: "1px solid #ffffff18",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fill="url(#activityGradient)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

            <p className="mt-3 text-[11px] text-[#666e7a]">
              Sample visualization only. It is not historical data from
              your project.
            </p>

          </section>


          {/* VULNERABILITY DISTRIBUTION */}
          <section className={`${panel} p-6 lg:p-8`}>

            <div>
              <h3 className="text-lg font-semibold text-white">
                Vulnerability distribution
              </h3>

              <p className="mt-1 text-xs text-[#737a87]">
                Findings grouped by severity
              </p>
            </div>


            {riskChartData.length ? (

              <>

                <div className="relative mt-4 h-[220px]">

                  <ResponsiveContainer width="100%" height="100%">

                    <PieChart>

                      <Pie
                        data={riskChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        stroke="none"
                      >

                        {riskChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                          />
                        ))}

                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "#171a20",
                          border: "1px solid #ffffff18",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />

                    </PieChart>

                  </ResponsiveContainer>


                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                    <span className="text-3xl font-semibold text-white">
                      {totalVulnerabilities}
                    </span>

                    <span className="mt-1 text-xs text-[#7b8290]">
                      Findings
                    </span>

                  </div>

                </div>


                <div className="space-y-3">

                  {riskChartData.map((item) => (

                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >

                      <div className="flex items-center gap-3">

                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />

                        <span className="text-[#9299a5]">
                          {item.name}
                        </span>

                      </div>

                      <span className="font-medium text-white">
                        {item.value}
                      </span>

                    </div>

                  ))}

                </div>

              </>

            ) : (

              <div className="flex h-[280px] flex-col items-center justify-center text-center">

                <ShieldCheck size={35} className="text-emerald-400" />

                <p className="mt-4 text-sm text-white">
                  No vulnerability findings
                </p>

                <p className="mt-2 text-xs text-[#727987]">
                  No matching findings were returned for this analysis.
                </p>

              </div>

            )}

          </section>

        </div>


        {/* DEPENDENCY INVENTORY */}
        <section className={`${panel} p-6 lg:p-8`}>

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <h3 className="text-lg font-semibold text-white">
                Dependency inventory
              </h3>

              <p className="mt-1 text-xs text-[#737a87]">
                Packages discovered in your uploaded project
              </p>
            </div>

            <button
              onClick={() => setActiveTab("dependencies")}
              className="flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
            >
              View all
              <ArrowUpRight size={15} />
            </button>

          </div>


          <div className="mt-6 space-y-2">

            {dependencies.slice(0, 5).map((dependency, index) => (

              <button
                key={`${getPackageName(dependency)}-${index}`}
                onClick={() => setSelectedPackage(dependency)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-left transition hover:border-white/10 hover:bg-white/[0.04]"
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-400/[0.08] text-indigo-300">
                    <Package size={18} />
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium text-white">
                      {getPackageName(dependency)}
                    </p>

                    <p className="mt-1 text-xs text-[#737a87]">
                      Version {getPackageVersion(dependency)}
                    </p>

                  </div>

                </div>

                <ChevronRight
                  size={17}
                  className="shrink-0 text-[#6f7784]"
                />

              </button>

            ))}


            {!dependencies.length && (
              <p className="py-8 text-center text-sm text-[#737a87]">
                No dependency records were returned.
              </p>
            )}

          </div>

        </section>

      </div>
    );
  }


  // DEPENDENCIES PAGE
  function renderDependencies() {
    return (
      <section className={`${panel} p-6 lg:p-8`}>

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>
            <h2 className="text-2xl font-semibold text-white">
              Dependency inventory
            </h2>

            <p className="mt-2 text-sm text-[#7d8490]">
              Explore the packages detected in your project.
            </p>
          </div>


          <div className="relative w-full sm:max-w-xs">

            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717987]"
            />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search dependencies..."
              className="w-full rounded-xl border border-white/10 bg-[#080a0d] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#626a77] focus:border-indigo-400/50"
            />

          </div>

        </div>


        {!analysis ? (

          <div className="mt-8">

            <EmptyState
              icon={Package}
              title="No dependencies to display"
              description="Upload a dependency file from the Overview page to inspect your packages."
            />

          </div>

        ) : (

          <div className="mt-7 overflow-hidden rounded-xl border border-white/[0.07]">

            <div className="hidden grid-cols-[1.5fr_1fr_0.8fr_40px] gap-4 border-b border-white/[0.07] bg-white/[0.025] px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#727987] md:grid">

              <span>Package</span>
              <span>Version</span>
              <span>Status</span>
              <span />

            </div>


            {filteredDependencies.map((dependency, index) => {

              const matchingRisk = risks.find(
                (risk) =>
                  getPackageName(risk) === getPackageName(dependency)
              );

              return (

                <button
                  key={`${getPackageName(dependency)}-${index}`}
                  onClick={() => setSelectedPackage(dependency)}
                  className="grid w-full grid-cols-1 gap-3 border-b border-white/[0.05] px-5 py-5 text-left transition last:border-0 hover:bg-white/[0.035] md:grid-cols-[1.5fr_1fr_0.8fr_40px] md:items-center md:gap-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/[0.08] text-indigo-300">
                      <Package size={17} />
                    </div>

                    <span className="text-sm font-medium text-white">
                      {getPackageName(dependency)}
                    </span>

                  </div>


                  <div className="text-xs text-[#9299a5]">

                    <span className="mr-2 text-[#626a77] md:hidden">
                      Version:
                    </span>

                    {getPackageVersion(dependency)}

                  </div>


                  <div>

                    {matchingRisk ? (

                      <SeverityBadge
                        severity={getSeverity(matchingRisk)}
                      />

                    ) : (

                      <span className="inline-flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 size={14} />
                        No risk record
                      </span>

                    )}

                  </div>


                  <ChevronRight
                    size={17}
                    className="hidden text-[#6f7784] md:block"
                  />

                </button>

              );
            })}


            {!filteredDependencies.length && (
              <div className="p-10 text-center text-sm text-[#727987]">
                No matching dependencies found.
              </div>
            )}

          </div>

        )}

      </section>
    );
  }


  // RECOMMENDATIONS PAGE
  function renderRecommendations() {
    return (
      <section className={`${panel} p-6 lg:p-8`}>

        <div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-3 py-1.5 text-xs text-indigo-300">
            <Sparkles size={14} />
            Intelligent recommendations
          </div>

          <h2 className="text-2xl font-semibold text-white">
            Upgrade recommendations
          </h2>

          <p className="mt-2 text-sm text-[#7d8490]">
            Suggested improvements based on your dependency analysis.
          </p>

        </div>


        {!analysis ? (

          <div className="mt-8">

            <EmptyState
              icon={Sparkles}
              title="Recommendations will appear here"
              description="Run a dependency analysis to receive package improvement suggestions."
            />

          </div>

        ) : recommendations.length ? (

          <div className="mt-8 space-y-4">

            {recommendations.map((item, index) => (

              <div
                key={index}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-indigo-400/20"
              >

                <div className="flex flex-wrap items-start justify-between gap-3">

                  <div>

                    <h3 className="text-base font-medium text-white">
                      {item.package ||
                        item.package_name ||
                        item.name ||
                        item.dependency ||
                        `Recommendation ${index + 1}`}
                    </h3>

                    <p className="mt-2 text-xs text-[#838a97]">

                      {item.current_version
                        ? `Current version: ${item.current_version}`
                        : ""}

                      {item.latest_version
                        ? ` · Latest: ${item.latest_version}`
                        : ""}

                    </p>

                  </div>


                  <SeverityBadge
                    severity={item.priority || item.severity || "Suggested"}
                  />

                </div>


                <p className="mt-4 text-sm leading-7 text-[#9aa1ad]">
                  {item.recommended_action ||
                    item.reason ||
                    "Review this package and evaluate an appropriate update."}
                </p>

              </div>

            ))}

          </div>

        ) : (

          <div className="mt-8">

            <EmptyState
              icon={CheckCircle2}
              title="No recommendations returned"
              description="The recommendation engine did not return any suggestions for this analysis."
            />

          </div>

        )}

      </section>
    );
  }


  // SECURITY PAGE
  function renderSecurity() {
    if (!analysis) {
      return (
        <EmptyState
          icon={ShieldAlert}
          title="Security intelligence is waiting"
          description="Upload and analyze a dependency file to explore vulnerability findings."
        />
      );
    }

    return <SecurityIntelligence data={analysis} />;
  }


  // AI REPORT PAGE
  function renderAIReport() {

    const aiReport =
      analysis?.ai_explanation?.ai_explanation ||
      analysis?.ai_analysis ||
      analysis?.ai_report ||
      analysis?.explanation ||
      (typeof analysis?.ai_explanation === "string"
        ? analysis.ai_explanation
        : "");


    return (
      <section className={`${panel} p-6 lg:p-8`}>

        <div className="mb-8">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-3 py-1.5 text-xs text-indigo-300">
            <Sparkles size={14} />
            AI-powered analysis
          </div>

          <h2 className="text-2xl font-semibold text-white">
            Dependency intelligence report
          </h2>

          <p className="mt-2 text-sm text-[#7d8490]">
            Understand your project's dependency risks in plain language.
          </p>

        </div>


        {!analysis ? (

          <EmptyState
            icon={Zap}
            title="Your AI report is not ready"
            description="Run an analysis to generate the dependency intelligence report."
          />

        ) : aiReport ? (

          <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:leading-7 prose-p:text-[#a0a6b1] prose-strong:text-white prose-li:text-[#a0a6b1] prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:text-indigo-300 prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/30">

            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiReport}
            </ReactMarkdown>

          </div>

        ) : (

          <EmptyState
            icon={Sparkles}
            title="No AI explanation was returned"
            description="The analysis completed, but no AI explanation was included in its response."
          />

        )}

      </section>
    );
  }


  const currentTab = NAVIGATION.find(
    (item) => item.id === activeTab
  );


  // MAIN APPLICATION
  return (
    <div className="min-h-screen bg-[#08090b] text-white selection:bg-indigo-500/30">

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,rgba(70,75,140,0.10),transparent_35%),radial-gradient(ellipse_at_bottom_right,rgba(50,80,130,0.06),transparent_35%)]" />


      <div className="relative z-10 flex min-h-screen">


        {/* MOBILE SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          />
        )}


        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-white/[0.07] bg-[#0b0d10] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >

          <div className="flex h-[82px] items-center justify-between border-b border-white/[0.07] px-7">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                <Activity size={20} />
              </div>

              <div>
                <h1 className="text-sm font-bold tracking-[0.16em] text-white">
                  DTM
                </h1>

                <p className="mt-0.5 text-[9px] tracking-[0.15em] text-[#747b87]">
                  DEPENDENCY TIME MACHINE
                </p>
              </div>

            </div>


            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-[#8b92a0] hover:bg-white/5 lg:hidden"
            >
              <X size={18} />
            </button>

          </div>


          <div className="px-5 pt-9">

            <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#626a77]">
              Workspace
            </p>


            <nav className="space-y-1.5">

              {NAVIGATION.map((item) => {

                const Icon = item.icon;
                const selected = activeTab === item.id;

                return (

                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm transition ${
                      selected
                        ? "border border-indigo-400/15 bg-indigo-400/[0.09] text-indigo-200"
                        : "border border-transparent text-[#858c98] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >

                    <Icon
                      size={18}
                      className={
                        selected
                          ? "text-indigo-300"
                          : "text-[#737b88] group-hover:text-white"
                      }
                    />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {selected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    )}

                  </button>

                );
              })}

            </nav>

          </div>


          {/* SIDEBAR FOOTER */}
          <div className="mt-auto p-5">

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

              <div className="flex items-center gap-2 text-xs text-[#a0a7b2]">
                <ShieldCheck size={15} className="text-emerald-400" />
                System status
              </div>

              <div className="mt-4 flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />

                <span className="text-xs text-[#8c949f]">
                  Ready for analysis
                </span>

              </div>

              <p className="mt-3 text-[10px] leading-5 text-[#626a77]">
                Intelligent dependency monitoring and security analysis.
              </p>

            </div>


            <div className="mt-5 flex items-center gap-3 border-t border-white/[0.07] pt-5">

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-400/20 bg-indigo-400/10 text-sm font-semibold text-indigo-300">
                D
              </div>

              <div>
                <p className="text-xs font-medium text-white">
                  DTM Workspace
                </p>

                <p className="mt-1 text-[10px] text-[#707784]">
                  Local project environment
                </p>
              </div>

              <Settings
                size={16}
                className="ml-auto text-[#727a87]"
              />

            </div>

          </div>

        </aside>


        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">


          {/* TOP HEADER */}
          <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between border-b border-white/[0.07] bg-[#08090b]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">

            <div className="flex items-center gap-4">

              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg border border-white/10 p-2.5 text-[#a1a8b3] transition hover:bg-white/5 lg:hidden"
              >
                <Menu size={19} />
              </button>

              <div>
                <p className="text-xs text-[#737b87]">
                  Workspace /{" "}
                  <span className="text-[#b5bbc5]">
                    {currentTab?.label || "Overview"}
                  </span>
                </p>
              </div>

            </div>


            <div className="flex items-center gap-3 sm:gap-5">

              <div className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-[#9299a5] sm:flex">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                All systems operational

              </div>

              <button
                className="rounded-lg p-2 text-[#8c94a0] transition hover:bg-white/5 hover:text-white"
                title="Notifications"
              >
                <Bell size={18} />
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-indigo-400/30 to-violet-500/20 text-xs font-semibold text-indigo-200">
                D
              </div>

            </div>

          </header>


          {/* PAGE CONTENT */}
          <div className="mx-auto w-full max-w-[1750px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">


            {/* PAGE TITLE */}
            <div className="mb-9 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">

              <div>

                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">

                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />

                  Intelligent security platform

                </p>

                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">

                  {activeTab === "overview"
                    ? "Dependency Time Machine"
                    : currentTab?.label}

                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#828995]">

                  {activeTab === "overview"
                    ? "Continuous dependency intelligence, risk visibility and vulnerability monitoring."
                    : "Explore your project's dependency security intelligence and analysis."}

                </p>

              </div>


              <div className="flex flex-wrap items-center gap-3">

                {analysis && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-2 text-xs text-emerald-300">
                    <CheckCircle2 size={14} />
                    Analysis available
                  </div>
                )}

                <button
                  onClick={() => setActiveTab("overview")}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-2.5 text-xs font-medium text-[#c2c7d0] transition hover:bg-white/[0.08]"
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </button>

              </div>

            </div>


            {/* PAGE ROUTING */}
            {activeTab === "overview" && renderOverview()}

            {activeTab === "dependencies" && renderDependencies()}

            {activeTab === "recommendations" && renderRecommendations()}

            {activeTab === "security" && renderSecurity()}

            {activeTab === "ai-report" && renderAIReport()}


            {/* FOOTER */}
            <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/[0.07] py-6 text-[11px] text-[#626a77] sm:flex-row">

              <p>
                Dependency Time Machine · Intelligent dependency security
              </p>

              <p>
                Analyze · Understand · Secure
              </p>

            </footer>

          </div>

        </main>

      </div>


      {/* PACKAGE DETAILS MODAL */}
      {selectedPackage && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPackage(null)}
        >

          <div
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111419] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
                  <Package size={22} />
                </div>

                <div>

                  <h3 className="text-lg font-semibold text-white">
                    {getPackageName(selectedPackage)}
                  </h3>

                  <p className="mt-1 text-xs text-[#7d8490]">
                    Dependency information
                  </p>

                </div>

              </div>


              <button
                onClick={() => setSelectedPackage(null)}
                className="rounded-lg p-2 text-[#858c98] transition hover:bg-white/10 hover:text-white"
              >
                <X size={19} />
              </button>

            </div>


            <div className="mt-8 space-y-4">

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

                <p className="text-xs text-[#737b87]">
                  Current version
                </p>

                <p className="mt-2 text-sm font-medium text-white">
                  {getPackageVersion(selectedPackage)}
                </p>

              </div>


              {Object.entries(selectedPackage)

                .filter(
                  ([key]) =>
                    !["name", "version", "package_name"].includes(key)
                )

                .slice(0, 8)

                .map(([key, value]) => (

                  <div
                    key={key}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
                  >

                    <p className="text-xs capitalize text-[#737b87]">
                      {key.replaceAll("_", " ")}
                    </p>

                    <p className="mt-2 break-words text-sm text-[#d0d4dc]">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>

                  </div>

                ))}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;