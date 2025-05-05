import app from './index';

// Get port from environment variables or use default
const PORT = parseInt(process.env.PORT || '5000', 10);

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
