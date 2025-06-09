const net = require("net");

const PORT = 1608;
let clients = [];

// Message types for different notifications
const MESSAGE_TYPES = {
  WELCOME: 'WELCOME',
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  CHAT: 'CHAT',
  ERROR: 'ERROR',
  SYSTEM: 'SYSTEM'
};

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 1000, // 1 second window
  maxMessages: 5  // max messages per window
};

// Client message tracking for rate limiting
const messageCounts = new Map();

// Command handlers
const commands = {
  '/help': (client) => {
    const helpText = `
Available commands:
/help - Show this help message
/users - List all connected users
/clear - Clear your chat window
    `.trim();
    sendToClient(client.socket, MESSAGE_TYPES.SYSTEM, helpText);
  },
  '/users': (client) => {
    const userList = clients
      .filter(c => c.name)
      .map(c => c.name)
      .join(', ');
    sendToClient(client.socket, MESSAGE_TYPES.SYSTEM, `Connected users: ${userList}`);
  },
  '/clear': (client) => {
    sendToClient(client.socket, MESSAGE_TYPES.SYSTEM, '\x1Bc'); // ANSI clear screen
  }
};

const server = net.createServer((socket) => {
  //Initialize client object
  let client = {
    socket,
    name: null,
    address: `${socket.remoteAddress}:${socket.remotePort}`
  };

  //Adding client to the list
  clients.push(client);
  console.log(`New connection from ${client.address}`);

  //Send welcome message
  socket.write("\nEnter your name: ");

  socket.on("data", (data) => {
    try {
      const message = data.toString().trim();
      
      if (!client.name) {
        // Name validation
        if (message.length < 2) {
          socket.write("\nName must be at least 2 characters long. Enter your name: ");
          return;
        }
        if (message.length > 20) {
          socket.write("\nName must be less than 20 characters. Enter your name: ");
          return;
        }
        if (clients.some(c => c.name === message)) {
          socket.write("\nName is already taken. Enter your name: ");
          return;
        }
        client.name = message;
        sendToClient(socket, MESSAGE_TYPES.WELCOME, `\nWelcome, ${client.name}!`);
        broadcast(MESSAGE_TYPES.JOIN, `${client.name} has joined the chat.`, socket);
        commands['/help'](client);
        return;
      }

      // Handle commands
      if (message.startsWith('/')) {
        const command = commands[message.split(' ')[0]];
        if (command) {
          command(client);
        } else {
          sendToClient(socket, MESSAGE_TYPES.ERROR, "Unknown command. Type /help for available commands.");
        }
        return;
      }

      // Handle chat message
      if (message.length > 0) {
        if (isRateLimited(client)) {
          sendToClient(socket, MESSAGE_TYPES.ERROR, "You are sending messages too quickly. Please wait a moment.");
          return;
        }
        if (message.length > 500) {
          sendToClient(socket, MESSAGE_TYPES.ERROR, "Message too long. Maximum length is 500 characters.");
          return;
        }
        broadcast(MESSAGE_TYPES.CHAT, message, socket, client.name);
      }
    } catch (err) {
      console.error(`Error processing message from ${client.name || client.address}: ${err.message}`);
      sendToClient(socket, MESSAGE_TYPES.ERROR, "An error occurred while processing your message.");
    }
  });

  socket.on("end", () => {
    removeClient(client);
  });

  socket.on("error", (err) => {
    console.error(`Error with client ${client.name || client.address}: ${err.message}`);
    removeClient(client);
  });

  socket.on("close", () => {
    removeClient(client);
  });
});

function removeClient(client) {
  const index = clients.indexOf(client);
  if (index !== -1) {
    clients.splice(index, 1);
    if (client.name) {
      broadcast(MESSAGE_TYPES.LEAVE, `${client.name} has left the chat.`, client.socket);
    }
    console.log(`Client ${client.name || client.address} disconnected`);
  }
}

function broadcast(type, message, senderSocket, senderName = null) {
  const formattedMessage = formatMessage(type, message, senderName);
  
  clients.forEach((client) => {
    if (client.socket !== senderSocket && !client.socket.destroyed) {
      try {
        client.socket.write(formattedMessage);
      } catch (err) {
        console.error(`Error broadcasting to client ${client.name || 'unknown'}: ${err.message}`);
        removeClient(client);
      }
    }
  });

  // Send message back to sender if it's a chat message
  if (type === MESSAGE_TYPES.CHAT && senderSocket && !senderSocket.destroyed) {
    try {
      senderSocket.write(formattedMessage);
    } catch (err) {
      console.error(`Error sending message to sender ${senderName}: ${err.message}`);
    }
  }
}

function isRateLimited(client) {
  const now = Date.now();
  const clientKey = client.address;
  
  if (!messageCounts.has(clientKey)) {
    messageCounts.set(clientKey, { count: 0, windowStart: now });
    return false;
  }

  const stats = messageCounts.get(clientKey);
  
  if (now - stats.windowStart > RATE_LIMIT.windowMs) {
    stats.count = 0;
    stats.windowStart = now;
    return false;
  }

  stats.count++;
  return stats.count > RATE_LIMIT.maxMessages;
}

function formatMessage(type, message, senderName = null, isSender = false) {
  const timestamp = new Date().toLocaleTimeString();
  
  switch (type) {
    case MESSAGE_TYPES.WELCOME:
      return `${message}\n`;
    case MESSAGE_TYPES.JOIN:
    case MESSAGE_TYPES.LEAVE:
      return `[${timestamp}] ${message}\n`;
    case MESSAGE_TYPES.CHAT:
      return isSender 
        ? `[${timestamp}] You: ${message}\n` 
        : `[${timestamp}] ${senderName}: ${message}\n`;
    case MESSAGE_TYPES.ERROR:
      return `[${timestamp}] Error: ${message}\n`;
    case MESSAGE_TYPES.SYSTEM:
      return `[${timestamp}] System: ${message}\n`;
    default:
      return `[${timestamp}] ${message}\n`;
  }
}

function sendToClient(socket, type, message) {
  if (!socket.destroyed) {
    try {
      socket.write(formatMessage(type, message));
    } catch (err) {
      console.error(`Error sending message to client: ${err.message}`);
    }
  }
}

server.listen(PORT, () => {
  console.log(`Chat server started on port ${PORT}`);
  console.log(`Waiting for connections...`);
});