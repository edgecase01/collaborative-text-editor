import {
    applyOperations,
    transformOps,
    transformPair,
    computeOperations
} from '../websocket/operation.js';

function assert(condition, message) {
    if (!condition) {
        console.error("FAIL:", message);
        process.exit(1);
    }
}

console.log("Starting Client-Server OT Concurrency Simulation...");

// Simulated Server Document Store
class ServerOT {
    constructor(initialContent = "") {
        this.content = initialContent;
        this.revision = 0;
        this.history = [];
    }

    applyOperation(clientRev, ops) {
        let transformedOps = ops;
        if (clientRev < this.revision) {
            const concurrent = this.history.filter(h => h.revision > clientRev);
            for (const entry of concurrent) {
                transformedOps = transformOps(transformedOps, entry.operations, false);
            }
        }

        this.content = applyOperations(this.content, transformedOps);
        this.revision += 1;
        this.history.push({
            revision: this.revision,
            operations: transformedOps
        });

        return {
            revision: this.revision,
            transformedOps
        };
    }
}

// Simulated Client OT (Jupiter State Machine)
class ClientOT {
    constructor(id, initialContent = "", initialRev = 0, server) {
        this.id = id;
        this.server = server;
        this.content = initialContent;
        this.revision = initialRev;
        this.state = "SYNCHRONIZED";
        this.pendingOps = null;
        this.bufferOps = null;
    }

    // Local edit
    edit(newText) {
        const ops = computeOperations(this.content, newText);
        if (ops.length === 0) return [];
        this.content = newText;

        if (this.state === "SYNCHRONIZED") {
            this.state = "AWAITING_CONFIRM";
            this.pendingOps = ops;
            return [{ rev: this.revision, ops }];
        } else if (this.state === "AWAITING_CONFIRM") {
            this.state = "AWAITING_WITH_BUFFER";
            this.bufferOps = ops;
            return [];
        } else if (this.state === "AWAITING_WITH_BUFFER") {
            this.bufferOps = [...this.bufferOps, ...ops];
            return [];
        }
    }

    // Server acknowledged pending op
    onAck(newRev) {
        this.revision = newRev;
        if (this.state === "AWAITING_CONFIRM") {
            this.pendingOps = null;
            this.state = "SYNCHRONIZED";
            return null;
        } else if (this.state === "AWAITING_WITH_BUFFER") {
            const opsToSend = this.bufferOps;
            this.pendingOps = opsToSend;
            this.bufferOps = null;
            this.state = "AWAITING_CONFIRM";
            return { rev: this.revision, ops: opsToSend };
        }
    }

    // Remote op arrived from server
    onRemoteOp(newRev, remoteOps) {
        let opsToApply = remoteOps;

        if (this.state === "SYNCHRONIZED") {
            this.revision = newRev;
            opsToApply = remoteOps;
        } else if (this.state === "AWAITING_CONFIRM") {
            this.revision = newRev;
            const [remotePrime, pendingPrime] = transformPair(remoteOps, this.pendingOps, true);
            opsToApply = remotePrime;
            this.pendingOps = pendingPrime;
        } else if (this.state === "AWAITING_WITH_BUFFER") {
            this.revision = newRev;
            const [remotePrime1, pendingPrime] = transformPair(remoteOps, this.pendingOps, true);
            this.pendingOps = pendingPrime;

            const [remotePrime2, bufferPrime] = transformPair(remotePrime1, this.bufferOps, true);
            this.bufferOps = bufferPrime;
            opsToApply = remotePrime2;
        }

        this.content = applyOperations(this.content, opsToApply);
    }
}

// SIMULATION 1: Concurrent Inserts
{
    const server = new ServerOT("Hello");
    const clientA = new ClientOT("A", "Hello", 0, server);
    const clientB = new ClientOT("B", "Hello", 0, server);

    // Both edit locally at rev 0
    const opsA = clientA.edit("Hello Beautiful")[0]; // pos 5: " Beautiful"
    const opsB = clientB.edit("Hello World")[0];     // pos 5: " World"

    // Server receives A's edit first
    const resA = server.applyOperation(opsA.rev, opsA.ops);
    clientA.onAck(resA.revision);

    // Server receives B's edit second (based on rev 0, but server is at rev 1)
    const resB = server.applyOperation(opsB.rev, opsB.ops);
    clientB.onAck(resB.revision);

    // Broadcasts:
    // clientB receives resA
    clientB.onRemoteOp(resA.revision, resA.transformedOps);
    // clientA receives resB
    clientA.onRemoteOp(resB.revision, resB.transformedOps);

    console.log("Simulation 1 results:");
    console.log("Server  :", server.content);
    console.log("Client A:", clientA.content);
    console.log("Client B:", clientB.content);

    assert(server.content === clientA.content, "Client A does not match server");
    assert(server.content === clientB.content, "Client B does not match server");
}

// SIMULATION 2: Client typing in buffer while waiting for ACK
{
    const server = new ServerOT("ABCDEF");
    const clientA = new ClientOT("A", "ABCDEF", 0, server);
    const clientB = new ClientOT("B", "ABCDEF", 0, server);

    // Client A sends op1
    const opsA1 = clientA.edit("AB12CDEF")[0];

    // While waiting, Client A types again! (into buffer)
    clientA.edit("AB12C34DEF");

    // Client B concurrently deletes "CD" at rev 0
    const opsB = clientB.edit("ABEF")[0];

    // Server receives B first
    const resB = server.applyOperation(opsB.rev, opsB.ops);
    clientB.onAck(resB.revision);

    // Server receives A1 (concurrent with B)
    const resA1 = server.applyOperation(opsA1.rev, opsA1.ops);
    
    // A receives B's op while waiting for ACK
    clientA.onRemoteOp(resB.revision, resB.transformedOps);

    // A receives ACK for A1, which flushes its buffer (opsA2)
    const opsA2 = clientA.onAck(resA1.revision);

    // Server receives A2
    const resA2 = server.applyOperation(opsA2.rev, opsA2.ops);
    clientA.onAck(resA2.revision);

    // B receives A1 and A2
    clientB.onRemoteOp(resA1.revision, resA1.transformedOps);
    clientB.onRemoteOp(resA2.revision, resA2.transformedOps);

    console.log("Simulation 2 results:");
    console.log("Server  :", server.content);
    console.log("Client A:", clientA.content);
    console.log("Client B:", clientB.content);

    assert(server.content === clientA.content, "Sim 2 Client A does not match server");
    assert(server.content === clientB.content, "Sim 2 Client B does not match server");
}

console.log("All Client-Server OT Concurrency Simulations PASSED 100%!");
