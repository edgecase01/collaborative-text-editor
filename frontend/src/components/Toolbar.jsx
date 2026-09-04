export default function Toolbar({ buttons, onFormat }){
  return (
    <div className="toolbar">
      {buttons.map((e) => {
        return <button
                  key={e}
                  onClick={() => {onFormat(e)}}>
                    {e}
                  </button>;
      })}
    </div>
  );
}
