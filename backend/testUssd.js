require('dotenv').config();
const { handleUssd } = require('./controllers/ussdController');

// Mock res object
function createMockRes() {
  return {
    set: function(header, value) {
      console.log(`Header set: ${header} = ${value}`);
    },
    send: function(response) {
      console.log(`\n=== USSD RESPONSE ===\n${response}\n=====================\n`);
    },
    json: function(response) {
      console.log(`\n=== USSD JSON RESPONSE ===\n${JSON.stringify(response, null, 2)}\n=====================\n`);
    }
  };
}

// Mock req object factory for GiantSMS
function createMockReq(data, isNew = false) {
  return {
    body: {
      sessionId: 'test-session-giantsms',
      msisdn: '233244123456',
      new: isNew,
      network: 3,
      data: data,
      timestamp: '20230712145113'
    }
  };
}

async function runTests() {
  console.log("--- TEST 1: Step 0 (Initial) ---");
  await handleUssd(createMockReq('*239*239#', true), createMockRes());

  console.log("--- TEST 2: Step 1 (Select Network 1) ---");
  await handleUssd(createMockReq('1', false), createMockRes());

  console.log("--- TEST 3: Step 2 (Select Bundle 1 for Network 1) ---");
  await handleUssd(createMockReq('1', false), createMockRes());

  console.log("--- TEST 4: Step 3 (Enter Target Phone) ---");
  await handleUssd(createMockReq('0201234567', false), createMockRes());

  console.log("--- TEST 5: Step 4 (Confirm Purchase) ---");
  // This will try to hit the DB and Paystack APIs
  await handleUssd(createMockReq('1', false), createMockRes());
  
  process.exit(0);
}

runTests();
