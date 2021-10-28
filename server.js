const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { setTimeout } = require('timers');
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets


//Don't touch the DOM
//All movement is recorded in the array below, based on the information inside, it will track players and their current position.

//Array of total players joined
let players = []




app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/style.css', (req, res) => {
    res.sendFile(__dirname + '/style.css');
});
app.get('/public/redlightgreenlight.mp3', (req, res) => {
    res.sendFile(__dirname + '/public/redlightgreenlight.mp3');
});
app.get('/public/mechanicalnoise.mp3', (req, res) => {
    res.sendFile(__dirname + '/public/mechanicalnoise.mp3');
});
app.get('/public/gunshot.mp3', (req, res) => {
    res.sendFile(__dirname + '/public/gunshot.mp3');
});
//I tried the using middleware but couldn't get it to work
// app.use(express.static('public'))


//TIMER
//Set the countdown value to update through a function server side?

let maxSeconds = 120
let secondTick = 0
let dollStatus = "off"
let timeLeft = (maxSeconds - secondTick)

function turningDoll() {
    dollStatus = "arming"
    setTimeout(armedDoll, 5000);
};
function armedDoll() {
    dollStatus = "on"
    setTimeout(disarmDoll, 8000);
};
function disarmDoll() {
    dollStatus = "off"
};

const dollArming = [115, 100, 80, 60, 40, 28, 15];

function tick() {
    if (secondTick > maxSeconds) {
        // clearInterval(myInterval);
        players.forEach(player => {
            if (timeLeft < 1 && player.position < 750)
                player.alive = false
        });
        return;
    } else {
        timeLeft = (maxSeconds - secondTick)

        if (dollArming.includes(timeLeft)) {
            turningDoll();
        }

        secondTick++;
        players.forEach(player => {
            if (timeLeft < 1 && player.position < 750)
                player.alive = false
        });
        io.emit('updateTimer', secondTick, timeLeft, dollStatus, players)
    }
}
var myInterval = null
function startButton() {
    clearInterval(myInterval);
    myInterval = setInterval(tick, 1000)
}

function resetButton() {
    clearInterval(myInterval);
}


io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id)

    //Player is added to the player array upon connection
    let newPlayer = {
        //Add a name
        name: Math.floor(Math.random() * 456),
        id: socket.id, //This isn't doing anything
        position: 0,
        // alive: true
        timeOfDeath: null
        //Make the sound condition that if the timeOfDeath occurs, make timeOfDeath Date.now()
        //If the player is not null AND timeOfDeath isn't within a few seconds of timeLeft play the gunshot.

    }
    //If there's a lobby we can add nickname key and form input as the value later
    players.push(newPlayer)




    socket.emit('new_player', newPlayer);

    socket.on('movement', () => {
        //When the client emits movement, this will run

        //If player is dead, he can't move
        if (newPlayer.alive == false) {
            newPlayer.position = newPlayer.position + 0

            //If player is alive, but moves, his status changes to dead
        } else if (newPlayer.position < 750) {
            if (timeLeft < 1) {
                newPlayer.alive = false
            }
            if (dollStatus == "on") {
                newPlayer.shot = true
                newPlayer.alive = false
                newPlayer.timeOfDeath = Date.now()
                console.log("This player just died" + newPlayer)
                //Otherwise, move forward
            } else {
                newPlayer.position = newPlayer.position + 1
            }
        }
        // Server needs to know if the doll is red or not
        // Code if the light is red, kill them upon movement

        //Broadcast the character div to move forward
        io.emit('movement', players, dollStatus) //players is the array of objects being passed through to all clients
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');

        for (let i = 0; i < players.length; i++) {
            if (players[i].id === socket.id) {
                //Removes the player from the player list when they disconnect
                players.splice(i, 1)
            }
        }
    });
    //LISTEN FOR PLAYER REFRESH BUTTON
    socket.on('clickRefresh', () => {
        console.log("You are clicking refresh")
        io.emit('clickRefresh', players)
    })
    //LISTEN FOR RESET BUTTON
    socket.on('clickReset', () => {
        console.log("You are clicking reset")
        secondTick = 0
        players.forEach(element => {
            element.position = 0
            element.alive = true
        });
        maxSeconds = 120
        secondTick = 0
        disarmDoll()
        resetButton()
        io.emit('clickReset', players)
    })
    //LISTEN FOR START TIMER BUTTON
    socket.on('clickStart', () => {
        console.log("You are clicking start")
        startButton()
        io.emit('clickStart', players)
    })


});

//Global kill conditions?






server.listen(PORT, () => {
    console.log('listening on *:3000');
});