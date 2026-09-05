import { useState, useEffect } from "react";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";

function App() {
  const buttons = ["Bold", "Italic", "Underline", "StrikeThrough", "Code"];
  const [text, setText] = useState("");

  const words = text.trim() === "" ? 0
                                   : text.trim().split(/\s+/).length;

  useEffect(() => {
    async function loadDocument(){
      try {
        const res = await fetch("http://localhost:3000/api/document/1");
        if(!res.ok) throw new Error("Network Error");

        const data = await res.json();
        if(data.content){
          setText(data.content);
        }
      } catch(err) {
        console.log("Failed to load Document: ", err);
      }
    }
    loadDocument();
  }, []);

  useEffect(() => {
    document.title = `Collaborative Editor - ${text.length} characters`;
  }, [text]);

  async function sendContent(){
    try {
      const res = await fetch("http://localhost:3000/api/document/1", {
        method: "PUT",
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify({
          "content" : text
        })
      });

      if(!res.ok) throw new Error("Network Error");
      const data = await res.json();
      console.log(data);

    } catch(err) {
      console.log("Failed to update Document: ", err);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`Saving document...`);
      console.log(`Characters : ${text.length}`)
      console.log(`Words : ${words}`)

      sendContent();
    }, 500);

    return () => {
      clearTimeout(timer);
    }
  }, [text]);

  function handleTextChange(new_text){
    setText(new_text);
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
