export default function Header() {
  const title = "collaborative text editor";
  const documentName = "Untitled Document";
  const username = "You";
  const users_online = 1;

  return (
    <header className="header">
      <h1>
        {title}
      </h1>
      <h3>{documentName} | {users_online} {users_online > 1 ? "Users are" : "User is"} online</h3>
      <span>Editing as {username}</span>
    </header>
  );
}