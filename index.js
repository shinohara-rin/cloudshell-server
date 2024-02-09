import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io'
import pty from "node-pty"

const app = express();
const server = createServer(app);

server.listen(3000, '0.0.0.0', () => {
    console.log('server running at http://localhost:3000');
});

app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

const io = new Server(server,{
    cors:{
        origin: "*",
        methods: ["GET", "POST"]
    }
})
io.on('connection', (s) => {
    const term = pty.spawn('ssh',['cloudshell'])
    s.on('data',(data)=>{
        term.write(data)
    })
    s.on('resize',({cols,rows})=>{
        term.resize(cols,rows)
    })
    term.onData((data)=>{
        s.emit('data',data)
    })
    term.onExit((evt)=>{
        s.emit('exit',evt)
        s.disconnect(true)
    })
    s.on('disconnect',()=>{
        term.kill(9)
    })
})