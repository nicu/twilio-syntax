import "./terminal.css";

const commands: Array<string> = [];
let commandIndex = -1;

export function setupTerminal() {
  const terminalHistory = document.getElementById("terminal-history")!;
  const input = document.getElementById("terminal-input")!;
  const astContainer = document.getElementById("ast-container")!;
  const astConnections = document.getElementById("ast-connections")!;
  const astNodes = document.getElementById("ast-nodes")!;
  const tokensElem = document.getElementById("tokens")!;
  const astJSON = document.getElementById("ast-json")!;
  const terminalElem = document.getElementById("terminal");

  function focusAndMoveCursorToTheEnd() {
    input.focus();

    const range = document.createRange();
    const selection = window.getSelection();
    const { childNodes } = input;
    const lastChildNode = childNodes && childNodes.length - 1;

    range.selectNodeContents(
      lastChildNode === -1 ? input : childNodes[lastChildNode]
    );
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);

    input.scrollIntoView();
  }

  function clearTerminal() {
    terminalHistory.innerText = "";

    astJSON.textContent = "";
    tokensElem.textContent = "";

    // clear graph
    while (astConnections.childNodes.length) {
      astConnections.childNodes[0].parentNode?.removeChild(
        astConnections.childNodes[0]
      );
    }
    astNodes.textContent = "";
    astConnections.style.width = `0px`;
    astConnections.style.height = `0px`;
    astContainer.removeAttribute("style");
  }

  function handleCommand(command: string) {
    const line = document.createElement("div");
    line.textContent = `> ${command}`;
    terminalHistory.appendChild(line);

    if (command.length) {
      if (commands[commands.length - 1] !== command) {
        commands.push(command);
      }
      commandIndex = commands.length;

      const outputText = document.createElement("pre");
      try {
        outputText.innerHTML = command;
      } catch (e: unknown) {
        outputText.innerHTML = `<span class="error">${(
          e as any
        ).toString()}</span>`;

        throw e;
      } finally {
        terminalHistory.appendChild(outputText);
      }
    }
  }

  // Every time the selection changes, add or remove the .noCursor
  // class to show or hide, respectively, the bug square cursor.
  // Note this function could also be used to enforce showing always
  // a big square cursor by always selecting 1 chracter from the current
  // cursor position, unless it's already at the end, in which case the
  // #cursor element should be displayed instead.
  document.addEventListener("selectionchange", () => {
    if (document.activeElement?.id !== "input") return;

    const range = window.getSelection()?.getRangeAt(0);
    // const start = range.startOffset;
    const end = range?.endOffset;
    const length = input?.textContent?.length ?? 0;

    if (end && end < length) {
      input.classList.add("no-caret");
    } else {
      input.classList.remove("no-caret");
    }
  });

  input.addEventListener("input", () => {
    // If we paste HTML, format it as plain text and break it up
    // input individual lines/commands:
    if (input.childElementCount > 0) {
      const lines = input.innerText.replace(/\n$/, "").split("\n");
      const lastLine = lines[lines.length - 1];

      for (let i = 0; i <= lines.length - 2; ++i) {
        handleCommand(lines[i]);
      }

      input.textContent = lastLine;

      focusAndMoveCursorToTheEnd();
    }

    // If we delete everything, display the square caret again:
    if (input.innerText.length === 0) {
      input.classList.remove("no-caret");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "k" && e.metaKey) {
      clearTerminal();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      handleCommand(input?.textContent || "");
      input.textContent = "";
      focusAndMoveCursorToTheEnd();
    }
    if (e.key === "ArrowUp") {
      if (commandIndex > 0) {
        e.preventDefault();
        commandIndex--;
        input.textContent = commands[commandIndex];
        focusAndMoveCursorToTheEnd();
      }
    }
    if (e.key === "ArrowDown") {
      if (commandIndex < commands.length - 1) {
        e.preventDefault();
        commandIndex++;
        input.textContent = commands[commandIndex];
        focusAndMoveCursorToTheEnd();
      } else {
        commandIndex = commands.length;
        input.textContent = "";
        focusAndMoveCursorToTheEnd();
      }
    }
  });

  terminalElem?.addEventListener("click", () => {
    focusAndMoveCursorToTheEnd();
  });

  // Set the focus to the input so that you can start typing straigh away:
  input.focus();
}
