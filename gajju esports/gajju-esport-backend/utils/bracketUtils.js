// Shuffle an array randomly (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Round names based on how many rounds total
function roundName(roundsFromEnd) {
  // roundsFromEnd: 0 = final, 1 = semifinal, 2 = quarterfinal, 3 = round of 16...
  if (roundsFromEnd === 0) return 'Final';
  if (roundsFromEnd === 1) return 'Semifinal';
  if (roundsFromEnd === 2) return 'Quarterfinal';
  return `Round of ${Math.pow(2, roundsFromEnd + 1)}`;
}

/**
 * Build the first round of a knockout bracket from a list of teams.
 * teams: array of { id, name }
 * order: 'random' | 'manual' (manual = keep given order, e.g. seeded pairs)
 */
function buildFirstRound(teams, order = 'random') {
  const list = order === 'random' ? shuffle(teams) : [...teams];

  // Bracket size must be a power of 2. Pad with byes (null) if needed.
  let size = 1;
  while (size < list.length) size *= 2;
  while (list.length < size) list.push(null); // bye slots

  const totalRounds = Math.log2(size);
  const matches = [];
  for (let i = 0; i < list.length; i += 2) {
    const teamA = list[i];
    const teamB = list[i + 1];
    const matchId = `r1-m${matches.length + 1}`;

    // If one side is a bye, auto-advance the other team
    const isBye = !teamA || !teamB;
    const winner = isBye ? (teamA || teamB) : null;

    matches.push({
      matchId,
      teamA: teamA ? teamA.name : null,
      teamAId: teamA ? teamA.id : null,
      teamB: teamB ? teamB.name : null,
      teamBId: teamB ? teamB.id : null,
      winner: winner ? winner.name : null,
      winnerId: winner ? winner.id : null,
      status: isBye ? 'bye' : 'pending',
      scheduledTime: '',
    });
  }

  const rounds = [
    {
      roundNumber: 1,
      roundName: roundName(totalRounds - 1),
      matches,
    },
  ];

  // Pre-create empty placeholder rounds for the rest of the bracket
  let matchesInRound = matches.length / 2;
  for (let r = 2; r <= totalRounds; r++) {
    const roundMatches = [];
    for (let m = 0; m < matchesInRound; m++) {
      roundMatches.push({
        matchId: `r${r}-m${m + 1}`,
        teamA: null,
        teamAId: null,
        teamB: null,
        teamBId: null,
        winner: null,
        winnerId: null,
        status: 'pending',
        scheduledTime: '',
      });
    }
    rounds.push({
      roundNumber: r,
      roundName: roundName(totalRounds - r),
      matches: roundMatches,
    });
    matchesInRound = matchesInRound / 2;
  }

  // Propagate byes from round 1 straight into round 2 automatically
  propagateByes(rounds);

  return rounds;
}

// After any winner is set, push them into the next round's correct slot
function propagateByes(rounds) {
  for (let r = 0; r < rounds.length - 1; r++) {
    const current = rounds[r];
    const next = rounds[r + 1];
    current.matches.forEach((match, idx) => {
      if (match.winner) {
        const nextMatchIdx = Math.floor(idx / 2);
        const nextMatch = next.matches[nextMatchIdx];
        if (idx % 2 === 0) {
          nextMatch.teamA = match.winner;
          nextMatch.teamAId = match.winnerId;
        } else {
          nextMatch.teamB = match.winner;
          nextMatch.teamBId = match.winnerId;
        }
        // If next match now has a bye itself, auto-advance again (rare edge case)
        if (nextMatch.teamA && !nextMatch.teamB && next.matches.length === 1 === false) {
          // leave as pending, only auto-advance if this is genuinely a bye slot
        }
      }
    });
  }
}

/**
 * Set the winner of a specific match and cascade them into the next round.
 */
function setMatchWinner(bracket, matchId, winnerName, winnerId) {
  let found = false;
  for (let r = 0; r < bracket.rounds.length; r++) {
    const round = bracket.rounds[r];
    const matchIdx = round.matches.findIndex((m) => m.matchId === matchId);
    if (matchIdx === -1) continue;

    const match = round.matches[matchIdx];
    if (match.teamA !== winnerName && match.teamB !== winnerName) {
      throw new Error('Winner must be one of the two teams in this match');
    }
    match.winner = winnerName;
    match.winnerId = winnerId || null;
    match.status = 'completed';
    found = true;

    // Push into next round if it exists
    const nextRound = bracket.rounds[r + 1];
    if (nextRound) {
      const nextMatchIdx = Math.floor(matchIdx / 2);
      const nextMatch = nextRound.matches[nextMatchIdx];
      if (matchIdx % 2 === 0) {
        nextMatch.teamA = winnerName;
        nextMatch.teamAId = winnerId || null;
      } else {
        nextMatch.teamB = winnerName;
        nextMatch.teamBId = winnerId || null;
      }
    } else {
      // This was the final
      bracket.status = 'completed';
    }
    break;
  }
  if (!found) throw new Error('Match not found');
  return bracket;
}

module.exports = { buildFirstRound, setMatchWinner, shuffle };
