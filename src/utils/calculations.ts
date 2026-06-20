import { PollingUnitResult, WardSummary, LgaSummary, EKITI_LGAS, PartyVotes, GlobalStats } from "../types";

export function createEmptyPartyVotes(): PartyVotes {
  return {
    APC: 0,
    PDP: 0,
    ADC: 0,
    LP: 0,
    ACCORD: 0,
    SDP: 0
  };
}

/**
 * Calculates Ward Summaries dynamically from the current list of polling units.
 */
export function calculateWardSummaries(puResults: PollingUnitResult[]): WardSummary[] {
  const wardMap: { [key: string]: {
    wardName: string;
    wardCode: string;
    lgaName: string;
    puCount: number;
    pusEntered: number;
    registeredVoters: number;
    registeredVotersReporting: number;
    accreditedVoters: number;
    votes: PartyVotes;
  }} = {};

  puResults.forEach(pu => {
    const lgaKey = pu.lga.trim().toUpperCase();
    const wardKey = pu.ward.trim().toUpperCase();
    const groupKey = `${lgaKey}::${wardKey}`;

    if (!wardMap[groupKey]) {
      wardMap[groupKey] = {
        wardName: pu.ward.trim().toUpperCase(),
        wardCode: pu.wardCode || "01",
        lgaName: pu.lga.trim().toUpperCase(),
        puCount: 0,
        pusEntered: 0,
        registeredVoters: 0,
        registeredVotersReporting: 0,
        accreditedVoters: 0,
        votes: createEmptyPartyVotes()
      };
    }

    const group = wardMap[groupKey];
    group.puCount += 1;
    group.registeredVoters += pu.registeredVoters;

    if (pu.isEntered) {
      group.pusEntered += 1;
      group.registeredVotersReporting += pu.registeredVoters;
      group.accreditedVoters += pu.accreditedVoters;
      
      group.votes.APC += pu.votes.APC;
      group.votes.PDP += pu.votes.PDP;
      group.votes.ADC += pu.votes.ADC;
      group.votes.LP += pu.votes.LP;
      group.votes.ACCORD += pu.votes.ACCORD;
      group.votes.SDP += pu.votes.SDP;
    }
  });

  return Object.values(wardMap).map(group => {
    const totalVotes = 
      group.votes.APC + 
      group.votes.PDP + 
      group.votes.ADC + 
      group.votes.LP + 
      group.votes.ACCORD + 
      group.votes.SDP;

    // Turnout is calculated relative to reporting units to avoid skewing
    const turnoutRate = group.registeredVotersReporting > 0 
      ? (group.accreditedVoters / group.registeredVotersReporting) * 100 
      : 0;

    return {
      wardName: group.wardName,
      wardCode: group.wardCode,
      lgaName: group.lgaName,
      puCount: group.puCount,
      pusEntered: group.pusEntered,
      registeredVoters: group.registeredVoters,
      accreditedVoters: group.accreditedVoters,
      votes: group.votes,
      totalVotes,
      turnoutRate
    };
  }).sort((a, b) => a.lgaName.localeCompare(b.lgaName) || a.wardName.localeCompare(b.wardName));
}

/**
 * Calculates LGA Summaries dynamically.
 * Aggregates results securely from matching wards and polling units.
 */
