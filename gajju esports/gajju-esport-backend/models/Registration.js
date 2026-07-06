const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },          // player/team display name
    gameUid: { type: String, required: true, trim: true },        // in-game ID
    contact: { type: String, required: true, trim: true },        // phone / whatsapp / discord
    game: { type: String, required: true, enum: ['coc', 'bgmi', 'cod'] },
    tier: { type: String, required: true },                       // e.g. "tier1", "tier2", "open"
    rankOrTH: { type: String, default: '' },                      // BGMI rank / CoC TH level (for record)
    utr: { type: String, default: '' },                           // transaction ID submitted by user
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    // Once a bracket is generated, this links the registration to its slot
    bracketAssigned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
