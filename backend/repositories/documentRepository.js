const documents = [
  {
    "id" : 0,
    "title": "first doc",
    "content": "hey this is my first doc"
  },
  {
    "id" : 1,
    "title": "second doc",
    "content": "hey this is my second doc"
  }
];

export async function getDocumentByID(id){
  const doc = documents.find((doc) => {
    return doc.id === id;
  });

  return doc;
}

export async function updateDocumentByID(id, content){
  const index = documents.findIndex((doc) => {
    return doc.id === id;
  });

  if(index === -1) return;

  documents[index].content = content;

  return documents[index].content;
}