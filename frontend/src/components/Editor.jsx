export default function Editor({ text, onTextChange }){

  const words = text.trim() === "" ? 0
                                   : text.trim().split(/\s+/).length;

  return (
    <main className="editor">
      <textarea 
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Start typing..."
      />

      <p>Characters : {text.length}</p>
      <p>Words : {words}</p>
    </main>
  );
}
