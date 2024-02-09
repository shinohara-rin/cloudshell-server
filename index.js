import express from 'express';
import { cpus } from 'node:os';
import { createServer } from 'node:http';
import { Server } from 'socket.io'
import pty from "node-pty"
import { spawn } from 'node:child_process';

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

const qemuCmd = '/usr/local/bin/qemu-system-morello';
const qemuArgs = [
  '-M', 'virt,gic-version=3',
  '-cpu', 'morello',
  '-smp', `${cpus().length}`,
  '-bios', 'edk2-aarch64-code.fd',
  '-m', process.env.MEMORY || '12G',
  '-nographic',
  '-drive', 'if=none,file=/home/cheri/cheribsd-morello-purecap.img,id=drv,format=raw',
  '-device', 'virtio-blk-pci,drive=drv',
  '-device', 'virtio-net-pci,netdev=net0',
  '-netdev', 'user,id=net0,hostfwd=tcp:127.0.0.1:2222-:22',
  '-device', 'virtio-rng-pci'
];

console.log('starting qemu process with command: ' + qemuCmd + ' ' + qemuArgs.join(' '));
const qemuProcess = spawn(qemuCmd, qemuArgs);

qemuProcess.stdout.on('data', (data) => {
    // check for string "login:"
    if (data.toString().includes('login:')) {
        console.log('qemu process started');
    }
    console.log(`stdout: ${data}`);
});

qemuProcess.on('close', (code) => {
  console.log(`qemu exited with code ${code}`);
});
