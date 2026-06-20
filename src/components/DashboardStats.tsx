import React, { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Users, 
  Vote, 
  Building2, 
  TrendingUp, 
  Activity, 
  BarChart3 
} from "lucide-react";
import { GlobalStats, LgaSummary, WardSummary, PARTIES, PARTY_COLORS, PartyVotes, EKITI_LGAS } from "../types";

interface DashboardStatsProps {
  stats: GlobalStats;
  lgaSummaries: LgaSummary[];
  wardSummaries: WardSummary[];
}

export default function DashboardStats({ stats, lgaSummaries, wardSummaries }: DashboardStatsProps) {
  const [selectedWardLgaFilter, setSelectedWardLgaFilter] = useState<string>("");

  // Data for the party votes share chart
  const pieData = stats.leaderboard.map(item => ({
    name: item.party,
    value: item.votes,
    color: item.color
  })).filter(item => item.value > 0);

  // Data for the top reporting LGAs (Turnout / generic)
  const barData = lgaSummaries
    .map(lga => ({
      name: lga.lgaName,
      "Votes counted": lga.totalVotes,
      "Turnout %": parseFloat(lga.turnoutRate.toFixed(1)),
      "PUs Reporting": lga.pusEntered
    }))
    .filter(item => item["Votes counted"] > 0)
    .sort((a, b) => b["Votes counted"] - a["Votes counted"])
    .slice(0, 8); // Top 8 reporting LGAs

  // Results by LGA
  const lgaBarData = lgaSummaries
    .filter(lga => lga.pusEntered > 0)
    .map(lga => ({
      name: lga.lgaName,
      APC: lga.votes.APC,
      PDP: lga.votes.PDP,
      ADC: lga.votes.ADC,
      LP: lga.votes.LP,
      ACCORD: lga.votes.ACCORD,
      SDP: lga.votes.SDP,
    }))
    .sort((a, b) => (b.APC + b.PDP + b.ADC + b.LP + b.ACCORD + b.SDP) - (a.APC + a.PDP + a.ADC + a.LP + a.ACCORD + a.SDP));

  // Results by Wards (Top 30 to avoid clutter)
  const wardBarData = wardSummaries
    .filter(ward => ward.pusEntered > 0)
    .filter(ward => selectedWardLgaFilter === "" || ward.lgaName.trim().toUpperCase() === selectedWardLgaFilter.trim().toUpperCase())
    .map(ward => ({
      name: `${ward.lgaName.substring(0, 3)} - ${ward.wardName}`,
      APC: ward.votes.APC,
      PDP: ward.votes.PDP,
      ADC: ward.votes.ADC,
      LP: ward.votes.LP,
      ACCORD: ward.votes.ACCORD,
      SDP: ward.votes.SDP,
    }))
    .sort((a, b) => (b.APC + b.PDP + b.ADC + b.LP + b.ACCORD + b.SDP) - (a.APC + a.PDP + a.ADC + a.LP + a.ACCORD + a.SDP))
    .slice(0, 30); 

  return (
    <div className="space-y-6" id="dashboard-stats-container">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="kpi-cards-grid">
        {/* Card 1: Reporting Progress */}
        <div id="kpi-reporting" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="h-6 w-6" id="icon-reporting" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PU Upload Progress</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">
              {stats.reportingProgress.entered} <span className="text-sm font-normal text-slate-400">/ {stats.reportingProgress.total}</span>
            </h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(stats.reportingProgress.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats.reportingProgress.percentage.toFixed(2)}% of total PUs</p>
          </div>
        </div>

        {/* Card 2: Total Registered Voters */}
        <div id="kpi-registered" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="h-6 w-6" id="icon-registered" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Voters</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">
              {stats.totalRegistered.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-2">Across active polling units</p>
          </div>
        </div>

        {/* Card 3: Total Valid Votes */}
        <div id="kpi-votes" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Vote className="h-6 w-6" id="icon-votes" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Valid Votes</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">
              {stats.totalVotes.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {stats.totalAccredited > 0 ? ((stats.totalVotes / stats.totalAccredited) * 100).toFixed(1) : 0}% of accredited
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-visuals-grid">
        {/* Leading Party Standing Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-1 flex flex-col justify-between" id="leaderboard-standing-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Live Party Standing
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-1 rounded-full">
                {stats.totalVotes > 0 ? "Sorted by Votes" : "No Votes Yet"}
              </span>
            </div>

            <div className="space-y-4" id="leaderboard-items">
              {stats.leaderboard.map((item, index) => {
                const isLeading = index === 0 && item.votes > 0;
                return (
                  <div key={item.party} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-800 font-semibold">{item.party}</span>
                        {isLeading && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded">
                            Leading
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-slate-800 font-bold mr-1.5">{item.votes.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {stats.totalVotes > 0 ? (
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Leading Margin:</span>
              <span className="font-semibold text-slate-700">
                {stats.leaderboard[0].votes - (stats.leaderboard[1]?.votes || 0) > 0
                  ? `${(stats.leaderboard[0].votes - (stats.leaderboard[1]?.votes || 0)).toLocaleString()} votes`
                  : "No Margin"}
              </span>
            </div>
          ) : (
            <div className="mt-8 text-center text-xs text-slate-400">
              Voter entries will automatically populate live charts here.
            </div>
          )}
        </div>

        {/* Charts & Graphs Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6" id="dashboard-charts-panel">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Voter Share & Regional Leaderboards
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[250px]">
            {/* Pie Chart of Vote Share */}
            <div className="flex flex-col items-center justify-center p-2 border border-slate-50 rounded-lg">
              <span className="text-xs font-semibold text-slate-400 mb-2 self-start">VOTE SHARE PERCENTAGE (%)</span>
              {pieData.length > 0 ? (
                <div className="w-full h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value.toLocaleString()} votes`, 'Votes']} 
                        contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend underneath Pie chart */}
                  <div className="text-xs space-y-1.5 ml-4 flex-shrink-0">
                    {pieData.map(item => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 h-40 flex items-center justify-center">
                  No votes recorded yet for charts.
                </div>
              )}
            </div>

            {/* Bar Chart of votes by LGA */}
            <div className="flex flex-col justify-center p-2 border border-slate-50 rounded-lg">
              <span className="text-xs font-semibold text-slate-400 mb-2">TOP REPORTING LGAs BY VOTES COUNTED</span>
              {barData.length > 0 ? (
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                      <Bar dataKey="Votes counted" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-slate-400 h-40 flex items-center justify-center">
                  Top 8 LGAs will display when data is added.
                </div>
              )}
            </div>
          </div>
          
          {/* New Results By LGA Stacked Bar Chart */}
          <div className="flex flex-col justify-center p-4 border border-slate-100 rounded-xl bg-slate-50/50 mt-6">
            <span className="text-xs font-bold text-slate-500 mb-4 tracking-wider">RESULTS BY LGA (VOTE SPREAD)</span>
            {lgaBarData.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lgaBarData} margin={{ top: 5, right: 5, left: -10, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    {PARTIES.map(party => (
                      <Bar key={party} dataKey={party} fill={PARTY_COLORS[party as keyof PartyVotes]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-slate-400 h-60 flex items-center justify-center">No LGA data available yet.</div>
            )}
          </div>

          {/* New Results By Ward Stacked Bar Chart */}
          <div className="flex flex-col justify-center p-4 border border-slate-100 rounded-xl bg-slate-50/50 mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 tracking-wider">
                {selectedWardLgaFilter ? `RESULTS BY WARDS (${selectedWardLgaFilter})` : "RESULTS BY WARDS (TOP 30)"}
              </span>
              <select
                value={selectedWardLgaFilter}
                onChange={(e) => setSelectedWardLgaFilter(e.target.value)}
                className="text-[11px] font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All LGAs (Top 30)</option>
                {EKITI_LGAS.map(lga => (
                  <option key={lga.name} value={lga.name}>{lga.name}</option>
                ))}
              </select>
            </div>
            {wardBarData.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wardBarData} margin={{ top: 5, right: 5, left: -10, bottom: 65 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    {PARTIES.map(party => (
                      <Bar key={party} dataKey={party} fill={PARTY_COLORS[party as keyof PartyVotes]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-slate-400 h-60 flex items-center justify-center">No Ward data available yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
