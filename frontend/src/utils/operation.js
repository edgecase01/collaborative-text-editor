/**
 * Operational Transformation Utilities for Frontend
 */

export function applyOperation(content, op) {
    if (!op) return content;

    const len = content.length;
    const pos = Math.max(0, Math.min(len, op.position ?? 0));

    if (op.type === "INSERT") {
        const text = op.text ?? "";
        return content.slice(0, pos) + text + content.slice(pos);
    }

    if (op.type === "DELETE") {
        const deleteLen = Math.max(0, Math.min(len - pos, op.length ?? 0));
        if (deleteLen === 0) return content;
        return content.slice(0, pos) + content.slice(pos + deleteLen);
    }

    return content;
}

export function applyOperations(content, ops) {
    if (!ops) return content;
    const list = Array.isArray(ops) ? ops : [ops];
    return list.reduce((acc, op) => applyOperation(acc, op), content);
}

export function transformAtomic(op1, op2, priority = false) {
    if (!op1) return [];
    if (!op2) return [{ ...op1 }];

    if (op1.type === "INSERT" && op2.type === "INSERT") {
        if (op1.position < op2.position || (op1.position === op2.position && priority)) {
            return [{ ...op1 }];
        }
        return [{
            ...op1,
            position: op1.position + (op2.text?.length || 0)
        }];
    }

    if (op1.type === "INSERT" && op2.type === "DELETE") {
        const op2Len = op2.length || 0;
        if (op1.position <= op2.position) {
            return [{ ...op1 }];
        }
        if (op1.position >= op2.position + op2Len) {
            return [{
                ...op1,
                position: op1.position - op2Len
            }];
        }
        return [{
            ...op1,
            position: op2.position
        }];
    }

    if (op1.type === "DELETE" && op2.type === "INSERT") {
        const op2TextLen = op2.text?.length || 0;
        if (op2.position <= op1.position) {
            return [{
                ...op1,
                position: op1.position + op2TextLen
            }];
        }
        if (op2.position >= op1.position + op1.length) {
            return [{ ...op1 }];
        }

        const leftLen = op2.position - op1.position;
        const rightLen = op1.length - leftLen;
        const result = [];
        if (leftLen > 0) {
            result.push({
                type: "DELETE",
                position: op1.position,
                length: leftLen
            });
        }
        if (rightLen > 0) {
            result.push({
                type: "DELETE",
                position: op1.position + op2TextLen,
                length: rightLen
            });
        }
        return result;
    }

    if (op1.type === "DELETE" && op2.type === "DELETE") {
        const start1 = op1.position;
        const end1 = op1.position + op1.length;
        const start2 = op2.position;
        const end2 = op2.position + op2.length;

        if (end1 <= start2) {
            return [{ ...op1 }];
        }

        if (start1 >= end2) {
            return [{
                ...op1,
                position: start1 - op2.length
            }];
        }

        if (start1 >= start2 && end1 <= end2) {
            return [];
        }

        if (start1 < start2 && end1 > end2) {
            return [{
                type: "DELETE",
                position: start1,
                length: op1.length - op2.length
            }];
        }

        if (start1 < start2 && end1 <= end2) {
            return [{
                type: "DELETE",
                position: start1,
                length: start2 - start1
            }];
        }

        if (start1 >= start2 && end1 > end2) {
            return [{
                type: "DELETE",
                position: start2,
                length: end1 - end2
            }];
        }
    }

    return [{ ...op1 }];
}

export function transformOps(opsA, opsB, priority = false) {
    if (!opsA || (Array.isArray(opsA) && opsA.length === 0)) return [];
    if (!opsB || (Array.isArray(opsB) && opsB.length === 0)) {
        return Array.isArray(opsA) ? opsA.map(o => ({ ...o })) : [{ ...opsA }];
    }

    let currentOpsA = Array.isArray(opsA) ? opsA : [opsA];
    const bList = Array.isArray(opsB) ? opsB : [opsB];

    for (const b of bList) {
        const nextOpsA = [];
        for (const a of currentOpsA) {
            const transformed = transformAtomic(a, b, priority);
            nextOpsA.push(...transformed);
        }
        currentOpsA = nextOpsA;
    }

    return currentOpsA;
}

export function transformPair(opsA, opsB, aPriority = false) {
    const aPrime = transformOps(opsA, opsB, aPriority);
    const bPrime = transformOps(opsB, opsA, !aPriority);
    return [aPrime, bPrime];
}

export function computeOperations(oldText, newText) {
    if (oldText === newText) return [];

    let start = 0;
    while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
        start++;
    }

    let oldEnd = oldText.length - 1;
    let newEnd = newText.length - 1;
    while (oldEnd >= start && newEnd >= start && oldText[oldEnd] === newText[newEnd]) {
        oldEnd--;
        newEnd--;
    }

    const ops = [];
    const deleteLength = oldEnd - start + 1;
    if (deleteLength > 0) {
        ops.push({
            type: "DELETE",
            position: start,
            length: deleteLength
        });
    }

    const insertedText = newText.slice(start, newEnd + 1);
    if (insertedText.length > 0) {
        ops.push({
            type: "INSERT",
            position: start,
            text: insertedText
        });
    }

    return ops;
}

export function transformCursor(cursor, op) {
    if (cursor === undefined || cursor === null || !op) return cursor;

    if (op.type === "INSERT") {
        const textLen = op.text?.length || 0;
        if (cursor >= op.position) {
            return cursor + textLen;
        }
        return cursor;
    }

    if (op.type === "DELETE") {
        const delLen = op.length || 0;
        if (cursor <= op.position) {
            return cursor;
        }
        if (cursor >= op.position + delLen) {
            return cursor - delLen;
        }
        return op.position;
    }

    return cursor;
}

export function transformCursors(cursor, ops) {
    if (cursor === undefined || cursor === null || !ops) return cursor;
    const list = Array.isArray(ops) ? ops : [ops];
    return list.reduce((acc, op) => transformCursor(acc, op), cursor);
}
