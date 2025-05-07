"use client"

import { useEffect, useState, useRef } from "react"
import Tree from "react-d3-tree"
import type { TreeNode } from "@/lib/huffman"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Pause, Maximize, Minimize } from "lucide-react"

interface HuffmanTreeViewProps {
  tree: TreeNode | null
  highlightedNode: string | null
  animationStep: number
  setTreeDepth?: (depth: number) => void
  treeDepth?: number
  isAnimating?: boolean
  onAnimatingChange?: (isAnimating: boolean) => void
}

const convertToD3Tree = (node: TreeNode | null, path = ""): any => {
  if (!node) return null

  const isLeaf = !node.left && !node.right

  const nodeData = {
    name: `${node.frequency}`,
    attributes: {
      frequency: node.frequency,
      ...(isLeaf && { char: node.char }),
      code: path,
      path: path,
      isLeaf,
    },
    children: [] as any[],
  }

  if (node.left) {
    nodeData.children.push(convertToD3Tree(node.left, path + "0"))
  }

  if (node.right) {
    nodeData.children.push(convertToD3Tree(node.right, path + "1"))
  }

  return nodeData
}

export function HuffmanCodeTreeView({
  tree,
  highlightedNode,
  animationStep,
  treeDepth = 0,
  setTreeDepth = () => { },
  isAnimating = false,
  onAnimatingChange = () => { },
}: HuffmanTreeViewProps) {
  const [treeData, setTreeData] = useState<any>(null)
  const [nodeSize, setNodeSize] = useState({ x: 150, y: 100 })
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [pathHighlight, setPathHighlight] = useState<string | null>(null)
  const [currentCode, setCurrentCode] = useState<string>("")
  const [pathLabels, setPathLabels] = useState<{ [key: string]: { x: number; y: number; isLeft: boolean } }>({})
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    setTimeout(() => {
      svgRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)
  }, [])

  useEffect(() => {
    if (tree) {
      const depth = calculateTreeDepth(tree)
      setTreeDepth(depth)
    }
  }, [tree, setTreeDepth])

  useEffect(() => {
    if (tree && containerRef) {
      const depth = treeDepth || calculateTreeDepth(tree)
      let height = Math.min(depth * 100, 600)

      height = Math.max(height, 300)

      containerRef.style.height = `${height}px`

      setTranslate({
        x: containerRef.clientWidth / 2,
        y: depth <= 3 ? 80 : 60,
      })
    }
  }, [tree, containerRef])

  useEffect(() => {
    if (tree) {
      const d3Tree = convertToD3Tree(tree)
      setTreeData(d3Tree)
    }
  }, [tree])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (animationStep >= 2 && highlightedNode && tree) {
      const findPath = (node: TreeNode | null, target: string, currentPath = ""): string | null => {
        if (!node) return null

        if (node.char === target) {
          return currentPath
        }

        const leftPath = findPath(node.left, target, currentPath + "0")
        if (leftPath) return leftPath

        const rightPath = findPath(node.right, target, currentPath + "1")
        if (rightPath) return rightPath

        return null
      }

      const path = findPath(tree, highlightedNode, "")
      setPathHighlight(path)

      if (path && isAnimating) {
        let builtCode = ""

        const animateCode = (index = 0) => {
          if (index < path.length) {
            builtCode += path[index]
            setCurrentCode(builtCode)
            timeoutId = setTimeout(() => animateCode(index + 1), 100)
          }
        }

        animateCode()
      } else if (path) {
        setCurrentCode(path)
      }
    } else if (animationStep < 2) {
      setPathHighlight(null)
      setCurrentCode("")
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isAnimating, animationStep, highlightedNode, tree])

  useEffect(() => {
    if (svgRef.current && animationStep >= 2) {

      const paths = svgRef.current.querySelectorAll("path")
      const newPathLabels: { [key: string]: { x: number; y: number; isLeft: boolean } } = {}

      paths.forEach((path, index) => {
        const d = path.getAttribute("d")
        if (d) {
          const matches = d.match(/M([\d.]+),([\d.]+)L([\d.]+),([\d.]+)/)
          if (matches && matches.length === 5) {
            const x1 = Number.parseFloat(matches[1])
            const y1 = Number.parseFloat(matches[2])
            const x2 = Number.parseFloat(matches[3])
            const y2 = Number.parseFloat(matches[4])

            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2

            const isLeft = x2 < x1

            newPathLabels[`path-${index}`] = {
              x: midX,
              y: midY,
              isLeft,
            }
          }
        }
      })

      setPathLabels(newPathLabels)
    }
  }, [treeData, animationStep])

  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
    const isLeaf = nodeDatum.attributes.isLeaf;
    const isHighlighted = isLeaf && nodeDatum.attributes.char === highlightedNode;

    const nodePath = nodeDatum.attributes.path;
    const isInPath = pathHighlight && nodePath && pathHighlight.startsWith(nodePath);

    const activeBgColor = "#9333ea";
    const pathBgColor = "#a855f7";
    const defaultBgColor = "#faf5ff";

    const bgColor = isHighlighted ? activeBgColor : isInPath ? pathBgColor : defaultBgColor;

    const activeTextColor = "#ffffff";
    const defaultTextColor = "#0f172a";

    const textColor = (isHighlighted || isInPath) ? activeTextColor : defaultTextColor;

    const freqTextColor = (isHighlighted || isInPath) ? "#f97316" : "#475569";
    const strokeColor = (isHighlighted || isInPath) ? "#bae6fd" : "#94a3b8";

    const codeBgColor = "#f1f5f9";
    const codeStrokeColor = "#94a3b8";
    const codeTextColor = "#0f172a";

    return (
      <g>
        <circle
          r={24}
          fill={bgColor}
          stroke={strokeColor}
          strokeWidth={2.5}
          className={isHighlighted ? "animate-pulse" : ""}
        />

        {isLeaf && (
          <text
            fill={textColor}
            x="0"
            y="-5"
            fontSize={18}
            fontWeight="bold"
            textAnchor="middle"
            style={{ pointerEvents: "none" }}
          >
            {nodeDatum.attributes.char}
          </text>
        )}

        <text
          fill={freqTextColor}
          x="0"
          y={isLeaf ? "12" : "0"}
          dy={isLeaf ? "0" : ".3em"}
          fontSize={isLeaf ? 12 : 20}
          textAnchor="middle"
          style={{ pointerEvents: "none" }}
        >
          {nodeDatum.attributes.frequency}
        </text>

        {nodeDatum.attributes.code && animationStep >= 2 && (
          <g>
            <rect
              x="-30"
              y="35"
              width="60"
              height="22"
              rx="4"
              fill={codeBgColor}
              stroke={codeStrokeColor}
              strokeWidth={1.5}
            />
            <text
              fill={codeTextColor}
              x="0"
              y="50"
              fontSize={12}
              fontWeight="medium"
              textAnchor="middle"
              style={{ pointerEvents: "none" }}
            >
              {nodeDatum.attributes.code}
            </text>
          </g>
        )}
      </g>
    );
  };


  const pathClassFunc = (linkData: any) => {
    const { source, target } = linkData
    const sourcePath = source.data.attributes.path
    const targetPath = target.data.attributes.path

    const isInPath = pathHighlight && targetPath && pathHighlight.startsWith(targetPath)

    return isInPath
      ? "stroke-primary stroke-[3px]"
      : "stroke-slate-400 stroke-[2px]"
  }

  const handlePlayPause = () => {
    onAnimatingChange(!isAnimating)
  }

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground animate-pulse">
          {animationStep < 1 ? "Waiting to build tree..." : "Processing..."}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative" ref={(ref) => setContainerRef(ref)}>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button size="sm" variant="outline" onClick={handlePlayPause}>
          {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      {highlightedNode && currentCode && (
        <div className="absolute top-2 left-2  z-10 flex flex-col items-center space-y-1">
          <Badge variant="secondary" className="text-base">
            {highlightedNode}: {currentCode}
          </Badge>
        </div>
      )}

      <div
        className="w-full h-full"
        ref={(ref) => {
          svgRef.current = ref?.querySelector("svg") || null
        }}
      >
        {treeData && (
          <Tree
            data={treeData}
            orientation="vertical"
            renderCustomNodeElement={renderCustomNode}
            nodeSize={nodeSize}
            translate={translate}
            separation={{ siblings: 1.5, nonSiblings: 1 }}
            pathClassFunc={pathClassFunc}
            enableLegacyTransitions={true}
            transitionDuration={500}
            zoomable={true}
            scaleExtent={{ min: 0.1, max: 2 }}
            zoom={treeDepth >= 5 ? 0.7 : treeDepth >= 3 ? 0.85 : 1}
            collapsible={false}
          />
        )}
      </div>

      {animationStep >= 2 && (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {Object.entries(pathLabels).map(([key, { x, y, isLeft }]) => (
            <g key={key} transform={`translate(${x + (isLeft ? -15 : 15)}, ${y - 5})`}>
              <rect
                x="-10"
                y="-10"
                width="20"
                height="20"
                rx="4"
                fill="#334155"
                stroke="#94a3b8"
                strokeWidth={1.5}
              />
              <text
                x="0"
                y="0"
                dy=".3em"
                fontSize={14}
                fontWeight="bold"
                fill={"#0f172a"}
                textAnchor="middle"
              >
                {isLeft ? "0" : "1"}
              </text>
            </g>
          ))}
        </svg>
      )}

      {animationStep >= 2 && (
        <div className="absolute bottom-4 right-4">
          <Badge variant="outline" className="bg-card px-3 py-1 text-sm font-medium">
            Tree Depth: {tree ? calculateTreeDepth(tree) : 0}
          </Badge>
        </div>
      )}
    </div>
  )
}

export function calculateTreeDepth(node: TreeNode | null): number {
  if (!node) return 0
  if (!node.left && !node.right) return 1

  const leftDepth = calculateTreeDepth(node.left)
  const rightDepth = calculateTreeDepth(node.right)

  return Math.max(leftDepth, rightDepth) + 1
}
