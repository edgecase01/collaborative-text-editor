import { useState, useEffect, useLayoutEffect, useRef } from "react";
import ActivityBar from "./components/ActivityBar";
import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import Editor from "./components/Editor";
import StatusBar from "./components/StatusBar";
import ShareModal from "./components/ShareModal";
import {
  computeOperations,
  applyOperations,
  transformPair,
  transformCursors
} from "./utils/operation";

const API_BASE = "http://localhost:3000/api/document";
const WS_URL = "ws://localhost:3000";

function App() {
  const [documents, setDocuments] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState("");
  const [cursorInfo, setCursorInfo] = useState({ line: 1, col: 1 });
  const [isConnected, setIsConnected] = useState(false);
  const [otStateName, setOtStateName] = useState("SYNCHRONIZED");
  const [revision, setRevision] = useState(0);
  const [peerCount, setPeerCount] = useState(1);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  const socketRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingCursorRef = useRef(null);

  // Unique client ID to prevent echo loops / double application of self edits
  const clientIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
  );

  // OT Client State
  // "SYNCHRONIZED" | "AWAITING_CONFIRM" | "AWAITING_WITH_BUFFER"
  const stateRef = useRef("SYNCHRONIZED");
  const revisionRef = useRef(0);
  const pendingOpsRef = useRef(null);
  const bufferOpsRef = useRef(null);
  const docTextRef = useRef("");
  const activeIdRef = useRef(null);

  // Keep activeIdRef in sync
  activeIdRef.current = activeId;

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Synchronously restore cursor position after React commits DOM text changes
  useLayoutEffect(() => {
    if (pendingCursorRef.current && textareaRef.current) {
      const { start, end } = pendingCursorRef.current;
      textareaRef.current.setSelectionRange(start, end);
      pendingCursorRef.current = null;
    }
  }, [text]);

  function updateOtState(newState) {
    stateRef.current = newState;
    setOtStateName(newState);
  }

  function updateRevision(newRev) {
    revisionRef.current = newRev;
    setRevision(newRev);
  }

  function sendOperations(docId, rev, ops) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    socketRef.current.send(
      JSON.stringify({
        type: "APPLY_OPERATION",
        payload: {
          documentId: docId,
          clientId: clientIdRef.current,
          revision: rev,
          operations: ops
        }
      })
    );
  }

  // 1. Initial Fetch of Documents from API (honoring ?doc=X in URL)
  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch(API_BASE);
        if (res.ok) {
          const list = await res.json();
          setDocuments(list);
          if (list.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const docParam = params.get("doc");
            let target = list[0];
            if (docParam !== null) {
              const matched = list.find((d) => String(d.id) === docParam);
              if (matched) target = matched;
            }

            setActiveId(target.id);
            activeIdRef.current = target.id;
            docTextRef.current = target.content || "";
            setText(target.content || "");
            window.history.replaceState(null, "", `?doc=${target.id}`);

            // Send initial JOIN_DOCUMENT if socket is already open
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(
                JSON.stringify({
                  type: "JOIN_DOCUMENT",
                  payload: {
                    documentId: target.id,
                    clientId: clientIdRef.current
                  }
                })
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    }
    loadDocuments();
  }, []);

  // 2. WebSocket Connection Lifecycle with Clean Reconnect Guard
  useEffect(() => {
    let reconnectTimeout = null;
    let isCleanedUp = false;

    function connect() {
      if (isCleanedUp) return;

      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isCleanedUp) {
          socket.close();
          return;
        }
        setIsConnected(true);
        if (activeIdRef.current !== null) {
          socket.send(
            JSON.stringify({
              type: "JOIN_DOCUMENT",
              payload: {
                documentId: activeIdRef.current,
                clientId: clientIdRef.current
              }
            })
          );
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onclose = () => {
        setIsConnected(false);
        setPeerCount(1);
        if (!isCleanedUp) {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          // Ignore messages for other documents
          if (payload && payload.documentId !== undefined && payload.documentId !== activeIdRef.current) {
            return;
          }

          if (type === "JOINED_DOCUMENT") {
            updateRevision(payload.revision ?? 0);
            if (payload.peerCount !== undefined) {
              setPeerCount(payload.peerCount);
            }
            const content = payload.content ?? "";
            docTextRef.current = content;
            updateOtState("SYNCHRONIZED");
            pendingOpsRef.current = null;
            bufferOpsRef.current = null;
            setText(content);
          } else if (type === "ROOM_PRESENCE") {
            if (payload.peerCount !== undefined) {
              setPeerCount(payload.peerCount);
            }
          } else if (type === "OPERATION_ACK") {
            updateRevision(payload.revision);

            if (stateRef.current === "AWAITING_CONFIRM") {
              pendingOpsRef.current = null;
              updateOtState("SYNCHRONIZED");
            } else if (stateRef.current === "AWAITING_WITH_BUFFER") {
              const nextOps = bufferOpsRef.current || [];
              pendingOpsRef.current = nextOps;
              bufferOpsRef.current = null;
              updateOtState("AWAITING_CONFIRM");
              sendOperations(activeIdRef.current, revisionRef.current, nextOps);
            }
          } else if (type === "OPERATION_APPLIED") {
            // CRITICAL: Ignore operations broadcasted by ourselves to prevent double-inserting
            if (payload.clientId && payload.clientId === clientIdRef.current) {
              return;
            }

            const remoteOps = payload.operations;
            if (!remoteOps || remoteOps.length === 0) return;

            let opsToApply = remoteOps;

            if (stateRef.current === "SYNCHRONIZED") {
              updateRevision(payload.revision);
              opsToApply = remoteOps;
            } else if (stateRef.current === "AWAITING_CONFIRM") {
              updateRevision(payload.revision);
              const [remotePrime, pendingPrime] = transformPair(remoteOps, pendingOpsRef.current, true);
              opsToApply = remotePrime;
              pendingOpsRef.current = pendingPrime;
            } else if (stateRef.current === "AWAITING_WITH_BUFFER") {
              updateRevision(payload.revision);
              const [remotePrime1, pendingPrime] = transformPair(remoteOps, pendingOpsRef.current, true);
              pendingOpsRef.current = pendingPrime;

              const [remotePrime2, bufferPrime] = transformPair(remotePrime1, bufferOpsRef.current, true);
              bufferOpsRef.current = bufferPrime;
              opsToApply = remotePrime2;
            }

            // Calculate updated cursor position before applying
            if (textareaRef.current) {
              const start = textareaRef.current.selectionStart;
              const end = textareaRef.current.selectionEnd;
              const newStart = transformCursors(start, opsToApply);
              const newEnd = transformCursors(end, opsToApply);
              pendingCursorRef.current = { start: newStart, end: newEnd };
            }

            const updatedText = applyOperations(docTextRef.current, opsToApply);
            docTextRef.current = updatedText;
            setText(updatedText);
          } else if (type === "DOCUMENT_UPDATED") {
            docTextRef.current = payload.content;
            setText(payload.content);
          }
        } catch (err) {
          console.error("Error processing message:", err);
        }
      };
    }

    connect();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // 3. Document Switching Handler
  function handleSelectDocument(newId) {
    if (newId === activeId) return;

    // Leave current document room
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && activeId !== null) {
      socketRef.current.send(
        JSON.stringify({
          type: "LEAVE_DOCUMENT",
          payload: { documentId: activeId }
        })
      );
    }

    const selectedDoc = documents.find((d) => d.id === newId);
    setActiveId(newId);
    activeIdRef.current = newId;
    window.history.replaceState(null, "", `?doc=${newId}`);

    // Reset OT state for the new document
    updateOtState("SYNCHRONIZED");
    updateRevision(0);
    setPeerCount(1);
    pendingOpsRef.current = null;
    bufferOpsRef.current = null;

    const initialContent = selectedDoc ? selectedDoc.content || "" : "";
    docTextRef.current = initialContent;
    setText(initialContent);

    // Join new document room
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "JOIN_DOCUMENT",
          payload: {
            documentId: newId,
            clientId: clientIdRef.current
          }
        })
      );
    }
  }

  // 4. Create New Document
  async function handleCreateDocument(title) {
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: "" })
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments((prev) => [...prev, newDoc]);
        handleSelectDocument(newDoc.id);
      }
    } catch (err) {
      console.error("Failed to create document:", err);
    }
  }

  // 5. Delete Document
  async function handleDeleteDocument(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = documents.filter((d) => d.id !== id);
        setDocuments(remaining);
        if (id === activeId && remaining.length > 0) {
          handleSelectDocument(remaining[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  }

  // 6. Local Edit Handler (OT Client State Machine)
  function handleTextChange(newText) {
    // Normalize line endings to standard \n
    const cleanText = newText.replace(/\r\n/g, "\n");
    const oldText = docTextRef.current;
    if (cleanText === oldText) return;

    const ops = computeOperations(oldText, cleanText);
    if (ops.length === 0) return;

    // Update local state immediately
    docTextRef.current = cleanText;
    setText(cleanText);

    // Update in-memory document in sidebar list
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, content: cleanText } : d))
    );

    // OT state transitions
    if (stateRef.current === "SYNCHRONIZED") {
      updateOtState("AWAITING_CONFIRM");
      pendingOpsRef.current = ops;
      sendOperations(activeIdRef.current, revisionRef.current, ops);
    } else if (stateRef.current === "AWAITING_CONFIRM") {
      updateOtState("AWAITING_WITH_BUFFER");
      bufferOpsRef.current = ops;
    } else if (stateRef.current === "AWAITING_WITH_BUFFER") {
      bufferOpsRef.current = [...(bufferOpsRef.current || []), ...ops];
    }
  }

  const activeDocument = documents.find((d) => d.id === activeId);

  return (
    <div className="app-shell">
      <ActivityBar isDark={isDark} onToggleTheme={() => setIsDark((d) => !d)} />

      <Sidebar
        documents={documents}
        activeDocumentId={activeId}
        onSelectDocument={handleSelectDocument}
        onCreateDocument={handleCreateDocument}
        onDeleteDocument={handleDeleteDocument}
      />

      <main className="editor-workspace">
        <TabBar
          activeDocument={activeDocument}
          syncStatus={otStateName === "SYNCHRONIZED" ? "synced" : "syncing"}
          isConnected={isConnected}
          peerCount={peerCount}
          onOpenShare={() => setIsShareOpen(true)}
        />

        <Editor
          text={text}
          onTextChange={handleTextChange}
          textareaRef={textareaRef}
          onCursorChange={setCursorInfo}
        />

        <StatusBar
          cursorInfo={cursorInfo}
          text={text}
          revision={revision}
          stateName={otStateName}
          isConnected={isConnected}
          peerCount={peerCount}
          onOpenShare={() => setIsShareOpen(true)}
        />
      </main>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={activeId}
        documentTitle={activeDocument ? activeDocument.title : ""}
        peerCount={peerCount}
      />
    </div>
  );
}

export default App;
