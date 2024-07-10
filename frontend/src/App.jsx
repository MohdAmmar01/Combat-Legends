import React, { useState, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import player1Img from './assets/player1.gif';
import player2Img from './assets/player2.gif';
import mid from "./assets/mid.png"
import bgMusic from "./assets/sounds/bg.mp3"; // Import background music file
import atk from "./assets/sounds/attack.mp3"; // Import background music file
import wn from "./assets/sounds/win.mp3"; // Import background music file
import ls from "./assets/sounds/lose.mp3"; // Import background music file
import notification from "./assets/sounds/notification.mp3"
import st from "./assets/sounds/start.mp3"

import useSound from 'use-sound';
import load from "./assets/loader/loader.gif"

function App() {
  const [socket, setSocket] = useState();
  const [myDetail, setmyDetail] = useState(null);
  const [opponentDetails, setOpponentDetails] = useState(null);
  const [searchPopup, setSearchPopup] = useState(true);
  const [acceptPopup, setAcceptPopup] = useState(false);
  const [acceptPopupId, setAcceptPopupId] = useState(null);
  const [loading,setLoading]=useState(true);
  const [SearchId, setSearchId] = useState('');
  const [MatchStarted,setMatchStarted]=useState(false);
  const [attacking, setAttacking] = useState(false);
  const [leftPlayerPosition, setLeftPlayerPosition] = useState(0);

  const [play, { stop }] = useSound(bgMusic, { volume: 0.25,loop:true });

  useEffect(() => {
    const newSocket = io('https://combat-legends.onrender.com');
    setSocket(newSocket);
    setLoading(false);
     

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    play();
    return () => {
      stop();
    };
  }, [play, stop]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected successfully');
    });

    socket.on('message', (data) => {
      if(data.success==true){
        toast.success(data?.message);
      }else{
        toast.error(data?.message);
      }
    });

    socket.on('request', (data) => {
      setSearchPopup(false)
      new Audio(notification).play();
      setAcceptPopup(true)
      setAcceptPopupId(data?.message)
    });

    socket.on('sendUsers', (data) => {
      let myDetail = data?.message?.filter((item) => item.id === socket?.id);
      let opponentDetails = data?.message?.filter((item) => item.id !== socket?.id);
      setmyDetail(myDetail[0]);
      setOpponentDetails(opponentDetails[0]);
    });

    socket.on("start",(data)=>{
      setMatchStarted(true)
      setAcceptPopup(false)
      setSearchPopup(false)
      setAcceptPopupId('')
      setSearchId('')
      new Audio(st).play();
    });

    socket.on('end', (data) => {
      if(data.success){
      new Audio(wn).play();
        toast.success(data.message);
      } else {
        new Audio(ls).play();
        toast.error(data.message);
      }
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    });
  
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      let cur = leftPlayerPosition;
  
      if (event.code === "ArrowLeft" && cur - 10 >= 0) {
        setLeftPlayerPosition(cur - 10);
      } else if (event.code === "ArrowRight" && cur + 10 < window.innerWidth) {
        setLeftPlayerPosition(cur + 10);
      } else if (event.code === 'Space') {
        setAttacking(true);
        new Audio(atk).play(  );
        socket?.emit('attack', [socket?.id,opponentDetails?.id]);
        setTimeout(() => {
          setAttacking(false);
        }, 1000);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [leftPlayerPosition]);
  
  
  if(loading || !socket || !socket.id){
    return (
    <div className="loading_container">
      <img className='loading' src={load} alt="loading..." />
      </div>
    )
  } else {
    return (
      <div className="container">
         <div className="container">
        {searchPopup ?
          <Popup open={searchPopup} closeOnDocumentClick={false}>
            <div className='modal'>
              <h1>Send Invitaion</h1>
              <input readOnly value={socket?.id} placeholder='Your ID :' />
              <input value={SearchId} onChange={(e) => { setSearchId(e.target.value) }} placeholder='Enter your friends ID : ' />
  
              <button onClick={() => {
                socket.emit('sendRequest', [socket?.id,SearchId]);
                toast.success('Invitaion Sent');
              }}>Send</button>
            </div>
          </Popup>
          : null}
          {acceptPopup ?
          <Popup open={acceptPopup} closeOnDocumentClick={false}>
            <div className='modal'>
              <h1>Accept Invitaion</h1>
              <input readOnly value={`Accept Fight Challenge of player with ID ${acceptPopupId}`} placeholder='Player ID :' />
              <button onClick={() => {
                socket.emit('accept', [socket?.id,acceptPopupId]);
                setAcceptPopupId('')
                setAcceptPopup(false)
                setSearchPopup(true)
              }}>Accept</button>
              <button className='reject' onClick={() => {
                socket.emit('reject', acceptPopupId);
                setAcceptPopupId('')
                setAcceptPopup(false)
                setSearchPopup(true)
              }}>Reject</button>
            </div>
          </Popup>
          : null}
  {
    !searchPopup && !acceptPopup && MatchStarted?
          <div className='match' >
            <div className='header'>
              <div    className='header_part1'>
                <h2>{`Your Health : ${myDetail?.health}`}</h2>
              <div style={{width: `${myDetail?.health}%`}}></div>
              </div>
              <img src={mid}  className='header_part2'></img>
  
              <div  className='header_part3'>
              <h2>{`Opponent Health : ${opponentDetails?.health}`}</h2>
              <div  style={{width:`${opponentDetails?.health}%`}} ></div>
              </div>
            </div>
            
            <div className='players'>
            <img className={`img_1 ${attacking ? 'attacking' : ''}`} src={player1Img} style={{ left: `${leftPlayerPosition}px` }}></img>
              <img className='img_2' src={player2Img} ></img>
          </div>
          </div>
  :null}
  
        <ToastContainer />
      </div>
      </div>
    );
  }
}

export default App;
