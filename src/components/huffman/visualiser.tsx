"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Info,
  TicketCheck,
  Check,
  Download,
  FileText,
  Upload,
  FileCode,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  measureHuffmanFrequency,
  buildHuffmanTreeWithSteps,
  generateHuffmanCodes,
  encodeText,
  decodeText,
} from "@/lib/huffman"
import { PriorityQueueVisualiser } from "@/components/huffman/priority-queue"
import { HuffmanCodeTreeView } from "@/components/huffman/code-tree-view"
import { HuffmanCodeTable } from "@/components/huffman/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"

interface HuffmanVisualizerProps {
  inputText: string
  animationStep: number
  isAnimating: boolean
  hasCompressed: boolean
  animationSpeed?: number
  onStepChange?: (step: number) => void
  onAnimatingChange?: (isAnimating: boolean) => void
}

export function HuffmanVisualizer({
  inputText,
  animationStep,
  isAnimating,
  hasCompressed,
  animationSpeed = 1,
  onStepChange,
  onAnimatingChange,
}: HuffmanVisualizerProps) {
  const [frequencies, setFrequencies] = useState<Map<string, number>>(new Map())
  const [tree, setTree] = useState<any>(null)
  const [codes, setCodes] = useState<Map<string, string>>(new Map())
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [encodedText, setEncodedText] = useState<string>("")
  const [compressionStats, setCompressionStats] = useState({
    originalBits: 0,
    compressedBits: 0,
    ratio: 0,
  })
  const [buildSteps, setBuildSteps] = useState<any[]>([])
  const [currentBuildStep, setCurrentBuildStep] = useState(0)
  const [activeTab, setActiveTab] = useState("building")
  const [stepDescription, setStepDescription] = useState("")
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const [treeDepth, setTreeDepth] = useState(0)
  const [decodeInput, setDecodeInput] = useState("")
  const [decodedOutput, setDecodedOutput] = useState("")
  const [activeDecodeTab, setActiveDecodeTab] = useState<"text" | "file">("text")
  const [showFullInput, setShowFullInput] = useState(false)
  const [showFullOutput, setShowFullOutput] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const decodeFileInputRef = useRef<HTMLInputElement>(null)

  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nodeIndexRef = useRef(0)

  const shouldStack = treeDepth >= 5

  useEffect(() => {
    if (!inputText || !hasCompressed) return

    if (animationStep === 1) {
      const freqs = measureHuffmanFrequency(inputText)
      setFrequencies(freqs)

      const { tree: huffmanTree, steps } = buildHuffmanTreeWithSteps(freqs)
      setBuildSteps(steps)
      setTree(huffmanTree)

      const huffmanCodes = generateHuffmanCodes(huffmanTree)
      setCodes(huffmanCodes)

      const encoded = encodeText(inputText, huffmanCodes)
      setEncodedText(encoded)

      const originalBits = inputText.length * 8
      const compressedBits = encoded.length
      const ratio = originalBits / compressedBits

      setCompressionStats({
        originalBits,
        compressedBits,
        ratio,
      })

      setCurrentBuildStep(0)
      setStepDescription("Starting to build the Huffman tree by identifying characters with lowest frequencies")

      setTimeout(() => {
        treeContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 300)
    }
  }, [inputText, animationStep, hasCompressed])

  useEffect(() => {
    if (!hasCompressed) return

    if (animationStep === 0) {
      setActiveTab("building")
      setCurrentBuildStep(0)
      setStepDescription("")
    } else if (animationStep === 1) {
      setActiveTab("building")
      setCurrentBuildStep(0)
      setStepDescription("Starting to build the Huffman tree by identifying characters with lowest frequencies")
    } else if (animationStep === 2) {
      setActiveTab("codes")
      setStepDescription("Generating variable-length codes for each character based on their position in the tree")
    } else if (animationStep === 3) {
      setActiveTab("encoded")
      setStepDescription("Replacing each character with its corresponding code to create the compressed output")
    }
  }, [animationStep, hasCompressed])

  useEffect(() => {
    if (!hasCompressed) return

    if (isAnimating && activeTab === "building" && currentBuildStep < buildSteps.length - 1) {
      const delay = 1500 / (animationSpeed || 1)
      if (currentBuildStep === 0) {
        setStepDescription("Starting to build the Huffman tree by identifying characters with lowest frequencies")
        setTimeout(() => {
          setCurrentBuildStep(1)
        }, delay)
        return
      }
      const animateNextNode = () => {
        animationTimerRef.current = setTimeout(() => {
          const nextStep = currentBuildStep + 1

          setCurrentBuildStep(nextStep)

          if (nextStep >= buildSteps.length - 1 && onStepChange) {
            setStepDescription("Huffman tree construction complete. The tree is now ready for generating codes.")
            setTimeout(() => {
              onStepChange(2)
            }, 2000)
          }
        }, delay)
      }
      animateNextNode()
    } else {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    }
  }, [isAnimating, currentBuildStep, buildSteps.length, activeTab, onStepChange, hasCompressed, animationSpeed])

  useEffect(() => {
    if (!hasCompressed) return
    if (animationStep !== 2) return
    if (isAnimating && activeTab === "codes" && frequencies.size > 0) {
      const nodes = Array.from(frequencies.keys())
      const delay = 1500 / (animationSpeed || 1)

      const animateNextNode = () => {
        if (nodeIndexRef.current >= nodes.length) {
          nodeIndexRef.current = 0
          if (onStepChange) {
            onStepChange(3)
          }
          return
        }

        const currentChar = nodes[nodeIndexRef.current]
        setHighlightedNode(currentChar)
        setStepDescription(
          `Character "${currentChar}" is assigned code "${codes.get(currentChar) || ""}" based on its path from root to leaf`,
        )

        animationTimerRef.current = setTimeout(() => {
          nodeIndexRef.current++
          setHighlightedNode(null)

          animationTimerRef.current = setTimeout(animateNextNode, delay / 2)
        }, delay)
      }

      animateNextNode()
    } else {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    }
  }, [isAnimating, activeTab, frequencies, onStepChange, hasCompressed, codes, animationSpeed])

  const handleNextBuildStep = () => {
    if (currentBuildStep < buildSteps.length - 1) {
      const nextStep = currentBuildStep + 1
      setCurrentBuildStep(nextStep)

      if (nextStep === 0) {
        setStepDescription("Starting to build the Huffman tree by identifying characters with lowest frequencies")
      } else if (nextStep === buildSteps.length - 1) {
        setStepDescription("Huffman tree construction complete. The tree is now ready for generating codes.")
      }
    } else if (onStepChange) {
      onStepChange(2)
    }
  }

  const handleDecodeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setDecodeInput(text)
    } catch (error) {
      console.error("Error reading file:", error)
    }
  }

  const handleDecode = () => {
    if (!decodeInput || !tree) return

    const decoded = decodeText(decodeInput, tree)
    setDecodedOutput(decoded)
  }

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const truncateText = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const handleResetBuildStep = () => {
    setCurrentBuildStep(0)
    setStepDescription("Starting to build the Huffman tree by identifying characters with lowest frequencies")
  }

  const handlePlayPause = () => {
    if (onAnimatingChange) {
      onAnimatingChange(!isAnimating)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)

    if (tab === "building" && onStepChange) {
      onStepChange(1)
    } else if (tab === "codes" && onStepChange) {
      onStepChange(2)
    } else if (tab === "encoded" && onStepChange) {
      onStepChange(3)
    }
  }

  if (!hasCompressed) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <p className="text-muted-foreground">Press the Compress button to start visualization</p>
        <div className="max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            Huffman coding is a lossless data compression algorithm that assigns variable-length codes to input
            characters, with shorter codes for more frequent characters.
          </p>
        </div>
      </div>
    )
  }

  if (!inputText) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Please enter some text to visualize</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="building">1. Tree Building</TabsTrigger>
          <TabsTrigger value="codes">2. Code Generation</TabsTrigger>
          <TabsTrigger value="encoded">3. Text Encoding</TabsTrigger>
          <TabsTrigger value="decode">4. Decoding</TabsTrigger>
        </TabsList>

        <TabsContent value="building" className="mt-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isAnimating ? (
                <Button size="sm" variant="outline" onClick={handlePlayPause}>
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handlePlayPause}>
                  <Play className="h-4 w-4 mr-1" /> Play
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleNextBuildStep}>
                <SkipForward className="h-4 w-4 mr-1" /> Next Step
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetBuildStep}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setCurrentBuildStep(buildSteps.length - 1)
                  setStepDescription("Huffman tree construction complete. The tree is now ready for generating codes.")
                  setTimeout(() => {
                    if (onStepChange) onStepChange(2)
                  }, 500)
                }}
              >
                <TicketCheck className="h-4 w-4 mr-1" /> Finish
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentBuildStep + 1} of {buildSteps.length}
            </span>
          </div>

          <Progress value={((currentBuildStep + 1) / buildSteps.length) * 100} className="h-2 mb-6" />

          {stepDescription && (
            <Alert className="mb-4 bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription>{stepDescription}</AlertDescription>
            </Alert>
          )}
          <div ref={treeContainerRef} className="h-full border rounded-md overflow-hidden">
            <PriorityQueueVisualiser buildSteps={buildSteps} currentStep={currentBuildStep} isPlaying={isAnimating} />
          </div>
        </TabsContent>

        <TabsContent value="codes" className="mt-0">
          <div className={`w-full flex ${shouldStack ? "flex-col" : "flex-row"} fap-4`}>
            <Card className={`${!shouldStack ? "w-3/4" : "w-full"} p-4 `}>
              <h3 className="font-medium ">Huffman Tree</h3>
              <div className="h-full  border rounded-md p-4 relative">
                <HuffmanCodeTreeView
                  treeDepth={treeDepth}
                  setTreeDepth={setTreeDepth}
                  tree={tree}
                  highlightedNode={highlightedNode}
                  animationStep={animationStep}
                  isAnimating={isAnimating}
                  onAnimatingChange={onAnimatingChange}
                />
                <div className="absolute bottom-4 left-4">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      nodeIndexRef.current = Array.from(frequencies.keys()).length
                      setHighlightedNode(null)
                      setStepDescription("Code generation complete. Ready to encode the text.")
                      setTimeout(() => {
                        if (onStepChange) onStepChange(3)
                      }, 500)
                    }}
                  >
                    <TicketCheck className="h-4 w-4 mr-1" /> Finish
                  </Button>
                </div>
              </div>
              {stepDescription && (
                <Alert className=" bg-muted/50 border-muted text-white">
                  <AlertDescription className="text-orange-400">{stepDescription}</AlertDescription>
                </Alert>
              )}
            </Card>

            <Card className={`${!shouldStack ? "w-1/4" : "w-1/2"} p-4 `}>
              <h3 className="font-medium mb-2">Character Codes</h3>
              <div className="h-fit  border rounded-md p-4">
                <HuffmanCodeTable
                  frequencies={frequencies}
                  codes={codes}
                  highlightedChar={highlightedNode}
                  animationStep={2}
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="encoded" className="mt-0">
          <Card className="p-6">
            <h3 className="font-semibold text-xl mb-6">Compression Results</h3>

            {stepDescription && (
              <Alert className="bg-muted/50 border-muted">
                <Check className="h-5 w-5 text-green-500" />
                <AlertDescription className="text-green-600 text-base">{stepDescription}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl text-base h-fit">
                <div className="flex justify-between">
                  <span>Original Size:</span>
                  <Badge variant="outline">{compressionStats.originalBits} bits</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Compressed Size:</span>
                  <Badge variant="outline">{compressionStats.compressedBits} bits</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Compression Ratio:</span>
                  <Badge variant="secondary" className="text-green-500">
                    {compressionStats.ratio.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Space Saved:</span>
                  <Badge variant="secondary" className="text-green-500">
                    {compressionStats.originalBits - compressionStats.compressedBits} bits
                  </Badge>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Original Text:</h4>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setShowFullInput(!showFullInput)}>
                              {showFullInput ? "Show Less" : "Show More"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{showFullInput ? "Collapse text" : "Expand full text"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile("original_text.txt", inputText)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download original text</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div
                    className={`p-3 bg-muted rounded-md overflow-x-auto ${showFullInput ? "max-h-96" : "max-h-32"} overflow-y-auto`}
                  >
                    <code className="text-xs whitespace-pre-wrap break-all">
                      {showFullInput ? inputText : truncateText(inputText)}
                    </code>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Encoded Output:</h4>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setShowFullOutput(!showFullOutput)}>
                              {showFullOutput ? "Show Less" : "Show More"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{showFullOutput ? "Collapse text" : "Expand full text"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile("encoded_output.txt", encodedText)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download encoded text</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div
                    className={`p-3 bg-muted rounded-md overflow-x-auto ${showFullOutput ? "max-h-96" : "max-h-32"} overflow-y-auto`}
                  >
                    <code className="text-xs whitespace-pre-wrap break-all">
                      {showFullOutput ? encodedText : truncateText(encodedText)}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-muted/30 rounded-xl">
              <h4 className="text-lg font-semibold mb-4">Why Huffman Coding is Efficient</h4>
              <ul className="list-disc list-inside text-base space-y-2 text-muted-foreground">
                <li>Traditional ASCII encoding uses 8 bits per character</li>
                <li>Huffman uses shorter codes for more frequent characters (sometimes just 1-2 bits)</li>
                <li>The more skewed the character frequency, the better the compression</li>
                <li>Compression is lossless — no information is lost</li>
                <li>Especially efficient for data with repetitive patterns</li>
              </ul>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="decode" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Decode Huffman Encoded Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Input Encoded Text</h4>
                    <Tabs value={activeDecodeTab} onValueChange={(v) => setActiveDecodeTab(v as "text" | "file")}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="text">
                          <FileText className="h-4 w-4 mr-2" /> Text Input
                        </TabsTrigger>
                        <TabsTrigger value="file">
                          <Upload className="h-4 w-4 mr-2" /> File Upload
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="mt-0">
                        <Textarea
                          placeholder="Paste encoded binary text here..."
                          className="min-h-[150px]"
                          value={decodeInput}
                          onChange={(e) => setDecodeInput(e.target.value)}
                        />
                      </TabsContent>

                      <TabsContent value="file" className="mt-0">
                        <div className="border-2 border-dashed rounded-md p-6 text-center">
                          <Input
                            type="file"
                            ref={decodeFileInputRef}
                            accept=".txt,.bin"
                            className="hidden"
                            onChange={handleDecodeFileUpload}
                          />
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <FileCode className="h-8 w-8 text-muted-foreground" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Upload encoded file</p>
                              <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => decodeFileInputRef.current?.click()}>
                              Select File
                            </Button>
                          </div>
                          {decodeInput && (
                            <div className="mt-4 text-left">
                              <p className="text-sm font-medium">File loaded:</p>
                              <p className="text-xs text-muted-foreground truncate">{truncateText(decodeInput, 50)}</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <Button onClick={handleDecode} disabled={!decodeInput || !tree} className="w-full">
                    Decode Text
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium mb-2">Decoded Output</h4>
                  {decodedOutput ? (
                    <>
                      <div className="p-3 bg-muted rounded-md overflow-x-auto max-h-[250px] overflow-y-auto">
                        <code className="text-xs whitespace-pre-wrap break-all">
                          {truncateText(decodedOutput, 500)}
                        </code>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile("decoded_output.txt", decodedOutput)}
                        >
                          <Download className="h-4 w-4 mr-2" /> Download Decoded Text
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 bg-muted/30 rounded-md text-center">
                      <p className="text-muted-foreground">
                        Enter encoded text and click "Decode Text" to see the result
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Alert className="bg-muted/30">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The decoder uses the same Huffman tree that was generated during compression. For decoding to work
                    correctly, you must use the encoded text from this session.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
