# 🔧 Real-Time Chat Application

This is a simple real-time chat application built using **Node.js's native `net` module**, implementing both the server and client with **no external libraries**, as per the assignment requirements.

---

## 📌 Objective

The goal of this application is to provide a **terminal-based shared chatroom** where multiple clients can connect to a server using TCP sockets, register with a name, and exchange messages in real-time. All connected users receive chat messages broadcasted from others, including join and leave notifications.

---

## 🛠️ Tech Stack

- **Language:** Node.js (native)
- **Concurrency:** Event-driven (async I/O with `net` module)
- **UI:** CLI interface using `readline` (no GUI)
- **Socket API:** Node.js `net` (TCP)

---

## 🚀 Getting Started

### 🖥️ Requirements

- Node.js (v14+)
- Terminal (CLI)

### 📁 Project Structure

.
├── client.js # Terminal client implementation
└── server.js # TCP chat server implementation

---

### ▶️ Running the Chat Server

1. Open a terminal.
2. Navigate to the folder containing `server.js`.
3. Run:

node server.js


You should see:

Chat server started on port 1608
Waiting for connections...


💬 Running the Chat Client
Open a new terminal for each client.

Navigate to the same folder.

Run:

node client.js
When prompted, enter your name (minimum 2 characters).

You can now start chatting! Each message will be sent to all other users in real-time.


# 🧠 Architecture and Concurrency Handling

## Server

- Uses `net.createServer()` to handle incoming TCP connections.
- Maintains a list of connected clients (`clients` array).
- Each client is represented as an object storing:
  - The socket
  - Their name
  - Their IP address/port
- When a message is received:
  - If it's a name, it's registered.
  - If it's a chat message, it is **broadcasted to all other clients** using `socket.write()`.
- Handles disconnection (`end`, `close`) and errors gracefully, cleaning up the client list.

## Client

- Connects using `net.Socket()` to the server.
- Uses `readline` to take user input and show messages.
- Handles server prompts and echoing of messages cleanly with real-time display.
- Listens for Ctrl+C and sends `.end()` before closing the connection to inform the server.

---

# ⚙️ Design Choices and Assumptions

- **No external libraries**: Only core `net`, `readline`, and built-in Node.js modules are used.
- **Terminal-based interface**: Per assignment constraints, no browser UI or frontend framework is used.
- **Graceful disconnection**: Clients disconnect cleanly with a message shown to others.
- **Chat message format**:
  - New users: `user has joined the chat.`
  - Exiting users: `user has left the chat.`
  - Chat messages: `username: message` or `You: message` if you're the sender.

---

# 🌐 Deployment & Access

This application is designed to run in a local terminal environment. It does **not** require a browser.

### To test locally:

- Run `server.js` in one terminal.
- Run multiple `client.js` instances in different terminals.

### For remote access or deployment:

- Host the server on a public cloud VM (e.g., AWS EC2).
- Clients can connect by changing the `HOST` value in `client.js` to the server's public IP:

```js
const HOST = "YOUR_SERVER_PUBLIC_IP";
```

Then rerun the client.