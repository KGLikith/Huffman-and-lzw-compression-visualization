"use client"

import React from "react"

import { useEffect, useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipForward, RotateCcw, Info, Check, Download, FileText, Upload, FileCode } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { LZWDictionaryVisualizer } from "@/components/lzw/dictionary-visualizer"
import { LZWEncodingProcess } from "@/components/lzw/encoding-process"
import { downloadAsFile } from "@/lib/huffman" // Reusing the download utility

interface LZWVisualizerProps {
  inputText: string
  animationStep: number
  isAnimating: boolean
  hasCompressed: boolean
  animationSpeed?: number
  onStepChange?: (step: number) => void
  onAnimatingChange?: (isAnimating: boolean) => void
}

export function LZWVisualizer({
  inputText,
  animationStep,
  isAnimating,
  hasCompressed,
  animationSpeed = 1,
  onStepChange,
  onAnimatingChange,
}: LZWVisualizerProps) {
  const [dictionary, setDictionary] = useState<Map<string, number>>(new Map())
  const [encodedOutput, setEncodedOutput] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentString, setCurrentString] = useState("")
  const [nextChar, setNextChar] = useState("")
  const [compressionStats, setCompressionStats] = useState({
    originalBits: 0,
    compressedBits: 0,
    ratio: 0,
  })
  const [stepDescription, setStepDescription] = useState("")
  const [activeTab, setActiveTab] = useState("building")
  const [showFullInput, setShowFullInput] = useState(false)
  const [showFullOutput, setShowFullOutput] = useState(false)
  const [decodeInput, setDecodeInput] = useState("")
  const [decodedOutput, setDecodedOutput] = useState("")
  const [activeDecodeTab, setActiveDecodeTab] = useState<"text" | "file">("text")
  const [encodedOutputWithBits, setEncodedOutputWithBits] = useState<{ code: number, bits: number }[]>([])

  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dictionaryContainerRef = useRef<HTMLDivElement>(null)
  const decodeFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!inputText || !hasCompressed) return

    if (animationStep === 1) {
      const initialDictionary = new Map<string, number>()
      for (let i = 0; i < 256; i++) {
        initialDictionary.set(String.fromCharCode(i), i)
      }
      setDictionary(initialDictionary)
      setCurrentIndex(0)
      setCurrentString("")
      setNextChar(inputText[0] || "")
      setEncodedOutput([])

      const originalBits = inputText.length * 8
      setCompressionStats({
        originalBits,
        compressedBits: 0,
        ratio: 0,
      })

      setStepDescription("Starting LZW compression by initializing the dictionary with ASCII characters")

      setTimeout(() => {
        dictionaryContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 300)
    }
  }, [inputText, animationStep, hasCompressed])

  useEffect(() => {
    if (!hasCompressed) return

    if (animationStep === 0) {
      setActiveTab("building")
      setCurrentIndex(0)
      setStepDescription("")
    } else if (animationStep === 1) {
      setActiveTab("building")
      setCurrentIndex(0)
      setStepDescription("Starting LZW compression by initializing the dictionary with ASCII characters")
    } else if (animationStep === 2) {
      setActiveTab("encoding")
      setStepDescription("Encoding the input text using the LZW dictionary")
    } else if (animationStep === 3) {
      setActiveTab("encoded")
      setStepDescription("Compression complete. The text has been encoded using LZW algorithm.")
    }
  }, [animationStep, hasCompressed])

  useEffect(() => {
    if (!hasCompressed || !isAnimating || animationStep !== 2 || !inputText) return

    const delay = 1500 / (animationSpeed || 1)

    const performLZWStep = () => {
      if (currentIndex >= inputText.length) {
        if (currentString) {
          const code = dictionary.get(currentString) || 0
          const bitsNeeded = Math.ceil(Math.log2(dictionary.size || 1))

          setEncodedOutput((prev) => [...prev, code])
          setEncodedOutputWithBits((prev) => {
            const newList = [...prev, { code, bits: bitsNeeded }]
            const compressedBits = newList.reduce((sum, { bits }) => sum + bits, 0)
            setCompressionStats((prev) => ({
              ...prev,
              compressedBits,
              ratio: prev.originalBits / compressedBits,
            }))
            return newList
          })
        }

        if (onStepChange) {
          setTimeout(() => {
            onStepChange(3)
          }, delay)
        }
        return
      }

      const char = inputText[currentIndex]
      const stringPlusChar = currentString + char

      setNextChar(inputText[currentIndex + 1] || "")

      if (dictionary.has(stringPlusChar)) {
        setCurrentString(stringPlusChar)
        setStepDescription(`"${stringPlusChar}" is already in the dictionary, continuing to the next character`)
      } else {
        const code = dictionary.get(currentString) || 0
        const bitsNeeded = Math.ceil(Math.log2(dictionary.size || 1))

        setEncodedOutput((prev) => [...prev, code])
        setEncodedOutputWithBits((prev) => [...prev, { code, bits: bitsNeeded }])

        setDictionary((prev) => {
          const newDict = new Map(prev)
          newDict.set(stringPlusChar, newDict.size)
          return newDict
        })

        setStepDescription(
          `Adding "${stringPlusChar}" to dictionary with code ${dictionary.size}, outputting code for "${currentString}"`
        )
        setCurrentString(char)
      }

      setCurrentIndex((prev) => prev + 1)
    }

    animationTimerRef.current = setTimeout(performLZWStep, delay)

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    }
  }, [
    isAnimating,
    currentIndex,
    currentString,
    dictionary,
    inputText,
    animationStep,
    hasCompressed,
    animationSpeed,
    onStepChange,
  ])


  const decodeLZW = (encodedData: number[]): string => {
    const dictionary: string[] = []
    for (let i = 0; i < 256; i++) {
      dictionary[i] = String.fromCharCode(i)
    }

    let result = ""
    let previousCode = encodedData[0]
    let currentChar = dictionary[previousCode]
    result += currentChar

    for (let i = 1; i < encodedData.length; i++) {
      const currentCode = encodedData[i]
      let entry: string

      if (currentCode >= dictionary.length) {
        entry = dictionary[previousCode] + currentChar
      } else {
        entry = dictionary[currentCode]
      }

      result += entry
      currentChar = entry[0]
      dictionary.push(dictionary[previousCode] + currentChar)
      previousCode = currentCode
    }

    return result
  }

  const handleDecode = () => {
    try {
      const encodedArray = decodeInput.split(",").map((num) => Number.parseInt(num.trim(), 10))
      const decoded = decodeLZW(encodedArray)
      setDecodedOutput(decoded)
    } catch (error) {
      setDecodedOutput("Error decoding. Make sure the input is a comma-separated list of numbers.")
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

  const handleNextStep = () => {
    if (currentIndex < inputText.length) {
      const char = inputText[currentIndex]
      const stringPlusChar = currentString + char

      setNextChar(inputText[currentIndex + 1] || "")

      if (dictionary.has(stringPlusChar)) {
        setCurrentString(stringPlusChar)
        setStepDescription(`"${stringPlusChar}" is already in the dictionary, continuing to the next character`)
      } else {
        const code = dictionary.get(currentString) || 0
        const bitsNeeded = Math.ceil(Math.log2(dictionary.size || 1))

        setEncodedOutput((prev) => [...prev, code])
        setEncodedOutputWithBits((prev) => [...prev, { code, bits: bitsNeeded }])

        setDictionary((prev) => {
          const newDict = new Map(prev)
          newDict.set(stringPlusChar, newDict.size)
          return newDict
        })

        setStepDescription(
          `Adding "${stringPlusChar}" to dictionary with code ${dictionary.size}, outputting code for "${currentString}"`
        )
        setCurrentString(char)
      }

      setCurrentIndex((prev) => prev + 1)
    } else if (currentString) {
      const code = dictionary.get(currentString) || 0
      const bitsNeeded = Math.ceil(Math.log2(dictionary.size || 1))

      setEncodedOutput((prev) => [...prev, code])
      setEncodedOutputWithBits((prev) => {
        const finalList = [...prev, { code, bits: bitsNeeded }]
        const compressedBits = finalList.reduce((sum, { bits }) => sum + bits, 0)
        setCompressionStats((prev) => ({
          ...prev,
          compressedBits,
          ratio: prev.originalBits / compressedBits,
        }))
        return finalList
      })

      setCurrentString("")

      if (onStepChange) {
        onStepChange(3)
      }
    }
  }


  const handleFinish = () => {
  const tempDict = new Map(dictionary)
  const tempOutput: number[] = [...encodedOutput]
  const tempWithBits: { code: number, bits: number }[] = [...encodedOutputWithBits]

  let tempString = ''
  const input = inputText
  let idx = currentIndex

  while (idx < input.length) {
    let nextStr = tempString + input[idx]
    while (tempDict.has(nextStr) && idx < input.length) {
      tempString = nextStr
      idx++
      nextStr = tempString + input[idx]
    }

    if (tempString) {
      const code = tempDict.get(tempString)!
      const bits = Math.ceil(Math.log2(tempDict.size || 1))
      tempOutput.push(code)
      tempWithBits.push({ code, bits })
    }

    if (idx < input.length) {
      tempDict.set(nextStr, tempDict.size)
      tempString = input[idx]
      idx++
    }
  }

  if (tempString) {
    const code = tempDict.get(tempString)!
    const bits = Math.ceil(Math.log2(tempDict.size || 1))
    tempOutput.push(code)
    tempWithBits.push({ code, bits })
  }

  const compressedBits = tempWithBits.reduce((sum, { bits }) => sum + bits, 0)

  setCurrentIndex(input.length)
  setDictionary(tempDict)
  setEncodedOutput(tempOutput)
  setEncodedOutputWithBits(tempWithBits)
  setCompressionStats((prev) => ({
    ...prev,
    compressedBits,
    ratio: prev.originalBits / compressedBits,
  }))

  onStepChange?.(3)
}

  const handleResetStep = () => {
    setCurrentIndex(0)
    setCurrentString("")
    setNextChar(inputText[0] || "")
    setEncodedOutput([])

    const initialDictionary = new Map<string, number>()
    for (let i = 0; i < 256; i++) {
      initialDictionary.set(String.fromCharCode(i), i)
    }
    setDictionary(initialDictionary)

    setStepDescription("Starting LZW compression by initializing the dictionary with ASCII characters")
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
    } else if (tab === "encoding" && onStepChange) {
      onStepChange(2)
    } else if (tab === "encoded" && onStepChange) {
      onStepChange(3)
    }
  }

  const truncateText = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (!hasCompressed) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <p className="text-muted-foreground">Press the Compress button to start visualization</p>
        <div className="max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            LZW (Lempel-Ziv-Welch) is a dictionary-based compression algorithm that builds a dictionary of patterns as
            it processes the input data, replacing repeated patterns with shorter codes.
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
          <TabsTrigger value="building">1. Dictionary Init</TabsTrigger>
          <TabsTrigger value="encoding">2. Encoding Process</TabsTrigger>
          <TabsTrigger value="encoded">3. Compression Results</TabsTrigger>
          <TabsTrigger value="decode">4. Decoding</TabsTrigger>
        </TabsList>

        <TabsContent value="building" className="mt-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onStepChange && onStepChange(2)}>
                <SkipForward className="h-4 w-4 mr-1" /> Go to Encoding
              </Button>
            </div>
          </div>

          {stepDescription && (
            <Alert className="mb-4 bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription>{stepDescription}</AlertDescription>
            </Alert>
          )}

          <div ref={dictionaryContainerRef} className="h-full border rounded-md overflow-hidden p-4">
            <h3 className="font-medium mb-4">LZW Dictionary Initialization</h3>
            <p className="mb-4 text-muted-foreground">
              LZW begins by initializing a dictionary with all possible single characters (ASCII values 0-255). Each
              character is assigned a unique code.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <CardTitle className="text-sm mb-2">Dictionary Structure</CardTitle>
                <div className="border rounded-md p-4 bg-muted/30 h-[300px] overflow-auto">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-semibold">String</div>
                    <div className="font-semibold">Code</div>
                    {Array.from(dictionary.entries())
                      .filter(([key]) => key.length === 1 && key.charCodeAt(0) < 128)
                      .slice(32, 127)
                      .map(([key, value]) => (
                        <React.Fragment key={value}>
                          <div className="border-b py-1">
                            {key === " " ? "Space" : key === "\n" ? "\\n" : key === "\t" ? "\\t" : key}
                          </div>
                          <div className="border-b py-1">{value}</div>
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <CardTitle className="text-sm mb-2">How LZW Works</CardTitle>
                <div className="border rounded-md p-4 bg-muted/30 h-[300px] overflow-auto">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Initialize dictionary with all single characters</li>
                    <li>Find the longest string W in the dictionary that matches the current input</li>
                    <li>Output the code for W</li>
                    <li>Add W + next character to the dictionary</li>
                    <li>Set W to the next character</li>
                    <li>Repeat steps 2-5 until the end of input</li>
                  </ol>

                  <div className="mt-4 p-3 bg-primary/10 rounded-md">
                    <h4 className="font-medium mb-2">Advantages of LZW</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Adapts to the data being compressed</li>
                      <li>No need to transmit the dictionary</li>
                      <li>Fast encoding and decoding</li>
                      <li>Effective for text with repeated patterns</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="encoding" className="mt-0">
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
              <Button size="sm" variant="outline" onClick={handleNextStep}>
                <SkipForward className="h-4 w-4 mr-1" /> Next Step
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetStep}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
              <Button size="sm" variant="default" onClick={handleFinish}>
                <Check className="h-4 w-4 mr-1" /> Finish
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              Position {currentIndex} of {inputText.length}
            </span>
          </div>

          <Progress value={(currentIndex / inputText.length) * 100} className="h-2 mb-6" />

          {stepDescription && (
            <Alert className="mb-4 bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription>{stepDescription}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <CardTitle className="text-sm mb-2">Encoding Process</CardTitle>
              <div className="border rounded-md p-4 h-[400px] overflow-auto">
                <LZWEncodingProcess
                  inputText={inputText}
                  currentIndex={currentIndex}
                  currentString={currentString}
                  nextChar={nextChar}
                  encodedOutput={encodedOutput}
                />
              </div>
            </Card>

            <Card className="p-4">
              <CardTitle className="text-sm mb-2">Growing Dictionary</CardTitle>
              <div className="border rounded-md p-4 h-[400px] overflow-auto">
                <LZWDictionaryVisualizer
                  dictionary={dictionary}
                  currentString={currentString + nextChar}
                  showOnlyMultiChar={true}
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
                              onClick={() => downloadAsFile("original_text.txt", inputText)}
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
                              onClick={() => downloadAsFile("encoded_output.txt", encodedOutput.join(", "))}
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
                      {showFullOutput ? encodedOutput.join(", ") : truncateText(encodedOutput.join(", "))}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-muted/30 rounded-xl">
              <h4 className="text-lg font-semibold mb-4">Why LZW Compression is Efficient</h4>
              <ul className="list-disc list-inside text-base space-y-2 text-muted-foreground">
                <li>Builds a dictionary of patterns as it processes the data</li>
                <li>Replaces repeated patterns with shorter codes</li>
                <li>More efficient for longer inputs with repetitive patterns</li>
                <li>Dictionary doesn't need to be transmitted with the compressed data</li>
                <li>Used in GIF, TIFF, and early ZIP implementations</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="decode" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Decode LZW Encoded Text</CardTitle>
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
                          placeholder="Paste encoded values as comma-separated numbers..."
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

                  <Button onClick={handleDecode} disabled={!decodeInput} className="w-full">
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
                          onClick={() => downloadAsFile("decoded_output.txt", decodedOutput)}
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
                    The decoder rebuilds the same dictionary during decompression. For decoding to work correctly, you
                    must use the encoded output from this session as comma-separated numbers.
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
