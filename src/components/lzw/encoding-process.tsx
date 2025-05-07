"use client"

import { motion } from "framer-motion"

interface LZWEncodingProcessProps {
  inputText: string
  currentIndex: number
  currentString: string
  nextChar: string
  encodedOutput: number[]
}

export function LZWEncodingProcess({
  inputText,
  currentIndex,
  currentString,
  nextChar,
  encodedOutput,
}: LZWEncodingProcessProps) {
  const startIndex = Math.max(0, currentIndex - 10)
  const endIndex = Math.min(inputText.length, currentIndex + 25)
  const visibleText = inputText.substring(startIndex, endIndex)

  const characters = visibleText.split("").map((char, index) => ({
    char,
    position: startIndex + index,
    isCurrent: startIndex + index === currentIndex,
    isProcessed: startIndex + index < currentIndex,
    isInCurrentString:
      currentString.includes(char) &&
      startIndex + index >= currentIndex - currentString.length &&
      startIndex + index < currentIndex,
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Input Text</h3>
        <div className="p-3 bg-muted/30 rounded-md overflow-x-auto">
          <div className="flex flex-wrap gap-1 font-mono text-sm">
            {characters.map((item, index) => (
              <motion.span
                layout
                key={`${item.position}-${index}`}
                initial={item.isCurrent ? { scale: 0.8, backgroundColor: "rgba(var(--primary-rgb), 0.1)" } : {}}
                animate={item.isCurrent ? { scale: 1.1, backgroundColor: "rgba(var(--primary-rgb), 0.3)" } : {}}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${item.isCurrent
                  ? "bg-primary/20 border border-primary/50 font-bold"
                  : item.isProcessed
                    ? "text-muted-foreground"
                    : item.isInCurrentString
                      ? "bg-orange-500/20 border border-orange-500/50"
                      : ""
                  }`}
              >
                {item.char === " " ? "␣" : item.char}
              </motion.span>
            ))}
            {currentIndex >= inputText.length && (
              <span className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-green-500/20 border border-green-500/50 text-green-600">
                End
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current State</h3>
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Current String:</div>
              <div className="font-mono">
                {currentString === "" ? (
                  <span className="text-muted-foreground">[empty]</span>
                ) : currentString === " " ? (
                  <span className="text-muted-foreground">[space]</span>
                ) : (
                  currentString
                )}
              </div>

              <div className="font-medium">Next Character:</div>
              <div className="font-mono">
                {nextChar === "" ? (
                  <span className="text-muted-foreground">[end]</span>
                ) : nextChar === " " ? (
                  <span className="text-muted-foreground">[space]</span>
                ) : (
                  nextChar
                )}
              </div>

              <div className="font-medium">Position:</div>
              <div>
                {currentIndex} / {inputText.length}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Output Codes</h3>
          <div className="p-3 bg-muted/30 rounded-md h-[100px] overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {encodedOutput.map((code, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="inline-flex items-center justify-center px-2 h-7 rounded-md bg-primary/10 border border-primary/30 font-mono text-sm"
                >
                  {code}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Algorithm Steps</h3>
        <div className="p-3 bg-muted/30 rounded-md">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li className={currentIndex === 0 ? "text-primary font-medium" : ""}>
              Initialize dictionary with all single characters
            </li>
            <li className={currentIndex > 0 && currentIndex < inputText.length ? "text-primary font-medium" : ""}>
              Find the longest string W in the dictionary that matches the current input
            </li>
            <li className={currentIndex > 0 && currentIndex < inputText.length ? "text-primary font-medium" : ""}>
              Output the code for W
            </li>
            <li className={currentIndex > 0 && currentIndex < inputText.length ? "text-primary font-medium" : ""}>
              Add W + next character to the dictionary
            </li>
            <li className={currentIndex > 0 && currentIndex < inputText.length ? "text-primary font-medium" : ""}>
              Set W to the next character
            </li>
            <li className={currentIndex >= inputText.length ? "text-primary font-medium" : ""}>
              Repeat steps 2-5 until the end of input
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
