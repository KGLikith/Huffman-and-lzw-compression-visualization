"use client"

import { motion } from "framer-motion"

interface LZWDictionaryVisualizerProps {
  dictionary: Map<string, number>
  currentString: string
  showOnlyMultiChar?: boolean
}

export function LZWDictionaryVisualizer({
  dictionary,
  currentString,
  showOnlyMultiChar = false,
}: LZWDictionaryVisualizerProps) {
  const filteredEntries = Array.from(dictionary.entries())
    .filter(([key]) => !showOnlyMultiChar || key.length > 1)
    .sort((a, b) => a[1] - b[1])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-sm font-medium">
        <div>Code</div>
        <div>String</div>
        <div>Length</div>
      </div>

      <div className="space-y-1 max-h-[350px] overflow-y-auto pr-2">
        {filteredEntries.map(([key, value]) => {
          const isHighlighted = key === currentString
            console.log("isHighlighted", isHighlighted, currentString)
          return (
            <motion.div
              key={value}
              initial={isHighlighted ? { scale: 0.95, backgroundColor: "rgba(var(--primary-rgb), 0.1)" } : {}}
              animate={isHighlighted ? { scale: 1, backgroundColor: "rgba(var(--primary-rgb), 0.2)" } : {}}
              className={`grid grid-cols-3 gap-2 text-sm py-1 px-2 rounded-md ${
                isHighlighted ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
              }`}
            >
              <div>{value}</div>
              <div className="font-mono">
                {key === " " ? (
                  <span className="text-muted-foreground">[space]</span>
                ) : key === "\n" ? (
                  <span className="text-muted-foreground">\n</span>
                ) : key === "\t" ? (
                  <span className="text-muted-foreground">\t</span>
                ) : key.length > 10 ? (
                  `${key.substring(0, 10)}...`
                ) : (
                  key
                )}
              </div>
              <div>{key.length}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span>Total Dictionary Entries:</span>
          <span className="font-medium">{dictionary.size}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Multi-Character Entries:</span>
          <span className="font-medium">{Array.from(dictionary.keys()).filter((key) => key.length > 1).length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Bits Per Code:</span>
          <span className="font-medium">{Math.ceil(Math.log2(dictionary.size))}</span>
        </div>
      </div>
    </div>
  )
}
