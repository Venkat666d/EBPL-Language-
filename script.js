const variables = {};

// Helper functions
const appendOutput = (message) => {
    const output = document.getElementById("output");
    output.textContent += message + "\n";
    output.scrollTop = output.scrollHeight;
};

const evaluateExpression = (expr) => {
    return expr.split("+").map(part => {
        const trimmed = part.trim().replace(/"/g, "");
        return variables[trimmed] !== undefined ? variables[trimmed] : trimmed;
    }).join("");
};

const formatDate = (date, format) => {
    const pad = n => n.toString().padStart(2, '0');
    return format
        .replace('YYYY', date.getFullYear())
        .replace('MM', pad(date.getMonth() + 1))
        .replace('DD', pad(date.getDate()))
        .replace('HH', pad(date.getHours()))
        .replace('mm', pad(date.getMinutes()))
        .replace('SS', pad(date.getSeconds()));
};

// Math helpers
const isPrime = num => {
    for(let i = 2; i <= Math.sqrt(num); i++) 
        if(num % i === 0) return false;
    return num > 1;
};

const factorial = n => n <= 1 ? 1 : n * factorial(n - 1);

const generateFibonacci = n => {
    let sequence = [0, 1];
    for(let i = 2; i < n; i++) 
        sequence.push(sequence[i-1] + sequence[i-2]);
    return sequence.slice(0, n);
};

const isPalindrome = str => {
    const cleanStr = str.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return cleanStr === cleanStr.split('').reverse().join('');
};

const executeCommand = (command) => {
    command = command.trim();

    // Print command
    if (command.startsWith("print ")) {
        return appendOutput(command.slice(6));
    }

    // Repeat command
    const repeatMatch = command.match(/^repeat (.+?) (\d+)$/);
    if (repeatMatch) {
        const [_, str, count] = repeatMatch;
        const repeated = (str.includes("\\n") ? str.replace(/\\n/g, '\n') : str + ' ')
            .repeat(count).trim();
        return appendOutput(repeated);
    }

    // Prime check
    if (command.startsWith("primecheck ")) {
        const num = parseInt(command.slice(11));
        return appendOutput(`${num} is ${isPrime(num) ? '' : 'not '}a prime`);
    }

    // Factorial
    if (command.startsWith("factorial ")) {
        const num = parseInt(command.slice(10));
        return appendOutput(`Factorial of ${num}: ${factorial(num)}`);
    }

    // Fibonacci
    if (command.startsWith("fibonacci ")) {
        const count = parseInt(command.slice(10));
        return appendOutput(`Fibonacci sequence: ${generateFibonacci(count).join(', ')}`);
    }

    // Palindrome check
    if (command.startsWith("palindrome ")) {
        const str = command.slice(11);
        return appendOutput(`"${str}" is ${isPalindrome(str) ? '' : 'not '}a palindrome`);
    }

    // Enhanced concatenation
    if (command.startsWith("concatenate ")) {
        const concatMatch = command.match(/^concatenate (.+?) with (.+)$/);
        if (concatMatch) {
            const [_, part1, part2] = concatMatch;
            const val1 = variables[part1] || part1.replace(/"/g, '');
            const val2 = variables[part2] || part2.replace(/"/g, '');
            return appendOutput(`Concatenation: ${val1}${val2}`);
        }
    }

    // Original .if conditional
    if (command.startsWith(".if")) {
        const ifMatch = command.match(/^\.if (.+) is (.+) then (.+)$/);
        if (!ifMatch) return appendOutput("ERROR: Invalid .if statement");
        
        const [_, variable, value, action] = ifMatch;
        const actualValue = variables[variable]?.toString();
        const expectedValue = value.replace(/"/g, "");

        if (actualValue === expectedValue) executeCommand(action);
        else appendOutput(`Condition failed: ${variable} is not "${expectedValue}"`);
        return;
    }

    // Enhanced remove for strings
    if (command.startsWith("remove ")) {
        const stringRemoveMatch = command.match(/^remove "(.+)" from (\w+)$/);
        if (stringRemoveMatch) {
            const [_, substr, varName] = stringRemoveMatch;
            if (typeof variables[varName] === 'string') {
                variables[varName] = variables[varName].replace(new RegExp(substr, "g"), "");
                return appendOutput(`Removed "${substr}" from ${varName}: ${variables[varName]}`);
            }
        }
    }

    // New index command
    if (command.startsWith("index ")) {
        const indexMatch = command.match(/^index "(.+)" in (\w+)$/);
        if (indexMatch) {
            const [_, substr, varName] = indexMatch;
            if (typeof variables[varName] === 'string') {
                const index = variables[varName].indexOf(substr);
                return appendOutput(index !== -1 ? 
                    `Index of "${substr}" in ${varName}: ${index}` :
                    `"${substr}" not found in ${varName}`);
            }
            return appendOutput(`ERROR: ${varName} is not a string`);
        }
    }

    // Original command parser
    const match = command.match(/^(\w+)(?: (.+))?$/);
    if (!match) return appendOutput("Invalid command format");

    const action = match[1].toLowerCase();
    const rest = match[2];

    // Original set command
    if (action === "set") {
        const setMatch = rest.match(/^(\w+) to (.+)$/);
        if (!setMatch) return appendOutput("ERROR: Invalid set command");
        
        const [_, varName, value] = setMatch;
        
        if (value.includes("+")) {
            variables[varName] = evaluateExpression(value);
        } else if (value.startsWith("[") && value.endsWith("]")) {
            variables[varName] = JSON.parse(value);
        } else if (!isNaN(value)) {
            variables[varName] = parseFloat(value);
        } else {
            variables[varName] = value.replace(/"/g, "");
        }
        return appendOutput(`Set '${varName}' to '${variables[varName]}'`);
    }

    // Enhanced show command
    if (action === "show") {
        // Array access
        const arrayGetMatch = rest.match(/^get (\d+) from (\w+)$/);
        if (arrayGetMatch) {
            const [_, index, varName] = arrayGetMatch;
            if (!variables[varName] || !Array.isArray(variables[varName])) {
                return appendOutput(`ERROR: ${varName} is not an array`);
            }
            return appendOutput(`Element at index ${index}: ${variables[varName][index]}`);
        }

        // Arithmetic expressions
        const exprMatch = rest.match(/^(.+?) (plus|minus|times|divided by) (.+)$/);
        if (exprMatch) {
            const [_, var1, op, var2] = exprMatch;
            const val1 = variables[var1] || parseFloat(var1);
            const val2 = variables[var2] || parseFloat(var2);
            
            const operations = {
                plus: (a, b) => a + b,
                minus: (a, b) => a - b,
                times: (a, b) => a * b,
                'divided by': (a, b) => a / b
            };
            
            return appendOutput(`Result: ${operations[op](val1, val2)}`);
        }

        // Original show functionality
        if (rest.includes("[")) {
            const arrayMatch = rest.match(/(\w+)\[(\d+)\]/);
            if (!arrayMatch) return appendOutput("ERROR: Invalid array syntax");
            
            const [_, varName, index] = arrayMatch;
            if (!variables[varName] || !Array.isArray(variables[varName])) {
                return appendOutput(`ERROR: '${varName}' is not an array`);
            }
            return appendOutput(`Element at index ${index} in '${varName}': ${variables[varName][index]}`);
        }
        
        if (rest.startsWith("length of ")) {
            const varName = rest.replace("length of ", "").trim();
            if (!Array.isArray(variables[varName])) {
                return appendOutput(`ERROR: '${varName}' is not an array`);
            }
            return appendOutput(`Length of '${varName}': ${variables[varName].length}`);
        }
        
        if (!variables[rest]) return appendOutput(`ERROR: Variable '${rest}' not defined`);
        return appendOutput(`${rest}: ${variables[rest]}`);
    }

    // Array handling
    if (action === "append") {
        const appendMatch = rest.match(/^(\d+|\w+) to (\w+)$/);
        if (!appendMatch) return appendOutput("ERROR: Invalid append command");
        
        const [_, value, varName] = appendMatch;
        if (!Array.isArray(variables[varName])) {
            return appendOutput(`ERROR: '${varName}' is not an array`);
        }
        const valToAppend = isNaN(value) ? value : parseFloat(value);
        variables[varName].push(valToAppend);
        return appendOutput(`Appended '${valToAppend}' to '${varName}': ${variables[varName]}`);
    }

    if (action === "remove") {
        const removeMatch = rest.match(/^(.+) from (\w+)$/);
        if (!removeMatch) return appendOutput("ERROR: Invalid remove command");
        
        const [_, value, varName] = removeMatch;
        if (!Array.isArray(variables[varName])) {
            return appendOutput(`ERROR: '${varName}' is not an array`);
        }
        const index = variables[varName].indexOf(isNaN(value) ? value : parseFloat(value));
        if (index === -1) return appendOutput(`ERROR: '${value}' not found in '${varName}'`);
        
        variables[varName].splice(index, 1);
        return appendOutput(`Removed '${value}' from '${varName}': ${variables[varName]}`);
    }

    // Math operations
    const mathMatch = command.match(/^(ADD|SUBTRACT|MULTIPLY|DIVIDE|MOD) (\d+) (\d+)$/i);
    if (mathMatch) {
        const [_, op, a, b] = mathMatch;
        const num1 = parseFloat(a);
        const num2 = parseFloat(b);
        
        const operations = {
            ADD: () => num1 + num2,
            SUBTRACT: () => num1 - num2,
            MULTIPLY: () => num1 * num2,
            DIVIDE: () => num2 !== 0 ? num1 / num2 : "ERROR: Division by zero",
            MOD: () => num1 % num2
        };
        
        return appendOutput(`Result: ${operations[op.toUpperCase()]()}`);
    }

    // String operations
    const stringMatch = command.match(/^(REVERSE|UPPERCASE|LOWERCASE|LENGTH) (.+)$/i);
    if (stringMatch) {
        const [_, op, input] = stringMatch;
        const str = variables[input] || input;
        
        const operations = {
            REVERSE: () => [...str].reverse().join(''),
            UPPERCASE: () => str.toUpperCase(),
            LOWERCASE: () => str.toLowerCase(),
            LENGTH: () => str.length
        };
        
        return appendOutput(`Result: ${operations[op.toUpperCase()]()}`);
    }

    // Date/time commands
    const dateMatch = command.match(/^(DATE|TIME|DATETIME)$/i);
    if (dateMatch) {
        const [_, op] = dateMatch;
        const now = new Date();
        
        const formats = {
            DATE: 'YYYY-MM-DD',
            TIME: 'HH:mm:SS',
            DATETIME: 'YYYY-MM-DD HH:mm:SS'
        };
        
        return appendOutput(`${op}: ${formatDate(now, formats[op.toUpperCase()])}`);
    }

    // Math functions
    if (["sum", "sqrt", "log", "sin", "cos", "tan"].includes(action)) {
        try {
            if (rest.includes("+") && action === "sum") {
                const values = rest.split("+").map(num => parseFloat(num.trim()));
                return appendOutput(`sum(${rest}): ${values.reduce((a, b) => a + b, 0)}`);
            }
            
            const value = parseFloat(rest);
            const operations = {
                sqrt: Math.sqrt,
                log: Math.log10,
                sin: v => Math.sin((v * Math.PI) / 180),
                cos: v => Math.cos((v * Math.PI) / 180),
                tan: v => Math.tan((v * Math.PI) / 180)
            };
            return appendOutput(`${action}(${value}): ${operations[action](value)}`);
        } catch (e) {
            return appendOutput(`ERROR: Invalid input for ${action}`);
        }
    }

    appendOutput("ERROR: Unsupported action");
};

// Event Listeners
document.getElementById("executeButton").addEventListener("click", () => {
    const commandInput = document.getElementById("commandInput");
    const command = commandInput.value.trim();
    if (command) {
        executeCommand(command);
        commandInput.value = "";
    }
});

document.getElementById("commandInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("executeButton").click();
});