const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const ngrok = require("ngrok");
require("dotenv").config();

const port = process.env.PORT;
const authToken = process.env.AUTHTOKEN;
//middlewares
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/uuid", (req, res) => {
  res.redirect("/" + uuidv4());
});

app.get("/:room", (req, res) => {
  res.render("room", {
    roomId: req.params.room,
  });
});

//socket connection
io.on("connection", (socket) => {
  //joining the room in socket
  socket.on("join-room", (roomId) => {
    room = io.sockets.adapter.rooms.get(roomId);
    var roomSize = 0;
    //setting the roomSize
    if (room) {
      roomSize = room.size;
    }
    //if roomSize is less than 2 join user to to the room
    if (roomSize < 2) {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("user-connected");
      socket.on("disconnect", () => {
        socket.broadcast.to(roomId).emit("user-disconnected");
      });
      socket.on("can-play", () => {
        socket.broadcast.to(roomId).emit("can-play");
      });
      socket.on("clicked", (id) => {
        socket.broadcast.to(roomId).emit("clicked", id);
      });
    }
    //if roomsize is greateer that two emit that room is full
    else {
      socket.emit("full-room");
    }
  });
});
server.listen(port, () => {
  console.log("server is running on PORT", port);
});

(async function () {
  const url = await ngrok.connect({
    proto: "http",
    addr: port,
    authtoken: authToken,
  });
  console.log(url);
})();
