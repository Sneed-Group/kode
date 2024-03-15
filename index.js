import readline from 'readline';
import Ollama from 'ollama-js-client';
import spawn from 'child_process';

let potentialAnswers = [];


function prompt(q) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${q}`, function (a) {
      rl.close();
      resolve(a);
    });
  });
}

let problem = await prompt("What's the project? (no external libs or reqs): ");

let lang = await prompt("What's the lang? (js, python, ppython [panda3d python]): ");

console.log("coding!");

function langExec(langCode) {
  if (lang == "js") {
    return eval(langCode);
  } else if (lang == "python") {
    const pythonProcess = spawn('python', ['-c', langCode]);
    // Handle stderr data from the Python process
    return pythonProcess.stderr.on('data', (data) => {
      return Error(`${data}`);
    });
  } else if (lang == "ppython") {
    const ppythonProcess = spawn('ppython', ['-c', langCode]);
    // Handle stderr data from the Python process
    return ppythonProcess.stderr.on('data', (data) => {
      return Error(`${data}`);
    });
  } else {
    console.error("Language command not found!")
  }
}

const instance = new Ollama({
  model: "codellama",
  url: "http://127.0.0.1:11434/api/",
});

function getLangID() {
  if (lang == "ppython") {
    return "panda3d python"
  } else {
    return lang;
  }
}

let answer = await instance.prompt(`${problem} - This must be coded in pure ${getLangID()}, no external libraries or requirements. Please provide the code, the full code, and nothing but the code. No chit-chat, no markdown, just code.`);

async function main() {
  let generation = 1;
  let answerParsed = ""
  let problemSolved = false;
  while (problemSolved == false) {
    try {
      console.log(`Generation ${generation}`)
      answerParsed = answer.response.replaceAll("```javascript","").replaceAll("```","");
      langExec(answerParsed);
      problemSolved = true;
      generation = generation + 1;
      console.log(answer.response)
    } catch (error) {
      answer = await instance.prompt(`There was an error: ${error.message}. Please only provide the code, the full code, and nothing but the code. No chit-chat, no markdown, just code. Also, make sure it's written in ${getLangID()} without any libraries besides included.`)
    }
  }
  return answerParsed;
}

async function aThousand() {
  let potentialAnswersQuestion = `Which answer is best suited for ${problem}?
  If there are two or more answers that are about as equal, but one has lower quality code, choose the one with higher quality code.
  Pick ONLY ONE ANSWER. MUST BE PROGRAMMED IN THE LANGUAGE ${getLangID}!

  Answers:

  `
  for (let i = 0; i < 1000; i++) {
    let potentialAnswer = await main();
    potentialAnswers.push(potentialAnswer)
  }
  potentialAnswers.forEach((answer, index) => {
    potentialAnswersQuestion += `
    ----
    Answer ${index + 1}: 
    ${answer}
    ----
    `;
  });
  let finalAnswer = await instance.prompt(`${potentialAnswersQuestion}`)
  let finalAnswerParsed = finalAnswer.response;
  return finalAnswerParsed;
}

let a = await aThousand();
console.log(a)
