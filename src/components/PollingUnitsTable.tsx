import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  HelpCircle,
  TrendingDown,
  Info
} from "lucide-react";
import { 
  PollingUnitResult, 
  EKITI_LGAS, 
  PARTIES, 
  PARTY_COLORS, 
  PartyVotes 
} from "../types";
import { createEmptyPartyVotes } from "../utils/calculations";

function InlineVoteInput({ 
  pu, 
  party, 
  onUpdate 
}: { 
  pu: PollingUnitResult; 
  party: keyof PartyVotes; 
  onUpdate: (id: string, updatedFields: Partial<PollingUnitResult>) => void 
}) {
  const [val, setVal] = React.useState(pu.isEntered && pu.votes[party] > 0 ? pu.votes[party].toString() : "");

  React.useEffect(() => {
    setVal(pu.isEntered && pu.votes[party] > 0 ? pu.votes[party].toString() : "");
  }, [pu.isEntered, pu.votes[party]]);

  const handleBlur = () => {
    const num = val === "" ? 0 : Math.max(0, parseInt(val, 10));
    
    const newVotes = {
      ...pu.votes,
      [party]: num
    };
    
    const hasAnyVotes = Object.values(newVotes).some(v => v > 0);

    if (num !== pu.votes[party] || hasAnyVotes !== pu.isEntered) {
      onUpdate(pu.id, {
        ...pu,
        votes: newVotes,
        isEntered: hasAnyVotes
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={val}
      onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="—"
      className="w-16 text-center text-sm font-bold border border-slate-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-350 shadow-inner"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

interface PollingUnitsTableProps {
  puResults: PollingUnitResult[];
  onAdd: (pu: Omit<PollingUnitResult, "id" | "updatedAt">) => void;
  onEdit: (id: string, pu: Partial<PollingUnitResult>) => void;
  onDelete: (id: string) => void;
  onLoadSeed: () => void;
  onClearAll: () => void;
}

export default function PollingUnitsTable({
  puResults,
  onAdd,
  onEdit,
  onDelete,
  onLoadSeed,
  onClearAll
}: PollingUnitsTableProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLgaFilter, setSelectedLgaFilter] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPu, setEditingPu] = useState<PollingUnitResult | null>(null);

  // Form Fields State
  const [formLga, setFormLga] = useState("");
  const [formWard, setFormWard] = useState("");
  const [formWardCode, setFormWardCode] = useState("");
  const [formPuName, setFormPuName] = useState("");
  const [formPuCode, setFormPuCode] = useState("");
  const [formRegistered, setFormRegistered] = useState<number | "">("");
  const [formAccredited, setFormAccredited] = useState<number | "">("");
  const [formVotes, setFormVotes] = useState<PartyVotes>(createEmptyPartyVotes());

  // Validation Warnings (Live while typing)
  const totalPartyVotes = PARTIES.reduce((sum, p) => sum + (formVotes[p] || 0), 0);
  const isOvervoting = typeof formAccredited === "number" && totalPartyVotes > formAccredited;
  const isExcessAccredited = typeof formRegistered === "number" && typeof formAccredited === "number" && formAccredited > formRegistered;
  const isZeroRegistered = formRegistered === 0;

  // Filtered Polling Units
  const filteredPu = puResults.filter(pu => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      pu.puName.toLowerCase().includes(term) || 
      pu.ward.toLowerCase().includes(term) ||
      pu.puCode.includes(term) ||
      pu.wardCode.includes(term);
    const matchesLga = selectedLgaFilter === "" || pu.lga.trim().toUpperCase() === selectedLgaFilter.trim().toUpperCase();
    return matchesSearch && matchesLga;
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPu(null);
    setFormLga(EKITI_LGAS[0].name);
    setFormWard("");
    setFormWardCode("01");
    setFormPuName("");
    setFormPuCode("001");
    setFormRegistered("");
    setFormAccredited("");
    setFormVotes(createEmptyPartyVotes());
    setIsModalOpen(true);
  };

  // Open modal for Edit / Enter Results
  const handleOpenEdit = (pu: PollingUnitResult) => {
    setEditingPu(pu);
    setFormLga(pu.lga);
    setFormWard(pu.ward);
    setFormWardCode(pu.wardCode);
    setFormPuName(pu.puName);
    setFormPuCode(pu.puCode);
    setFormRegistered(pu.registeredVoters);
    setFormAccredited(pu.accreditedVoters || "");
    setFormVotes({ ...pu.votes });
    setIsModalOpen(true);
  };

  // Save/Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formLga || !formWard || !formPuName) {
      alert("Please fill in LGA, Ward, and Polling Unit Name.");
      return;
    }

    const reg = typeof formRegistered === "number" ? formRegistered : 0;
    const acc = typeof formAccredited === "number" ? formAccredited : 0;

    const puData = {
      lga: formLga.toUpperCase().trim(),
      ward: formWard.toUpperCase().trim(),
      wardCode: formWardCode.trim() || "01",
      puName: formPuName.trim(),
      puCode: formPuCode.trim() || "001",
      registeredVoters: reg,
      accreditedVoters: acc,
      votes: formVotes,
      isEntered: true // Save makes it officially Entered
    };

    if (editingPu) {
      onEdit(editingPu.id, puData);
    } else {
      onAdd(puData);
    }

    setIsModalOpen(false);
  };

  const handleVoteChange = (party: keyof PartyVotes, value: string) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value, 10));
    setFormVotes(prev => ({
      ...prev,
      [party]: num
    }));
  };

  const { globalSum, puEntered } = React.useMemo(() => {
    const sum = { APC: 0, PDP: 0, ADC: 0, LP: 0, ACCORD: 0, SDP: 0 };
    let enteredCount = 0;
    puResults.forEach(pu => {
      if (pu.isEntered) {
        enteredCount++;
        PARTIES.forEach(party => {
          sum[party as keyof PartyVotes] += pu.votes[party as keyof PartyVotes] || 0;
        });
      }
    });
    return { globalSum: sum, puEntered: enteredCount };
  }, [puResults]);

  return (
    <div className="space-y-6" id="polling-units-screen">
      {/* Result Summary Banner (Matches CSV exactly) */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">EKITI STATE GOVERNORSHIP ELECTION RESULTS 2026</h2>
          <p className="text-xs text-slate-400 mt-1">Results from Irev</p>
          <p className="text-xs text-slate-400">Result by Polling Units</p>
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
              <span className="font-bold text-sm text-slate-200">2445</span>
            </div>
            <div className="flex flex-col pl-3 border-l border-slate-700">
              <span className="text-[10px] text-slate-400 text-nowrap">PU Entered</span>
              <span className="font-bold text-sm text-emerald-400">{puEntered}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100" id="actions-header-bar">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-850">Polled Results Entry Panel</h3>
          <p className="text-xs text-slate-500">
            Preloaded template aligned with Ekiti electoral grid. Find any unit below and click <span className="font-bold">"Enter/Edit Result"</span>.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="pu-filters-row">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="search-pu-input"
            placeholder="Search PU Name, Code, Ward..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* LGA Filter Dropdown */}
        <div id="filter-lga-container">
          <select
            id="filter-lga-select"
            value={selectedLgaFilter}
            onChange={(e) => setSelectedLgaFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All LGAs (16)</option>
            {EKITI_LGAS.map(lga => (
              <option key={lga.name} value={lga.name}>{lga.name}</option>
            ))}
          </select>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-end text-xs text-slate-500 gap-1.5 bg-slate-50/50 px-3 py-1.5 rounded-lg border border-dotted border-slate-200">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>Active Units: <strong>{filteredPu.length}</strong> of <strong>2445</strong></span>
        </div>
      </div>

      {/* Main Table Grid arranged exactly like requested: LGA, WARD, WARD CODE, Polling unit, PU Code, APC, PDP, ADC, LP, ACCORD, SDP */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" id="pu-table-card">
        {filteredPu.length > 0 ? (
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left border-collapse" id="table-pu-details">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-950 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-extrabold text-blue-300">LGA</th>
                  <th className="py-3.5 px-3">WARD</th>
                  <th className="py-3.5 px-3 text-center">WARD CODE</th>
                  <th className="py-3.5 px-3">POLLING UNITS</th>
                  <th className="py-3.5 px-3 text-center text-blue-300">PU CODE</th>
                  {PARTIES.map(party => (
                    <th key={party} className="py-3.5 px-2.5 text-center text-white" style={{ background: PARTY_COLORS[party] + "22" }}>
                      {party}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(() => {
                  const groupedPUs = new Map<string, PollingUnitResult[]>();
                  filteredPu.forEach(pu => {
                    const key = `${pu.lga}_${pu.ward}`;
                    if (!groupedPUs.has(key)) groupedPUs.set(key, []);
                    groupedPUs.get(key)!.push(pu);
                  });

                  return Array.from(groupedPUs.entries()).map(([key, pusInWard]) => {
                    const sumRow = { APC: 0, PDP: 0, ADC: 0, LP: 0, ACCORD: 0, SDP: 0 };
                    
                    return (
                      <React.Fragment key={key}>
                        {pusInWard.map((pu) => {
                          if (pu.isEntered) {
                            PARTIES.forEach(party => {
                              sumRow[party as keyof PartyVotes] += pu.votes[party as keyof PartyVotes] || 0;
                            });
                          }

                          return (
                            <tr 
                              key={pu.id} 
                              className={`hover:bg-slate-50 transition duration-100 ${pu.isEntered ? "bg-emerald-50/15" : "bg-white text-slate-400"}`} 
                              id={`pu-row-${pu.id}`}
                              title="Enter results directly into the boxes"
                            >
                              {/* LGA */}
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {pu.lga}
                              </td>

                              {/* WARD */}
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-800">{pu.ward}</span>
                              </td>

                              {/* WARD CODE */}
                              <td className="py-3 px-3 text-center">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] text-slate-600 font-bold">
                                  {pu.wardCode || "—"}
                                </span>
                              </td>

                              {/* POLLING UNITS */}
                              <td className="py-3 px-3 font-medium max-w-[200px] truncate" title={pu.puName}>
                                {pu.puName}
                              </td>

                              {/* PU CODE */}
                              <td className="py-3 px-3 text-center">
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                  {pu.puCode || "—"}
                                </span>
                              </td>

                              {/* PARTY INLINE INPUTS */}
                              {PARTIES.map(party => (
                                <td key={party} className="py-2.5 px-2 text-center">
                                  <InlineVoteInput 
                                    pu={pu} 
                                    party={party as keyof PartyVotes} 
                                    onUpdate={onEdit} 
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                        {/* SUM ROW */}
                        <tr className="bg-indigo-50/50 font-extrabold text-slate-900 border-t-2 border-indigo-200">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-3 text-indigo-800">SUM</td>
                          <td className="py-3 px-3"></td>
                          <td className="py-3 px-3"></td>
                          <td className="py-3 px-3"></td>
                          {PARTIES.map(party => (
                            <td key={party} className="py-3 px-2.5 text-center text-indigo-900">
                              {sumRow[party as keyof PartyVotes]}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-4" id="empty-pu-view">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto animate-flicker" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-700">No Polling Units Found Matching Criteria</h4>
              <p className="text-xs max-w-sm mx-auto">
                Try searching for another ward, checking your filter, or clicking "Reset Real Ekiti Set" to reset templates matching the official file structure.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DATA ENTRY FORM MODAL */}
      {isModalOpen && (
        <div id="modal-form-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-150 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base" id="form-modal-title">
                  {editingPu ? `Polling Unit: ${editingPu.puName}` : "New Custom Polling Unit Entry"}
                </h3>
                <p className="text-[11px] text-slate-350">Accurately fill in the credentials matching the official INEC Form EC8A</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Local Government Area (LGA) *</label>
                  <select
                    value={formLga}
                    onChange={(e) => setFormLga(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {EKITI_LGAS.map(lga => (
                      <option key={lga.name} value={lga.name}>{lga.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ward Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADO 'A' IDOFIN"
                    value={formWard}
                    onChange={(e) => setFormWard(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-850 placeholder-slate-450 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Polling Unit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IN FRONT OF UDE'S HOUSE"
                    value={formPuName}
                    onChange={(e) => setFormPuName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-850 placeholder-slate-450 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 md:col-span-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1" title="Ward Code">Ward Code</label>
                    <input
                      type="text"
                      placeholder="01"
                      value={formWardCode}
                      onChange={(e) => setFormWardCode(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-205 rounded-lg text-sm text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 text-center uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1" title="PU Code">PU Code</label>
                    <input
                      type="text"
                      placeholder="001"
                      value={formPuCode}
                      onChange={(e) => setFormPuCode(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-205 rounded-lg text-sm text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 text-center uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Party results inputs */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded">
                  <span className="text-xs font-bold text-slate-600">INPUT PARTY RESULTS</span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-750">
                    <span>Sum of Votes:</span>
                    <span className="text-indigo-700">{totalPartyVotes}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PARTIES.map(party => (
                    <div key={party} className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-700 mb-1" style={{ color: PARTY_COLORS[party] }}>
                        {party} Result
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formVotes[party] || ""}
                        onChange={(e) => handleVoteChange(party, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-800 font-bold focus:outline-none focus:border-indigo-405 text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-105 hover:bg-slate-150 border border-slate-200 rounded-lg text-xs font-semibold text-slate-605 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white shadow transition bg-blue-600 hover:bg-blue-700"
                >
                  {editingPu ? "Publish Scores" : "Create & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
