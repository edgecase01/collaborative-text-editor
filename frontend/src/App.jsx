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
    fetch("http://localhost:3000/api/document")
      .then((res) => { res.json() })
      .then((data) => { setText(data.content) });
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
  }

  function handleFormat(format){
    console.log("Format requested : ", format);
  }

  return (
    <>
      <Header /> 
      <Toolbar buttons={buttons} onFormat={handleFormat}/>
      <Editor text={text} onTextChange={handleTextChange}/>
    </>
  );
}

export default App;
