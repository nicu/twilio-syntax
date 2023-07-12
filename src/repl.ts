import repl from "node:repl";

function parse(text: string) {
  return text.replace(/\n$/, "");
}

function myEval(cmd: any, context: any, filename: string, callback: any) {
  callback(null, parse(cmd));
}

repl.start({ prompt: "Twilio Expression > ", eval: myEval });
