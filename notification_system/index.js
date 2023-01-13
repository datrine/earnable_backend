const { Server } = require("socket.io");
const { retrieveAccountInfoBySessID } = require("../db/account");
let usersIDMap = new Map();
/**
 * @type {Server}
 */
let io;
/**
 *
 * @param {import("http").Server} server
 */
let startSocket = async (server) => {
  io = new Server(server, {});
  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);
  io.on("connection", (socket) => {
    io.use(async (socket, next) => {
      let sessID = socket.handshake.auth.sessID;
      let accountRes = await retrieveAccountInfoBySessID(sessID);
      if (accountRes.err) {
        return socket.disconnect();
      }
      let account = accountRes.account;
      let { email } = account;
      socket.join(email);
      console.log(`${socket.id} joined ${email}`)
      next();
    });
  });
};

module.exports = { startSocket, io };
