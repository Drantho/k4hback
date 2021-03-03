const express = require("express");
const cors = require("cors");
const compression = require("compression");
require('dotenv').config();

const db = require("./models");
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.use('/peerjs', peerServer);
app.use(compression());
app.use(cors())
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb', extended: true, parameterLimit: 50000 }));

const routes = require("./controllers/routes.js");

app.use(routes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static("../client/build"))
}

io.on('connection', socket => {
    console.log(`socket.on()connection`);
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId);
        console.log(`socket.on(join-room) fires`);

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId)
        })
    })
})

const PORT = process.env.PORT || 3001;
db.sequelize.sync({ force: false }).then(function () {
    server.listen(PORT, function () {
        console.log(`App now listening on port: ${PORT} view at: http://localhost:${PORT}`);
    });
});