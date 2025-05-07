"use client"

import { useEffect, useRef, useState } from "react"
import type { TreeNode } from "@/lib/huffman"
import { motion, AnimatePresence } from "framer-motion"

interface HuffmanTreeAnimationProps {
  buildSteps: Array<{
    queue: TreeNode[]
    combined: TreeNode | null
    iteration: number
  }>
  currentStep: number
  isPlaying: boolean
}

function getNodeLabel(node: TreeNode | undefined | null): string {
  if (!node) return "";

  if (node.char !== undefined) {
    return node.char;
  }

  const leftLabel = getNodeLabel(node.left);
  const rightLabel = getNodeLabel(node.right);

  return (leftLabel + rightLabel) || "•";
}

export function PriorityQueueVisualiser({ buildSteps, currentStep }: HuffmanTreeAnimationProps) {
  const [visibleNodes, setVisibleNodes] = useState<TreeNode[]>([])
  const [combinedNode, setCombinedNode] = useState<TreeNode | null>(null)
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])
  const combinedNodeTreeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentStep < buildSteps.length) {
      const step = buildSteps[currentStep]
      setVisibleNodes(step.queue)
      setCombinedNode(step.combined)

      if (step.combined) {
        setHighlightedNodes([step.combined.id!, step.combined.left?.id || "", step.combined.right?.id || ""])
      } else {
        setHighlightedNodes([])
      }
    }
  }, [buildSteps, currentStep])

  useEffect(() => {
    if (currentStep == 1)
      setTimeout(() => {
        combinedNodeTreeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 300)
  }, [currentStep])

  if (buildSteps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data to visualize</p>
      </div>
    )
  }

  return (
    <div className="p-4 h-full">

      <div className="flex flex-col space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Priority Queue</h4>
          <div className="flex flex-wrap gap-3 p-4 border rounded-md min-h-[100px]">
            <AnimatePresence>
              {visibleNodes.map((node) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${highlightedNodes.includes(node.id || "")
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/20"
                    }`}
                >
                  <div className="text-center">
                    <div
                      className="font-mono font-bold"
                      style={{
                        fontSize: `${Math.max(8, 18 - getNodeLabel(node).length * 2)}px`,
                      }}
                    >
                      {getNodeLabel(node)}
                    </div>

                    <div className="text-xs">({node.frequency})</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {combinedNode && (
          <div ref={combinedNodeTreeRef}>
            <h4 className="text-sm font-medium mb-2">Combining Nodes</h4>
            <div className="p-4 border rounded-md">
              <div className="flex justify-center items-center space-x-4">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary bg-primary/10"
                >
                  <div className="text-center">
                    <div
                      className="font-mono font-bold"
                      style={{
                        fontSize: `${Math.max(12, 18 - getNodeLabel(combinedNode.left).length * 2)}px`,
                      }}
                    >
                      {getNodeLabel(combinedNode.left)}
                    </div>
                    <div className="text-xs">({combinedNode.left?.frequency})</div>
                  </div>
                </motion.div>

                <div className="text-lg">+</div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary bg-primary/10"
                >
                  <div className="text-center">
                    <div
                      className="font-mono font-bold"
                      style={{
                        fontSize: `${Math.max(12, 18 - getNodeLabel(combinedNode.right).length * 2)}px`,
                      }}
                    >
                      {getNodeLabel(combinedNode.right)}
                    </div>
                    <div className="text-xs">({combinedNode.right?.frequency})</div>
                  </div>
                </motion.div>

                <div className="text-lg">=</div>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary bg-primary/10"
                >
                  <div className="text-center">
                    <div
                      className="font-mono font-bold"
                      style={{
                        fontSize: `${Math.max(12, 18 - getNodeLabel(combinedNode).length * 2)}px`,
                      }}
                    >
                      {getNodeLabel(combinedNode)}
                    </div>
                    <div className="text-xs">({combinedNode.frequency})</div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary"
                  >
                    <div className="text-center">
                      <div
                        className="font-mono font-bold"
                        style={{
                          fontSize: `${Math.max(12, 18 - getNodeLabel(combinedNode).length * 2)}px`,
                        }}
                      >
                        {getNodeLabel(combinedNode)}
                      </div>
                      <div className="text-xs">({combinedNode.frequency})</div>
                    </div>
                  </motion.div>
                </div>
                <div className="flex justify-center">
                  <div className="w-32 h-8 relative">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute left-0 top-0 w-full h-full flex items-center justify-center"
                    >
                      <div className="w-full h-[2px] bg-muted-foreground/50 relative">
                        <div className="absolute left-1/4 top-0 h-8 w-[2px] bg-muted-foreground/50"></div>
                        <div className="absolute right-1/4 top-0 h-8 w-[2px] bg-muted-foreground/50"></div>
                      </div>
                    </motion.div>
                  </div>
                </div>
                <div className="flex justify-center space-x-16">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-muted-foreground/50"
                  >
                    <div className="text-center">
                      <div
                        className="font-mono font-bold"
                        style={{
                          fontSize: `${Math.max(8, 18 - getNodeLabel(combinedNode.left).length * 2)}px`,
                        }}
                      >
                        {getNodeLabel(combinedNode.left)}
                      </div>
                      <div className="text-xs">({combinedNode.left?.frequency})</div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-muted-foreground/50"
                  >
                    <div className="text-center">
                      <div
                        className="font-mono font-bold"
                        style={{
                          fontSize: `${Math.max(12, 18 - getNodeLabel(combinedNode.right).length * 2)}px`,
                        }}
                      >
                        {getNodeLabel(combinedNode.right)}
                      </div>
                      <div className="text-xs">({combinedNode.right?.frequency})</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="bg-card p-3 rounded-md border shadow-sm mb-4">
          <p className="text-sm font-medium">
            {currentStep === 0
              ? <><span className="text-orange-400">Initial state:</span> Characters are sorted by frequency in the priority queue.</>
              : currentStep === buildSteps.length - 1
                ?
                <>
                  <span className="text-orange-400">Step {currentStep}/{buildSteps.length - 1}:</span> Combining the two nodes with lowest frequencies ({combinedNode?.left?.frequency || 0} + {combinedNode?.right?.frequency || 0} = {combinedNode?.frequency || 0}).
                  <br />
                  <span className="text-green-600">
                    Final state: The tree is complete. The tree will be used to generate codes.
                  </span>
                </>
                :
                <><span className="text-orange-400">Step {currentStep}/{buildSteps.length - 1}:</span> Combining the two nodes with lowest frequencies ({combinedNode?.left?.frequency || 0} + {combinedNode?.right?.frequency || 0} = {combinedNode?.frequency || 0})</>
            }
          </p>
        </div>
      </div>
    </div>
  )
}
