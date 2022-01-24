const app = require("express")();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cros: {
    // origin: "http://localhost:3000",
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 8000;

const users = {};

io.on("connection", (socket) => {
  if (!users[socket.id]) {
    users[socket.id] = socket.id;
  }

  //to get socketid of ourself
  socket.emit("id", socket.id);

  io.sockets.emit("allUser", users);

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callRequest", {
      signal: data.signalData,
      from: data.from,
    });
  });

  socket.on("acceptCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  // socket.on("disconnect", () => {
  //   delete users[socket.id];
  // });
});

server.listen(PORT, () => {
  console.log(`Server running...`);
});
