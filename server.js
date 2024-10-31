const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const db = new sqlite3.Database("./chat.db");

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, message TEXT, profilePic TEXT)");
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("New user connected");

  db.all("SELECT id, message, profilePic FROM messages ORDER BY id ASC", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    rows.forEach((row) => {
      socket.emit("chat message", { id: row.id, msg: row.message, profilePic: row.profilePic });
    });
  });

  socket.on("chat message", ({ msg, profilePic }) => {
    db.run("INSERT INTO messages (message, profilePic) VALUES (?, ?)", [msg, profilePic], function(err) {
      if (err) {
        console.error(err);
        return;
      }
      const messageData = { id: this.lastID, msg, profilePic };
      io.emit("chat message", messageData);
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});