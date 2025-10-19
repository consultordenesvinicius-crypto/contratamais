function log(message, context = {}) {
  const timestamp = new Date().toISOString();
  const payload = Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
  console.log(`[${timestamp}] ${message}${payload}`);
}

function logError(message, error, context = {}) {
  const timestamp = new Date().toISOString();
  const payload = {
    ...context,
    error: error instanceof Error ? error.message : error,
  };
  console.error(`[${timestamp}] ERROR ${message} ${JSON.stringify(payload)}`);
}

module.exports = {
  log,
  logError,
};
