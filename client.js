const net = require("net");
const readline = require("readline");

const HOST = "127.0.0.1";
const PORT = 1608;

let isNameSet = false;

//Creating readline interface with custom prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//Creating socket connection
const client = new net.Socket();


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


rl.on("line", (line) => {
  if (line.trim()) {
    client.write(line);
  }
  if (isNameSet) {
    rl.prompt();
  }
});

// Handling Ctrl+C issue here
rl.on("SIGINT", () => {
  console.log("\nDisconnecting from server...");
  client.end();
});