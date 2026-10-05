export function applyOperation(content, op){
    if(!op) return content;

    if(op.type === "INSERT"){
        return content.slice(0, op.position) + op.text + content.slice(op.position);
    }

    if(op.type === "DELETE"){
        return content.slice(0, op.position) + content.slice(op.position + op.length);
    }

    return content;
}

export function transform(op1, op2){
    if(!op1 || !op2) return op1;

    if(op1.type === "INSERT" && op2.type === "INSERT"){
        if(op1.position < op2.position){
            return { ...op1 };
        }
        return {
            ...op1,
            position: op1.position + op2.text.length
        };
    }

    if(op1.type === "INSERT" && op2.type === "DELETE"){
        if(op1.position <= op2.position){
            return { ...op1 };
        }
        if(op1.position > op2.position + op2.length){
            return {
                ...op1,
                position: op1.position - op2.length
            };
        }
        return {
            ...op1,
            position: op2.position
        };
    }

    if(op1.type === "DELETE" && op2.type === "INSERT"){
        if(op1.position >= op2.position){
            return {
                ...op1,
                position: op1.position + op2.text.length
            };
        }
        if(op1.position + op1.length <= op2.position){
            return { ...op1 };
        }
        return {
            ...op1,
            length: op1.length + op2.text.length
        };
    }

    if(op1.type === "DELETE" && op2.type === "DELETE"){
        const op1End = op1.position + op1.length;
        const op2End = op2.position + op2.length;

        if(op1End <= op2.position){
            return { ...op1 };
        }

        if(op1.position >= op2End){
            return {
                ...op1,
                position: op1.position - op2.length
            };
        }

        const newStart = Math.min(op1.position, op2.position);
        const overlapStart = Math.max(op1.position, op2.position);
        const overlapEnd = Math.min(op1End, op2End);
        const overlapLength = Math.max(0, overlapEnd - overlapStart);
        const newLength = op1.length - overlapLength;

        return {
            type: "DELETE",
            position: newStart,
            length: Math.max(0, newLength)
        };
    }

    return { ...op1 };
}

export function computeOperation(oldText, newText){
    if(oldText === newText) return null;

    let start = 0;
    while(start < oldText.length && start < newText.length && oldText[start] === newText[start]){
        start++;
    }

    let oldEnd = oldText.length - 1;
    let newEnd = newText.length - 1;
    while(oldEnd >= start && newEnd >= start && oldText[oldEnd] === newText[newEnd]){
        oldEnd--;
        newEnd--;
    }

    if(newText.length > oldText.length){
        return {
            type: "INSERT",
            position: start,
            text: newText.slice(start, newEnd + 1)
        };
    }

    if(newText.length < oldText.length){
        return {
            type: "DELETE",
            position: start,
            length: oldEnd - start + 1
        };
    }

    return null;
}