export function calculateLgaSummaries(
  puResults: PollingUnitResult[],
  wardSummaries: WardSummary[]
): LgaSummary[] {
  return EKITI_LGAS.map(lgaMeta => {
    const lgaNameUpper = lgaMeta.name.trim().toUpperCase();
    
    // Find all polling units in this LGA
    const lgaPUs = puResults.filter(pu => pu.lga.trim().toUpperCase() === lgaNameUpper);
    
    // Keep track of unique wards found in this LGA
    const wardNames = [...new Set(lgaPUs.map(pu => pu.ward.trim().toUpperCase()))];
    
    const aggregatedVotes = createEmptyPartyVotes();
    let registeredVoters = 0;
    let registeredVotersReporting = 0;
    let accreditedVoters = 0;
    let pusEntered = 0;

    lgaPUs.forEach(pu => {
      registeredVoters += pu.registeredVoters;
      if (pu.isEntered) {
        pusEntered += 1;
        registeredVotersReporting += pu.registeredVoters;
        accreditedVoters += pu.accreditedVoters;
        aggregatedVotes.APC += pu.votes.APC;
        aggregatedVotes.PDP += pu.votes.PDP;
        aggregatedVotes.ADC += pu.votes.ADC;
        aggregatedVotes.LP += pu.votes.LP;
        aggregatedVotes.ACCORD += pu.votes.ACCORD;
        aggregatedVotes.SDP += pu.votes.SDP;
      }
    });

    const totalVotes =
      aggregatedVotes.APC +
      aggregatedVotes.PDP +
      aggregatedVotes.ADC +
      aggregatedVotes.LP +
      aggregatedVotes.ACCORD +
      aggregatedVotes.SDP;

    const turnoutRate = registeredVotersReporting > 0 
      ? (accreditedVoters / registeredVotersReporting) * 100 
      : 0;

    return {
      lgaName: lgaMeta.name,
      totalPUs: lgaMeta.totalPUs,
      pusEntered: pusEntered, // Count of PUs where isEntered is true
      wardCount: wardNames.length,
      registeredVoters,
      accreditedVoters,
      votes: aggregatedVotes,
      totalVotes,
      turnoutRate
    };
  });
}

/**
 * Calculates global state metrics.
 */
export function calculateGlobalStats(
  puResults: PollingUnitResult[],
  lgaSummaries: LgaSummary[]
): GlobalStats {
  let totalRegistered = 0;
  let totalAccredited = 0;
  let totalRegisteredReporting = 0;
  let enteredPUs = 0;
  const totalVotesByParty = createEmptyPartyVotes();

  puResults.forEach(pu => {
    totalRegistered += pu.registeredVoters;
    if (pu.isEntered) {
      enteredPUs += 1;
      totalRegisteredReporting += pu.registeredVoters;
      totalAccredited += pu.accreditedVoters;
      totalVotesByParty.APC += pu.votes.APC;
      totalVotesByParty.PDP += pu.votes.PDP;
      totalVotesByParty.ADC += pu.votes.ADC;
      totalVotesByParty.LP += pu.votes.LP;
      totalVotesByParty.ACCORD += pu.votes.ACCORD;
      totalVotesByParty.SDP += pu.votes.SDP;
    }
  });

  const totalVotes =
    totalVotesByParty.APC +
    totalVotesByParty.PDP +
    totalVotesByParty.ADC +
    totalVotesByParty.LP +
    totalVotesByParty.ACCORD +
    totalVotesByParty.SDP;

  const overallTurnout = totalRegisteredReporting > 0
    ? (totalAccredited / totalRegisteredReporting) * 100
    : 0;

  const partyColorsMap: { [key: string]: string } = {
    APC: "#1E3A8A", // dark blue
    PDP: "#DC2626", // red
    ADC: "#F59E0B", // amber
    LP: "#10B981",  // green
    ACCORD: "#8B5CF6", // purple
    SDP: "#EC4899"  // pink
  };

  const leaderboard = Object.keys(totalVotesByParty).map(party => {
    const votes = totalVotesByParty[party as keyof PartyVotes];
    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
    return {
      party,
      votes,
      percentage,
      color: partyColorsMap[party] || "#6b7280"
    };
  }).sort((a, b) => b.votes - a.votes);

  const totalRegisteredPUs = 2445; // Fixed total per user request
  const reportingPercentage = (enteredPUs / totalRegisteredPUs) * 100;

  return {
    totalRegistered,
    totalAccredited,
    overallTurnout,
    totalVotes,
    leaderboard,
    reportingProgress: {
      entered: enteredPUs,
      total: totalRegisteredPUs,
      percentage: reportingPercentage
    }
  };
}
