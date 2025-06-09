const net = require("net");
const readline = require("readline");

const HOST = "https://chatroom-nish.onrender.com"; //deployment link
//comment out the following code to run on localhost
// const HOST = "127.0.0.1";
const PORT = 1608;

let isNameSet = false;
let isTyping = false;

// Creating readline interface with custom prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Creating socket connection
const client = new net.Socket();

// Clear screen function
function clearScreen() {
  process.stdout.write('\x1Bc');
}

// Handle connection
client.connect(PORT, HOST, () => {
  console.log(`Connected to chat server at ${HOST}:${PORT}`);
});

// Handling incoming data
client.on("data", (data) => {
  const message = data.toString();
  
  // If we haven't set the name yet, don't show the prompt
  if (!isNameSet) {
    process.stdout.write(message);
    if (message.includes("Welcome")) {
      isNameSet = true;
      rl.setPrompt('> ');
      rl.prompt();
    }
  } else {
    // Clear the current line if user is typing
    if (isTyping) {
      process.stdout.write('\r\x1B[K');
    }
    process.stdout.write(message);
    rl.prompt();
  }
});

// Handling connection close
client.on("close", () => {
  console.log("\nDisconnected from server");
  rl.close();
  process.exit(0);
});

// Handling errors
client.on("error", (err) => {
  console.error("\nConnection error:", err.message);
  rl.close();
  process.exit(1);
});

// Handle user input
rl.on("line", (line) => {
  if (line.trim()) {
    client.write(line);
  }
  if (isNameSet) {
    rl.prompt();
  }
});

// Handle typing state
rl.on("SIGINT", () => {
  console.log("\nDisconnecting from server...");
  client.end();
});

// Handle typing indicator
process.stdin.on('keypress', (str, key) => {
  if (isNameSet && !isTyping) {
    isTyping = true;
  }
});

// Handle enter key
process.stdin.on('keypress', (str, key) => {
  if (key.name === 'enter') {
    isTyping = false;
  }
});

// Enable raw mode for keypress events
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (data) => {
  if (data[0] === 3) { // Ctrl+C
    process.emit('SIGINT');
  }
});