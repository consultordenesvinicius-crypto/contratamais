const { StringDecoder } = require('string_decoder');

async function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
      buffer += decoder.write(data);
    });

    req.on('end', () => {
      buffer += decoder.end();
      if (!buffer) {
        resolve(null);
        return;
      }

      const contentType = req.headers['content-type'] || '';

      try {
        if (contentType.includes('application/json')) {
          resolve(JSON.parse(buffer));
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams(buffer);
          const result = {};
          params.forEach((value, key) => {
            result[key] = value;
          });
          resolve(result);
        } else {
          resolve(buffer);
        }
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Requested-With',
  });
  res.end(JSON.stringify(payload));
}

module.exports = {
  parseRequestBody,
  sendJson,
};
