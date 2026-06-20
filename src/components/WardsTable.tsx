import React, { useState, useMemo } from "react";
import { Search, Layers, AlertTriangle } from "lucide-react";
import { WardSummary, PollingUnitResult, PARTIES, PARTY_COLORS, PartyVotes } from "../types";

interface WardsTableProps {
  wardSummaries: WardSummary[];
  puResults: PollingUnitResult[]; // keeping this prop to avoid breaking parent
}

export default function WardsTable({ wardSummaries, puResults }: WardsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Search filter
  const filteredWards = wardSummaries.filter(ward => {
    const term = searchTerm.toLowerCase();
    return ward.wardName.toLowerCase().includes(term) || 
           ward.wardCode.includes(term) ||
           ward.lgaName.toLowerCase().includes(term);
  });

  // Global summary
  const { globalSum, totalPUs, puEntered } = useMemo(() => {
    const sum = { APC: 0, PDP: 0, ADC: 0, LP: 0, ACCORD: 0, SDP: 0 };
    let entered = 0;
    let total = 0;
    wardSummaries.forEach(ward => {
      entered += ward.pusEntered;
      total += ward.puCount;
      PARTIES.forEach(party => {
        sum[party as keyof PartyVotes] += ward.votes[party as keyof PartyVotes] || 0;
      });
    });
    return { globalSum: sum, totalPUs: total, puEntered: entered };
  }, [wardSummaries]);

  return (
    <div className="space-y-4" id="wards-screen">
      {/* Result Summary Banner (Matches CSV exactly) */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">EKITI STATE GOVERNORSHIP ELECTION RESULTS 2026</h2>
          <p className="text-xs text-slate-400 mt-1">Results from Irev</p>
          <p className="text-xs text-slate-400">Result by Ward</p>
        </div>
        
        <div className="w-full xl:w-auto bg-slate-800 rounded-lg border border-slate-700 p-3">
          <div className="text-[10px] font-bold text-indigo-300 mb-2 uppercase tracking-widest text-center border-b border-slate-700 pb-1">Result Summary</div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-center">
            {PARTIES.map(party => (
              <div key={party} className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase">{party}</span>
                <span className="font-bold text-sm text-white" style={{ color: PARTY_COLORS[party] }}>
                  {globalSum[party as keyof PartyVotes].toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex flex-col pl-3 border-l border-slate-700">
              <span className="text-[10px] text-slate-400 text-nowrap">Total PU</span>
              <span className="font-bold text-sm text-slate-200">{totalPUs}</span>
            </div>
            <div className="flex flex-col pl-3 border-l border-slate-700">
              <span className="text-[10px] text-slate-400 text-nowrap">PU Entered</span>
              <span className="font-bold text-sm text-emerald-400">{puEntered}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100" id="wards-tab-header">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            Summary Result by Ward (Roll-up Level 2)
          </h3>
          <p className="text-xs text-slate-500">
            Real-time aggregate totals for each electoral ward, compiled directly from Polling Units of the ward.
          </p>
        </div>
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="search-ward-input"
            placeholder="Search Ward Name, Code or LGA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Ward breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" id="wards-table-container">
        {filteredWards.length > 0 ? (
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left border-collapse" id="table-ward-summaries">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-950 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-extrabold text-blue-300">LGA</th>
                  <th className="py-3.5 px-3">WARD NAME</th>
                  <th className="py-3.5 px-3 text-center">WARD CODE</th>
                  {PARTIES.map(party => (
                    <th key={party} className="py-3.5 px-2.5 text-center text-white" style={{ background: PARTY_COLORS[party] + "22" }}>
                      {party}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(() => {
                  const groupedWards = new Map<string, WardSummary[]>();
                  filteredWards.forEach(ward => {
                    if (!groupedWards.has(ward.lgaName)) groupedWards.set(ward.lgaName, []);
                    groupedWards.get(ward.lgaName)!.push(ward);
                  });

                  return Array.from(groupedWards.entries()).map(([lgaName, wardsInLga]) => {
                    const lgaSum = { APC: 0, PDP: 0, ADC: 0, LP: 0, ACCORD: 0, SDP: 0 };
                    
                    return (
                      <React.Fragment key={lgaName}>
                        {wardsInLga.map(ward => {
                          const key = `${ward.lgaName}::${ward.wardName}`;
                          if (ward.pusEntered > 0) {
                            PARTIES.forEach(party => {
                              lgaSum[party as keyof PartyVotes] += ward.votes[party as keyof PartyVotes] || 0;
                            });
                          }

                          return (
                            <tr 
                              key={key}
                              id={`ward-row-${key.replace(/[^a-zA-Z0-9]/g, "-")}`}
                              className="hover:bg-slate-50 transition duration-100 bg-white"
                            >
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {ward.lgaName}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-800">{ward.wardName}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded font-mono text-[10px]">
                                  {ward.wardCode || "—"}
                                </span>
                              </td>
                              {PARTIES.map(party => (
                                <td key={party} className="py-3 px-2.5 text-center font-bold text-slate-900">
                                  {ward.pusEntered > 0 ? ward.votes[party as keyof PartyVotes].toLocaleString() : "—"}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                        {/* LGA TOTAL ROW */}
                        <tr className="bg-slate-50 font-extrabold text-slate-900 border-t-2 border-slate-300 border-b-4 border-b-slate-100">
                          <td className="py-3 px-4">TOTAL</td>
                          <td className="py-3 px-3"></td>
                          <td className="py-3 px-3"></td>
                          {PARTIES.map(party => (
                            <td key={party} className="py-3 px-2.5 text-center text-slate-900">
                              {lgaSum[party as keyof PartyVotes].toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
                
                {/* TOTAL ROW */}
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-4">TOTAL</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3"></td>
                  {PARTIES.map(party => (
                    <td key={party} className="py-3 px-2.5 text-center">
                      {globalSum[party as keyof PartyVotes].toLocaleString()}
                    </td>
                  ))}
                </tr>
                {/* GRAND TOTAL ROW */}
                <tr className="bg-slate-200 font-extrabold text-slate-900 border-t border-slate-300">
                  <td className="py-3 px-4">GRAND TOTAL</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3"></td>
                  {PARTIES.map(party => (
                    <td key={party} className="py-3 px-2.5 text-center">
                      {globalSum[party as keyof PartyVotes].toLocaleString()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2" id="wards-empty-state">
            <AlertTriangle className="w-10 h-10 text-slate-350 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No Wards Match Filters</h4>
            <p className="text-xs max-w-sm mx-auto">
              Refine your searches or clear search terms to view roll-ups.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
