const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const adminAuth = require('../middleware/adminAuth');

// PUBLIC: submit a new registration (called from the modal form on the site)
router.post('/', async (req, res) => {
  try {
    const { name, gameUid, contact, game, tier, rankOrTH, utr } = req.body;
    if (!name || !gameUid || !contact || !game || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const reg = await Registration.create({ name, gameUid, contact, game, tier, rankOrTH, utr });
    res.status(201).json(reg);
  } catch (err) {
    res.status(500).json({ error: 'Could not save registration', details: err.message });
  }
});

// ADMIN: list all registrations (optionally filter by game/tier/status)
router.get('/', adminAuth, async (req, res) => {
  const { game, tier, status } = req.query;
  const filter = {};
  if (game) filter.game = game;
  if (tier) filter.tier = tier;
  if (status) filter.status = status;

  const regs = await Registration.find(filter).sort({ createdAt: -1 });
  res.json(regs);
});

// ADMIN: verify / reject a registration
router.patch('/:id/status', adminAuth, async (req, res) => {
  const { status } = req.body; // 'verified' | 'rejected' | 'pending'
  if (!['verified', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const reg = await Registration.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  res.json(reg);
});

// ADMIN: delete a registration
router.delete('/:id', adminAuth, async (req, res) => {
  const reg = await Registration.findByIdAndDelete(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  res.json({ success: true });
});

module.exports = router;
