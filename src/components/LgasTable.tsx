import React, { useState } from "react";
import { Search, Map, AlertTriangle } from "lucide-react";
import { LgaSummary, WardSummary, PARTIES, PARTY_COLORS } from "../types";

interface LgasTableProps {
  lgaSummaries: LgaSummary[];
  wardSummaries: WardSummary[]; // keep to avoid breaking parent
}

export default function LgasTable({ lgaSummaries }: LgasTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Search filter
  const filteredLgas = lgaSummaries.filter(lga => {
    return lga.lgaName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalRegisteredPUs = lgaSummaries.reduce((sum, l) => sum + l.totalPUs, 0);
  const totalEnteredPUs = lgaSummaries.reduce((sum, l) => sum + l.pusEntered, 0);
  const globalSum = { APC: 0, PDP: 0, ADC: 0, LP: 0, ACCORD: 0, SDP: 0 };

  lgaSummaries.forEach(lga => {
    PARTIES.forEach(party => {
      globalSum[party as keyof typeof globalSum] += lga.votes[party] || 0;
    });
  });

  return (
    <div className="space-y-4" id="lgas-screen">
      {/* Result Summary Banner (Matches CSV top text exactly) */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm p-4">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">EKITI STATE GOVERNORSHIP ELECTION RESULTS 2026</h2>
        <p className="text-xs text-slate-400 mt-1">Results from Irev</p>
        <p className="text-xs text-slate-400">Result by LGAs</p>
      </div>

      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100" id="lgas-tab-header">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Map className="h-5 w-5 text-indigo-500" />
            Summary Result by LGA (Roll-up Level 3)
          </h3>
          <p className="text-xs text-slate-500">
            Official summary by Local Government Area (LGA). Aggregates automatically roll up from Wards and Polling Units.
          </p>
        </div>
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="search-lga-input"
            placeholder="Search LGA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* LGA Details summary */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" id="lgas-table-container">
        {filteredLgas.length > 0 ? (
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left border-collapse" id="table-lga-summaries">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-950 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-10 text-center text-slate-500"></th>
                  <th className="py-3.5 px-4 font-extrabold text-blue-300">LGA</th>
                  {PARTIES.map(party => (
                    <th key={party} className="py-3.5 px-2.5 text-center text-white" style={{ background: PARTY_COLORS[party] + "22" }}>
                      {party}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center">Total No of Polling Unit per LGA</th>
                  <th className="py-3.5 px-4 text-center">PU Results Uploaded/Entered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLgas.map((lga, index) => {
                  return (
                    <tr 
                      key={lga.lgaName}
                      id={`lga-row-${lga.lgaName.replace(/[^a-zA-Z0-9]/g, "-")}`}
                      className="hover:bg-slate-50 transition duration-100 bg-white"
                    >
                      <td className="py-3 px-4 text-center text-slate-500 font-bold">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 tracking-tight">
                        {lga.lgaName}
                      </td>
                      {/* Party Votes columns */}
                      {PARTIES.map(party => (
                        <td key={party} className="py-3 px-2.5 text-center font-bold text-slate-900">
                          {lga.pusEntered > 0 ? lga.votes[party].toLocaleString() : "0"}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {lga.totalPUs}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">
                        {lga.pusEntered}
                      </td>
                    </tr>
                  );
                })}
                {/* TOTAL ROW */}
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300 border-b border-slate-300">
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4">TOTAL</td>
                  {PARTIES.map(party => (
                    <td key={party} className="py-3 px-2.5 text-center text-slate-900">
                      {globalSum[party as keyof typeof globalSum].toLocaleString()}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center text-slate-900">{totalRegisteredPUs}</td>
                  <td className="py-3 px-4 text-center text-slate-900">{totalEnteredPUs}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2" id="lgas-empty-state">
            <AlertTriangle className="w-10 h-10 text-slate-350 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No LGAs Match Filters</h4>
            <p className="text-xs max-w-sm mx-auto">
              Refine your searches or clear search terms to view roll-ups.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
