
/////////////////////////////////////////////

var entities = [], count = 0;
var io = require("socket.io").listen(8099);

var INITIAL_X = 5;
var INITIAL_Y = 5;
var INITIAL_VEL_X = 0;
var INITIAL_VEL_Y = 0;

io.set('log level', 1);
io.sockets.on("connection", function (socket) {
    var myNumber = count++;
    //assign number    
    var mySelf = entities[myNumber] = [myNumber, INITIAL_X, INITIAL_Y, INITIAL_VEL_X, INITIAL_VEL_Y];

    //Send the initial position and ID to connecting player
console.log(myNumber + ' sent: ' + 'I,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2]);
    socket.send('I,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2]);
    //Send to conencting client the current state of all the other players
    for (var entity_idx = 0; entity_idx < entities.length; entity_idx++) { //send initial update  
        if (entity_idx != myNumber) {
            entity = entities[entity_idx];
            if (typeof (entity) != "undefined" && entity != null) {

                console.log(myNumber + ' sent: C for ' + entity_idx);
                socket.send('C,' + entity[0] + ',' + entity[1] + ',' + entity[2]); //send the client that just connected the position of all the other clients 
            }
        }
    }
    //create new entity in all clients    
    socket.broadcast.emit("message",'C,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2]);
    socket.on("message", function (data) {
        
        //if (myNumber == 0)
        //    console.log(myNumber + ' sent: ' +data);
        var new_data = data.split(',');
        if (new_data[0] == 'UM') {
            mySelf[1] = new_data[1];
            mySelf[2] = new_data[2];
            mySelf[3] = new_data[3];
            mySelf[4] = new_data[4];
            mySelf[5] = new_data[5];
	    mySelf[6] = new_data[6];
            //Update all the other clients about my update
            socket.broadcast.emit("message",
			'UM,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2] + ',' + mySelf[3] + ',' + mySelf[4] + ',' + mySelf[5] + ',' + mySelf[6]);
        }
        else if (new_data[0] == 'S') { // a s message
            var shoot_info = [];
            shoot_info[0] = new_data[1]; //ini x
            shoot_info[1] = new_data[2]; //ini y

            shoot_info[2] = new_data[3]; //degrees

            //Update all the other clients about my update
            socket.broadcast.emit("message",
			'S,' + mySelf[0] + ',' + shoot_info[0] + ',' + shoot_info[1] + ',' + shoot_info[2]);
        }
    });

});

