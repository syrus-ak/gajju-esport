const express = require('express');
const router = express.Router();
const Bracket = require('../models/Bracket');
const Registration = require('../models/Registration');
const adminAuth = require('../middleware/adminAuth');
const { buildFirstRound, setMatchWinner } = require('../utils/bracketUtils');

// PUBLIC: get the current bracket for a game+tier (for display on the site)
router.get('/:game/:tier', async (req, res) => {
  const { game, tier } = req.params;
  const bracket = await Bracket.findOne({ game, tier });
  if (!bracket) return res.status(404).json({ error: 'No bracket generated yet for this tier' });
  res.json(bracket);
});

// ADMIN: generate a new bracket from verified registrations
// body: { game, tier, mode: 'random' | 'manual', teamOrder: [regId, regId, ...] }  (teamOrder only needed for manual)
router.post('/generate', adminAuth, async (req, res) => {
  try {
    const { game, tier, mode = 'random', teamOrder } = req.body;
    if (!game || !tier) return res.status(400).json({ error: 'game and tier are required' });

    let teams;
    if (mode === 'manual' && Array.isArray(teamOrder) && teamOrder.length > 0) {
      const regs = await Registration.find({ _id: { $in: teamOrder } });
      // preserve the exact order admin specified
      teams = teamOrder
        .map((id) => regs.find((r) => r._id.toString() === id))
        .filter(Boolean)
        .map((r) => ({ id: r._id, name: r.name }));
    } else {
      const regs = await Registration.find({ game, tier, status: 'verified' });
      if (regs.length < 2) {
        return res.status(400).json({ error: 'Need at least 2 verified teams/players to generate a bracket' });
      }
      teams = regs.map((r) => ({ id: r._id, name: r.name }));
    }

    if (teams.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 teams to generate a bracket' });
    }

    const rounds = buildFirstRound(teams, mode === 'manual' ? 'manual' : 'random');

    const bracket = await Bracket.findOneAndUpdate(
      { game, tier },
      { game, tier, mode, rounds, status: 'active' },
      { upsert: true, new: true }
    );

    // mark these registrations as assigned
    await Registration.updateMany(
      { _id: { $in: teams.map((t) => t.id) } },
      { bracketAssigned: true }
    );

    res.status(201).json(bracket);
  } catch (err) {
    res.status(500).json({ error: 'Could not generate bracket', details: err.message });
  }
});

// ADMIN: record a match result -> winner auto-advances to next round
// body: { winnerName, winnerId }
router.patch('/:game/:tier/match/:matchId', adminAuth, async (req, res) => {
  try {
    const { game, tier, matchId } = req.params;
    const { winnerName, winnerId } = req.body;
    if (!winnerName) return res.status(400).json({ error: 'winnerName is required' });

    const bracket = await Bracket.findOne({ game, tier });
    if (!bracket) return res.status(404).json({ error: 'Bracket not found' });

    setMatchWinner(bracket, matchId, winnerName, winnerId);
    bracket.markModified('rounds');
    await bracket.save();

    res.json(bracket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: reset / delete a bracket (e.g. to regenerate)
router.delete('/:game/:tier', adminAuth, async (req, res) => {
  const { game, tier } = req.params;
  const result = await Bracket.findOneAndDelete({ game, tier });
  if (!result) return res.status(404).json({ error: 'Bracket not found' });
  res.json({ success: true });
});

module.exports = router;
