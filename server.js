const net = require("net");

const PORT = 1608;
let clients = [];

//Message types for different notifications here :
const MESSAGE_TYPES = {
  WELCOME: 'WELCOME',
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  CHAT: 'CHAT'
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
        //Name Validation is done here
        if (message.length < 2) {
          socket.write("\nName must be at least 2 characters long. Enter your name: ");
          return;
        }
        client.name = message;
        sendToClient(socket, MESSAGE_TYPES.WELCOME, `\nWelcome, ${client.name}!`);
        broadcast(MESSAGE_TYPES.JOIN, `${client.name} has joined the chat.`, socket);
        return;
      }

      // Handle chat message
      if (message.length > 0) {
        broadcast(MESSAGE_TYPES.CHAT, message, socket, client.name);
      }
    } catch (err) {
      console.error(`Error processing message from ${client.name || client.address}: ${err.message}`);
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

function formatMessage(type, message, senderName = null, isSender = false) {
  switch (type) {
    case MESSAGE_TYPES.WELCOME:
      return `${message}\n`;
    case MESSAGE_TYPES.JOIN:
    case MESSAGE_TYPES.LEAVE:
      return `${message}\n`;
    case MESSAGE_TYPES.CHAT:
      return isSender ? `You: ${message}\n` : `${senderName}: ${message}\n`;
    default:
      return `${message}\n`;
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