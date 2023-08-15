import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"


const socket = io.connect('http://localhost:5000')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const [ open, setOpen ] = useState(true);
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

		socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	function shareScreen(){
	    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	}

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream	
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream	
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	return (
		<>
		<div className="header">
		  <img style={{ height: "35px", width: "35px", alignItems: "center" }} src="screeno.png" alt="logo"/>
		  <h1 style={{ textAlign: "center", color: '#fff' }}>Screeno</h1>
		  <div className="Icon">
		    <MoreVertIcon 
		    style={{ color: "#fff" }} 
		    fontSize= "large" onClick={() => setOpen(prevOpen => !prevOpen)}/>
		  </div>
		</div>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay />:
					null}
				</div>
			</div>
			<div className={`myId ${open ? '' : 'visible'}`}>
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px", marginTop: "15px" }}
				/>
				<CopyToClipboard text={me} style={{ marginBottom: "1rem" }}>
					<Button fontColor="#075e54" variant="contained" 
					startIcon={<AssignmentIcon style={{ color: "#075e54" }} fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					className="input"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="primary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton style={{ color: "#075e54", backgroundColor: "#efefef" }} aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					{idToCall}
				</div>
				<div className="line"></div>
				<Button className="share" variant="contained" 
				style={{ backgroundColor: "#075e54", marginTop: "10px", color: "#fff"}} 
				onClick={shareScreen}>
					Share screen
				</Button>
			</div>
			<div className="calling">
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App;
