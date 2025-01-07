const express = require('express');
const path = require('path');

const app = express();

// Serve React static files
app.use(express.static(path.join(__dirname, '../build')));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
