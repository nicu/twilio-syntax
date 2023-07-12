import repl from "node:repl";
import util from "node:util";

function parse(text: string) {
  return text.replace(/\n$/, "");
}

function customEval(cmd: any, context: any, filename: string, callback: any) {
  callback(null, parse(cmd));
}

function customWriter(output: any): string {
  return util.inspect(output, undefined, null, true);
}

repl.start({
  prompt: "Twilio Expressions > ",
  eval: customEval,
  writer: customWriter,
});
