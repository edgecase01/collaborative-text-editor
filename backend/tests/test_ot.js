import {
    applyOperation,
    applyOperations,
    transformAtomic,
    transformOps,
    transformPair,
    computeOperations,
    transformCursor,
    transformCursors
} from '../websocket/operation.js';

function assert(condition, message) {
    if (!condition) {
        console.error("Assertion failed:", message);
        process.exit(1);
    }
}

console.log("Running OT unit tests...");

// Test 1: applyOperation and applyOperations
let text = "Hello World";
text = applyOperation(text, { type: "INSERT", position: 5, text: " Beautiful" });
assert(text === "Hello Beautiful World", "Insert failed: " + text);

text = applyOperation(text, { type: "DELETE", position: 5, length: 10 });
assert(text === "Hello World", "Delete failed: " + text);

// Test 2: computeOperations
// Case 2a: Pure insert
let ops = computeOperations("cat", "catch");
assert(ops.length === 1 && ops[0].type === "INSERT" && ops[0].position === 3 && ops[0].text === "ch", "Compute pure insert failed");

// Case 2b: Pure delete
ops = computeOperations("catch", "cat");
assert(ops.length === 1 && ops[0].type === "DELETE" && ops[0].position === 3 && ops[0].length === 2, "Compute pure delete failed");

// Case 2c: Replacement same length
ops = computeOperations("cat", "cot");
assert(ops.length === 2 && ops[0].type === "DELETE" && ops[0].position === 1 && ops[0].length === 1 &&
       ops[1].type === "INSERT" && ops[1].position === 1 && ops[1].text === "o", "Compute same length replace failed");
assert(applyOperations("cat", ops) === "cot", "Apply replace failed");

// Case 2d: Replacement different length
ops = computeOperations("the quick fox", "the slow black fox");
assert(applyOperations("the quick fox", ops) === "the slow black fox", "Apply complex replace failed");

// Test 3: OT Convergence (TP1 property)
// Helper to test convergence:
// doc + op1 + transform(op2, op1) MUST EQUAL doc + op2 + transform(op1, op2)
function verifyConvergence(baseDoc, op1, op2, desc) {
    const [op1Prime, op2Prime] = transformPair(op1, op2, true);

    const doc1 = applyOperations(applyOperations(baseDoc, op1), op2Prime);
    const doc2 = applyOperations(applyOperations(baseDoc, op2), op1Prime);

    assert(doc1 === doc2, `Convergence failed for: ${desc}. Doc1: "${doc1}", Doc2: "${doc2}"`);
}

// 3a: Concurrent Inserts at different positions
verifyConvergence("ABC", 
    { type: "INSERT", position: 1, text: "1" }, 
    { type: "INSERT", position: 2, text: "2" },
    "Inserts different pos");

// 3b: Concurrent Inserts at same position (Tie breaking)
verifyConvergence("ABC", 
    { type: "INSERT", position: 1, text: "X" }, 
    { type: "INSERT", position: 1, text: "Y" },
    "Inserts same pos");

// 3c: Concurrent Insert and Delete (insert inside deleted region)
verifyConvergence("ABCDEF", 
    { type: "DELETE", position: 1, length: 4 }, // deletes "BCDE" -> "AF"
    { type: "INSERT", position: 3, text: "XYZ" }, // inserts inside "BCDE"
    "Insert inside delete");

// 3d: Concurrent Insert before Delete
verifyConvergence("ABCDEF", 
    { type: "DELETE", position: 3, length: 2 }, // deletes "DE"
    { type: "INSERT", position: 1, text: "123" }, // inserts before
    "Insert before delete");

// 3e: Concurrent Deletes overlapping
verifyConvergence("0123456789", 
    { type: "DELETE", position: 1, length: 4 }, // deletes "1234"
    { type: "DELETE", position: 3, length: 4 }, // deletes "3456"
    "Deletes overlapping");

// 3f: Concurrent Deletes enclosed
verifyConvergence("0123456789", 
    { type: "DELETE", position: 2, length: 2 }, // deletes "23"
    { type: "DELETE", position: 1, length: 6 }, // deletes "123456"
    "Deletes enclosed");

// 3g: Concurrent Deletes identical
verifyConvergence("0123456789", 
    { type: "DELETE", position: 2, length: 3 }, 
    { type: "DELETE", position: 2, length: 3 }, 
    "Deletes identical");

// Test 4: Cursor transformation
assert(transformCursor(5, { type: "INSERT", position: 2, text: "123" }) === 8, "Cursor after insert");
assert(transformCursor(1, { type: "INSERT", position: 2, text: "123" }) === 1, "Cursor before insert");
assert(transformCursor(5, { type: "DELETE", position: 2, length: 2 }) === 3, "Cursor after delete");
assert(transformCursor(3, { type: "DELETE", position: 2, length: 3 }) === 2, "Cursor inside delete");

console.log("All OT unit tests passed successfully!");
