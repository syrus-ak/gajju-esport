const mongoose = require('mongoose');

// A single match inside a round
const matchSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true }, // e.g. "r1-m1"
    teamA: { type: String, default: null },     // registration name (null = "TBD" / bye)
    teamAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    teamB: { type: String, default: null },
    teamBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    winner: { type: String, default: null },     // name of winning team
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    scheduledTime: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'live', 'completed', 'bye'], default: 'pending' },
  },
  { _id: false }
);

const roundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true },
    roundName: { type: String, required: true }, // "Quarterfinal", "Semifinal", "Final"
    matches: [matchSchema],
  },
  { _id: false }
);

const bracketSchema = new mongoose.Schema(
  {
    game: { type: String, required: true, enum: ['coc', 'bgmi', 'cod'] },
    tier: { type: String, required: true },
    mode: { type: String, enum: ['random', 'manual'], default: 'random' },
    rounds: [roundSchema],
    status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  },
  { timestamps: true }
);

// One active bracket per game+tier combo
bracketSchema.index({ game: 1, tier: 1 }, { unique: true });

module.exports = mongoose.model('Bracket', bracketSchema);
