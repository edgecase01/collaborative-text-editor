import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";

function App() {
  const buttons = ["Bold", "Italic", "Underline", "StrikeThrough", "Code"];
  const [text, setText] = useState("");

  const words = text.trim() === "" ? 0
                                   : text.trim().split(/\s+/).length;

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to server socket');
      socket.send(JSON.stringify({
        "type" : "JOIN_DOCUMENT",
        "payload" : {
          "documentId" : 1
        }
      }));
    }

    socket.onerror = (err) => {
      console.error('WebSocket error : ', err);
    }

    socket.onmessage = (message) => {
      try {
        const parsedData = JSON.parse(message.data);
        console.log("Server : ", parsedData);
        if(parsedData.type === "DOCUMENT_UPDATED"){
          setText(parsedData.payload.content);
        } else if(parsedData.type === "JOINED_DOCUMENT"){
          if(parsedData.payload.content !== undefined){
            setText(parsedData.payload.content);
          }
        }

      } catch(err){
        console.error("Error : ", err);
      }
    };

    socket.onclose = () => {
      console.log('Connection closed');
    }

    return () => {
      socket.close();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    document.title = `Collaborative Editor - ${text.length} characters`;
  }, [text]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`Saving document...`);
      console.log(`Characters : ${text.length}`)
      console.log(`Words : ${words}`)
    }, 500);

    return () => {
      clearTimeout(timer);
    }
  }, [text]);

  function handleTextChange(new_text){
    setText(new_text);
    if(socketRef.current?.readyState === WebSocket.OPEN){
      socketRef.current?.send(JSON.stringify({
        "type" : "UPDATE_DOCUMENT",
        "payload" : {
          "documentId" : 1,
          "content" : new_text
        }
      }));
    }
  }

  function handleFormat(format){
    console.log("Format requested : ", format);
  }

  return (
    <>
      <Header /> 
      <Toolbar buttons={buttons} onFormat={handleFormat} />
      <Editor text={text} onTextChange={handleTextChange} />
    </>
  );
}

export default App;
