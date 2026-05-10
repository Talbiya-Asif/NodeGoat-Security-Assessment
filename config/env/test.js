module.exports = {
   // If you want to debug regression tests, you will need the following.
   zapHostName: "your-zap-host-here",
   zapPort: "8080",
   // Required from Zap 2.4.1. This key is set in Zap Options -> API _Api Key.
   zapApiKey: "your-zap-api-key-here",
   zapApiFeedbackSpeed: 5000 // Milliseconds.
};
