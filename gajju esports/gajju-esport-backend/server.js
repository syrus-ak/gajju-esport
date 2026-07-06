require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const registrationsRoutes = require('./routes/registrations');
const bracketRoutes = require('./routes/bracket');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors()); // allow requests from your Netlify frontend
app.use(express.json());

// Routes
app.use('/api/registrations', registrationsRoutes);
app.use('/api/bracket', bracketRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Gujju Esports backend is running ✅');
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
