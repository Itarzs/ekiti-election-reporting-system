import React, { useState, useEffect, useRef } from "react";
import { 
  Vote, 
  MapPin, 
  Layers, 
  Building2, 
  BarChart2, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle,
  FileSpreadsheet,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";

import { PollingUnitResult, WardSummary, LgaSummary, GlobalStats } from "./types";
import { EKITI_RAW_TUPLES, PREFILLED_VOTES_DEMO } from "./data/ekitiPUs";
import { 
  calculateWardSummaries, 
  calculateLgaSummaries, 
  calculateGlobalStats 
} from "./utils/calculations";

import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "./lib/firebase";

// Import layout components
import DashboardStats from "./components/DashboardStats";
import PollingUnitsTable from "./components/PollingUnitsTable";
import WardsTable from "./components/WardsTable";
import LgasTable from "./components/LgasTable";

type ActiveTab = "overview" | "polling-units" | "wards" | "lgas";

const getInitialCollection = (): PollingUnitResult[] => {
  return EKITI_RAW_TUPLES.map((tup, i) => {
    const demoEntry = PREFILLED_VOTES_DEMO[i];
    return {
      lga: tup[0],
      ward: tup[1],
      wardCode: tup[2],
      puName: tup[3],
      puCode: tup[4],
      registeredVoters: tup[5],
      id: `pu-seed-${i + 1}`,
      isEntered: !!demoEntry,
      accreditedVoters: demoEntry ? demoEntry.accredited : 0,
      votes: demoEntry 
        ? { APC: 0, PDP: 0, ADC: 0, LP: 0, ACCORD: 0, SDP: 0, ...demoEntry.votes } 
        : { APC: 0, PDP: 0, ADC: 0, LP: 0, ACCORD: 0, SDP: 0 },
      updatedAt: new Date().toISOString()
    } as PollingUnitResult;
  });
};

export default function App() {
  // Primary state: array of polling units
  const [puResults, setPuResults] = useState<PollingUnitResult[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const isSeedingRef = useRef(false);

  const seedFirebaseDatabase = async () => {
    if (!db) return;
    try {
      showToast("Initializing real-time database with Ekiti electoral grid. This might take a moment...");
      const initialData = getInitialCollection();
      
      // Google Firebase has a strict limit of 500 items per upload batch.
      // We chunk the 2,445 polling units into smaller batches of 400 to safely upload them all.
      const FIREBASE_BATCH_LIMIT = 400;
      const chunks = [];
      for (let i = 0; i < initialData.length; i += FIREBASE_BATCH_LIMIT) {
        chunks.push(initialData.slice(i, i + FIREBASE_BATCH_LIMIT));
      }
      
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(pu => {
          const puRef = doc(db, "pollingUnits", pu.id);
          batch.set(puRef, pu);
        });
        await batch.commit();
      }
      showToast("SUCCESS: Firebase Database completely seeded!");
    } catch(e) {
      console.error(e);
      alert("Error seeding database");
    }
  };

  // Load from local storage or pre-populate with mock data
  useEffect(() => {
    if (db) {
      const puCollection = collection(db, "pollingUnits");
      const unsubscribe = onSnapshot(puCollection, (snapshot) => {
        // If the database is empty or partially seeded (e.g. user refreshed during seed), re-seed.
        if (snapshot.size < 2444 && !isSeedingRef.current) {
          isSeedingRef.current = true;
          seedFirebaseDatabase().finally(() => {
            isSeedingRef.current = false;
          });
        } else {
          const results: PollingUnitResult[] = [];
          snapshot.forEach(doc => results.push(doc.data() as PollingUnitResult));
          setPuResults(results);
        }
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem("ekiti_election_results_2026");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const sanitized = parsed.map((pu: PollingUnitResult) => {
            const totalVotes = pu.votes.APC + pu.votes.PDP + pu.votes.ADC + pu.votes.LP + pu.votes.ACCORD + pu.votes.SDP;
            if (totalVotes === 0 && pu.isEntered) {
              return { ...pu, isEntered: false };
            }
            return pu;
          });
          setPuResults(sanitized);
        } catch (e) {
          console.error("Error loading saved election records", e);
          setPuResults(getInitialCollection());
        }
      } else {
        setPuResults(getInitialCollection());
      }
    }
  }, []);

  // Sync to local storage
  const saveResults = (newResults: PollingUnitResult[]) => {
    setPuResults(newResults);
    localStorage.setItem("ekiti_election_results_2026", JSON.stringify(newResults));
  };

  // Toast alert trigger helper
  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  // Add a new polling unit
  const handleAddPu = async (puData: Omit<PollingUnitResult, "id" | "updatedAt">) => {
    const newPu: PollingUnitResult = {
      ...puData,
      id: `pu-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    if (db) {
      await setDoc(doc(db, "pollingUnits", newPu.id), newPu);
      showToast("SUCCESS: Remote Polling Unit submitted!");
    } else {
      const updated = [newPu, ...puResults];
      saveResults(updated);
      showToast("SUCCESS: Polling Unit result submitted locally!");
    }
  };

  // Edit/Correct a polling unit
  const handleEditPu = async (id: string, updatedFields: Partial<PollingUnitResult>) => {
    if (db) {
      const puRef = doc(db, "pollingUnits", id);
      try {
        await updateDoc(puRef, {
          ...updatedFields,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      const updated = puResults.map(pu => {
        if (pu.id === id) {
          return {
            ...pu,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          };
        }
        return pu;
      });
      saveResults(updated);
    }
  };

  // Delete a polling unit
  const handleDeletePu = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, "pollingUnits", id));
      showToast("SUCCESS: Remote polling unit entry deleted.");
    } else {
      const updated = puResults.filter(pu => pu.id !== id);
      saveResults(updated);
      showToast("SUCCESS: Polling unit entry deleted locally.");
    }
  };

  // Seed default data
  const handleLoadSeed = () => {
    if (db) {
      alert("Database is connected. Seeding is managed automatically by Firebase.");
    } else {
      saveResults(getInitialCollection());
      showToast("SUCCESS: High-fidelity Ekiti 2026 Demo Set has been loaded.");
    }
  };

  // Clear all data
  const handleClearAll = () => {
    saveResults([]);
    showToast("SUCCESS: Data cleared. All summaries set to 0. Custom entries can be input.");
  };

  // Export DOC file
  const handleExportDoc = () => {
    const content = document.getElementById("tab-panels-render")?.innerHTML || "";
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Election Report</title></head><body><h1>Ekiti Election Report 2026</h1>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const downloadAnchor = document.createElement("a");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.href = source;
    downloadAnchor.download = `ekiti_election_report_${new Date().toISOString().slice(0,10)}.doc`;
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("INFO: Report exported as DOC.");
    setShowExportMenu(false);
  };

  // Export PDF file via print dialog
  const handleExportPdf = () => {
    window.print();
    showToast("INFO: Please select 'Save as PDF' in the print dialog.");
    setShowExportMenu(false);
  };

  // Derived calculations
  const wardSummaries = calculateWardSummaries(puResults);
  const lgaSummaries = calculateLgaSummaries(puResults, wardSummaries);
  const globalStats = calculateGlobalStats(puResults, lgaSummaries);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col" id="applet-primary-root">
      
      {/* Dynamic Success Alert Toast */}
      {successToast && (
        <div id="toast-success-badge" className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl animate-fade-in-up">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header operations bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 py-3 lg:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & election title */}
          <div className="flex items-center space-x-3.5">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-inner flex items-center justify-center">
              <Vote className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-650 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-white">Live Data Room</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 2026 UTC
                </span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight" id="header-brand-title">
                EKITI ELECTORAL REPORTING SYSTEM
              </h1>
              <p className="text-xs text-slate-400">Governorship Election Result Aggregator & dynamic Rollups</p>
            </div>
          </div>

          {/* Backup, Import/Export Tools */}
          <div className="flex items-center space-x-2.5 self-end md:self-auto" id="system-toolbar-actions">
            
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[11px] font-bold border border-slate-700 rounded-lg flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Report</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-slate-800">
                  <button 
                    onClick={handleExportDoc}
                    className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Export as DOC
                  </button>
                  <button 
                    onClick={handleExportPdf}
                    className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Export as PDF
                  </button>
                </div>
              )}
            </div>

            {/* Refresh calculation status */}
            <button
              onClick={handleLoadSeed}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition"
              title="Re-fetch original seed dataset"
            >
              <RefreshCw className="w-4 h-4 text-slate-450" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-6 flex-1 w-full space-y-6" id="primary-view-container">
        
        {/* State level progress indicator */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4" id="reporting-banner-lga">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Ekiti State Governorship Aggregates</h2>
            <div className="text-2xl font-black flex items-center gap-2" id="leader-visual">
              {globalStats.totalVotes > 0 ? (
                <>
                  <span style={{ color: globalStats.leaderboard[0].color }}>{globalStats.leaderboard[0].party}</span>
                  <span className="text-slate-400 text-base font-normal">leads with</span>
                  <span>{globalStats.leaderboard[0].votes.toLocaleString()} votes</span>
                  <span className="text-xs font-normal text-slate-400">({globalStats.leaderboard[0].percentage.toFixed(1)}%)</span>
                </>
              ) : (
                <span className="text-lg font-bold text-slate-350">Awaiting Polling Unit entries...</span>
              )}
            </div>
          </div>
          <div className="md:w-72 bg-slate-800/50 p-3.5 rounded-lg border border-slate-700/60" id="reporting-sub-progress">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400">POLLING UNITS REPORTING:</span>
              <span className="text-indigo-300 font-bold">{globalStats.reportingProgress.entered} / {globalStats.reportingProgress.total}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(globalStats.reportingProgress.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-450 mt-1">
              <span>{globalStats.reportingProgress.percentage.toFixed(2)}% entered</span>
              <span>2,445 T-PU</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="border-b border-slate-200" id="main-nav-tabs">
          <nav className="flex flex-wrap -mb-px space-x-1 lg:space-x-3" aria-label="Tabs">
            
            {/* Tab 1: Overview */}
            <button
              id="tab-btn-overview"
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-4 text-xs font-bold border-b-2 rounded-t-lg transition flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "border-indigo-600 text-indigo-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Overview & Analytics</span>
            </button>

            {/* Tab 2: PU level entries */}
            <button
              id="tab-btn-pu"
              onClick={() => setActiveTab("polling-units")}
              className={`py-3 px-4 text-xs font-bold border-b-2 rounded-t-lg transition flex items-center gap-1.5 ${
                activeTab === "polling-units"
                  ? "border-blue-600 text-blue-750 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Level 1: Results by Polling Unit</span>
              <span className="ml-1 bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                2445
              </span>
            </button>

            {/* Tab 3: Ward Summaries */}
            <button
              id="tab-btn-ward"
              onClick={() => setActiveTab("wards")}
              className={`py-3 px-4 text-xs font-bold border-b-2 rounded-t-lg transition flex items-center gap-1.5 ${
                activeTab === "wards"
                  ? "border-violet-600 text-violet-750 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Level 2: Summary by Ward</span>
              <span className="ml-1 bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {wardSummaries.length}
              </span>
            </button>

            {/* Tab 4: LGA summaries */}
            <button
              id="tab-btn-lga"
              onClick={() => setActiveTab("lgas")}
              className={`py-3 px-4 text-xs font-bold border-b-2 rounded-t-lg transition flex items-center gap-1.5 ${
                activeTab === "lgas"
                  ? "border-cyan-600 text-cyan-750 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Level 3: Summary by LGA</span>
              <span className="ml-1 bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {lgaSummaries.filter(l => l.pusEntered > 0).length} / 16
              </span>
            </button>

          </nav>
        </div>

        {/* Dynamic content panel rendering based on Active Tab */}
        <div className="min-h-[400px]" id="tab-panels-render">
          {activeTab === "overview" && (
            <DashboardStats stats={globalStats} lgaSummaries={lgaSummaries} wardSummaries={wardSummaries} />
          )}

          {activeTab === "polling-units" && (
            <PollingUnitsTable
              puResults={puResults}
              onAdd={handleAddPu}
              onEdit={handleEditPu}
              onDelete={handleDeletePu}
              onLoadSeed={handleLoadSeed}
              onClearAll={handleClearAll}
            />
          )}

          {activeTab === "wards" && (
            <WardsTable wardSummaries={wardSummaries} puResults={puResults} />
          )}

          {activeTab === "lgas" && (
            <LgasTable lgaSummaries={lgaSummaries} wardSummaries={wardSummaries} />
          )}
        </div>

      </main>

      {/* Footer information */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-12 border-t border-slate-800 text-xs text-center" id="system-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>© 2026 Ekiti Election reporting & Dynamic Consolidation Dashboard.</p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <span className="text-slate-500 font-semibold uppercase">EC8A Compliance Standard</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Operational Integrity Verified</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
