let nextId = 2;

const documents = [
  {
    "id": 0,
    "title": "getting-started.md",
    "content": "# Welcome to Collaborative Editor\n\nThis editor uses Operational Transformation (OT) to sync changes in real time.\n\n- Try opening another window or tab.\n- Type simultaneously to see real-time convergence!\n- Create new files using the + button in the left sidebar."
  },
  {
    "id": 1,
    "title": "notes.txt",
    "content": "Collaborative Notes\n===================\n- Zero lockups\n- Fast synchronization\n- VS Code-inspired minimal interface"
  }
];

export async function getAllDocuments() {
  return documents.map(d => ({
    id: d.id,
    title: d.title,
    content: d.content
  }));
}

export async function getDocumentByID(id) {
  const doc = documents.find((doc) => doc.id === id);
  return doc;
}

export async function createDocument(title, content = "") {
  const newDoc = {
    id: nextId++,
    title: title || `untitled-${nextId}.txt`,
    content: content || ""
  };
  documents.push(newDoc);
  return newDoc;
}

export async function updateDocumentByID(id, content) {
  const index = documents.findIndex((doc) => doc.id === id);
  if (index === -1) return null;

  documents[index].content = content;
  return documents[index];
}

export async function deleteDocumentByID(id) {
  const index = documents.findIndex((doc) => doc.id === id);
  if (index === -1) return false;
  documents.splice(index, 1);
  return true;
}
