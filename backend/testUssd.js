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
    }
  };
}

// Mock req object factory
function createMockReq(text) {
  return {
    body: {
      sessionId: 'test-session',
      serviceCode: '*384*6014#',
      phoneNumber: '+233244123456',
      text: text
    }
  };
}

async function runTests() {
  console.log("--- TEST 1: Step 0 (Empty Text) ---");
  await handleUssd(createMockReq(''), createMockRes());

  console.log("--- TEST 2: Step 1 (Select Network 1) ---");
  await handleUssd(createMockReq('1'), createMockRes());

  console.log("--- TEST 3: Step 2 (Select Bundle 1 for Network 1) ---");
  await handleUssd(createMockReq('1*1'), createMockRes());

  console.log("--- TEST 4: Step 3 (Enter Target Phone) ---");
  await handleUssd(createMockReq('1*1*0201234567'), createMockRes());

  console.log("--- TEST 5: Step 4 (Confirm Purchase) ---");
  // This will try to hit the DB and Paystack APIs
  await handleUssd(createMockReq('1*1*0201234567*1'), createMockRes());
  
  process.exit(0);
}

runTests();
