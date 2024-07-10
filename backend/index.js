const express = require('express');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "https://combat-legends-frontend.onrender.com",
  }
});

let users = [];
let onGoingMatches = [];





function getUser(id) {
    return users.find(user => user.id == id);
}



function handleConnection(socket) {

 users.push({ id: socket.id, health:100 });

  
  socket.on("sendRequest", (data) => {
    if(users?.find(user => user.id==data[1]) !==undefined){
   
    if( onGoingMatches.find(user => user[0]==data[1] || user[1]==data[1] )){
      io.to(data[0]).emit("message", { 'success': false, 'message': "Sorry , the player is in a match , try again after sometime!" });
    }else{
      socket.to(data[1]).emit("request", { 'success': true, 'message': data[0]})
    }
    }else{
        io.to(data[0]).emit("message", { 'success': false, 'message': "Player not found!" });
    }
  })
  socket.on("attack", (data) => {
    const attackedUserIndex = users.findIndex(user => user.id === data[1])
    if( attackedUserIndex>-1){
    if ( users[attackedUserIndex].health - 10 <= 0) {
        const updatedUsers = [...users];
  
        updatedUsers[attackedUserIndex].health = 0;

    
        users = updatedUsers;

        
        onGoingMatches = onGoingMatches.filter(user => user[0] !== data[0] && user[1] !== data[0]);
        users=users.filter(user => user.id !== data[0] && user.id !== data[1]);


        io.to(data[0]).emit("end", { 'success': true, 'message': "You Won!" });
        io.to(data[1]).emit("end", { 'success': false, 'message': "You Lost!" });
    
      } else {
       
        const updatedUsers = [...users];
       
        updatedUsers[attackedUserIndex].health = updatedUsers[attackedUserIndex].health - 10;
        users = updatedUsers;

        let user1 = getUser(data[0]);
        let user2 = getUser(data[1]);
       
        
       io.to(data[0]).emit("sendUsers", { 'success': true, 'message': [user1,user2] });
        io.to(data[1]).emit("sendUsers", { 'success': true, 'message': [user2,user1] });
    }
  }

    
  })

  socket.on("accept", (data) => {

    if(users?.find(user => user.id==data[1]) !==undefined){
   
    if( onGoingMatches.find(user => user[0]==data[1] || user[1]==data[1] !=undefined)){
      io.to(data[0]).emit("message", { 'success': false, 'message': "Sorry , the player is in a match , try again after sometime!" });
    }else{
     
   io.to(data[0]).emit("message", { 'success': true, 'message': "Starting Match !" });
   io.to(data[1]).emit("message", { 'success': true, 'message': "Starting Match" });

    onGoingMatches.push(data);
    let user1 = getUser(data[0]);
    let user2 = getUser(data[1]);

     //sending emit to user1--->
     io.to(user1.id).emit("sendUsers", { 'success': true, 'message': [user1,user2] });

   io.to(user2.id).emit("sendUsers", { 'success': true, 'message': [user2,user1] });


    io.to(user1.id).emit("start", { 'success': true, 'message': "Match has been started !" })
    io.to(user2.id).emit("start", { 'success': true, 'message': "Match has been started !" })
    }
    }else{
        io.to(data[0]).emit("message", { 'success': false, 'message': "Player not found!" });
    }

  })
  socket.on("reject", (id) => {
        io.to(id).emit("message", { 'success': false, 'message': "Your Request is rejected !" });
  })
  socket.on('disconnect', () => {
  
    let id=socket?.id
    const user = onGoingMatches.find(user => {return user[0]==id || user[1]==id});
    if(user!==undefined){
   
    let opponentIndex=user[0]==id?1:0;
    if(user && opponentIndex){
       io.to(user[opponentIndex]).emit("end", { 'success': true, 'message': "You Won because Opponent Leaves The Match !" });
     }
   }
   users = users.filter(user => user.id !== id);
   onGoingMatches = onGoingMatches.filter(user => user[0] !== id && user[1] !== id);

  }
   );


}

app.use(cors({ credentials: true, origin: "https://combat-legends-frontend.onrender.com" }));

io.on('connection', handleConnection);

server.listen(process.env.PORT || 8000, () => {
  console.log('Server is listening on port 8000...');
});
