"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, FileText, Upload, Sparkles } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { HuffmanVisualizer } from "@/components/huffman/visualiser"
import { toast } from "sonner"
import { LZWVisualizer } from "@/components/lzw/visualizer"

const sampleInputs = {
  simple: "AABCABAACAABCABCABAAACAABBCA",
  repeatingPatterns: "abcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabc",
  englishText:
    "The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.",
  htmlMarkup:
    '<div class="container"><div class="header"><h1>Hello World</h1></div><div class="content"><p>This is a paragraph.</p><p>This is another paragraph.</p></div><div class="footer"><p>Copyright 2023</p></div></div>',
  asciiArt: `
    /\\_/\\
   ( o.o )
    > ^ <
   /     \\
  /       \\
 /         \\
/           \\
/\\_/\\       /\\_/\\
( o.o )     ( o.o )
 > ^ <       > ^ <
  `,
}

export default function TextCompressionPage() {
  const [algorithm, setAlgorithm] = useState("huffman")
  const [inputText, setInputText] = useState("AABCABAACAABCABCABAAACAABBCA")
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(0.5)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [animationStep, setAnimationStep] = useState(0)
  const [hasCompressed, setHasCompressed] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [inputMethod, setInputMethod] = useState<"text" | "file" | "sample">("text")
  const [selectedSample, setSelectedSample] = useState("simple")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalSteps = 4
  useEffect(() => {
    const handleUpdateInputText = (e: CustomEvent) => {
      setInputText(e.detail)
    }

    window.addEventListener("updateInputText", handleUpdateInputText as EventListener)

    return () => {
      window.removeEventListener("updateInputText", handleUpdateInputText as EventListener)
    }
  }, [])

  useEffect(() => {
    if (inputMethod === "sample" && selectedSample) {
      setInputText(sampleInputs[selectedSample as keyof typeof sampleInputs])
    }
  }, [inputMethod, selectedSample])

  const handleCompress = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to compress")
      return
    }

    setAnimationStep(0)
    setAnimationProgress(0)
    setIsCollapsed(true)

    try {
      setHasCompressed(true)

      setTimeout(() => {
        setAnimationStep(1)
        setAnimationProgress((1 / totalSteps) * 100)
        setIsAnimating(true)
      }, 500)
    } catch (error) {
      console.error("Compression error:", error)
      toast.error("Failed to compress text")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setInputText(text)
      toast.success(`File "${file.name}" loaded successfully`)
    } catch (error) {
      console.error("Error reading file:", error)
      toast.error("Failed to read file")
    }
  }

  const handleStepChange = (step: number) => {
    setAnimationStep(step)
    setAnimationProgress((step / totalSteps) * 100)
  }

  const handleAnimatingChange = (animating: boolean) => {
    setIsAnimating(animating)
  }

  const handleReset = () => {
    setHasCompressed(false)
    setAnimationStep(0)
    setAnimationProgress(0)
    setIsAnimating(false)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container py-6">
        <h1 className="text-3xl font-bold mb-6">Data Compression Algorithm Visualizer</h1>
        <div className={`grid ${isCollapsed ? "grid-cols-1" : "lg:grid-cols-3"} gap-6`}>
          {isCollapsed ? (
            <div className="flex items-start justify-start">
              <Button onClick={() => setIsCollapsed(false)} variant="ghost" size="icon" className="mt-2">
                <ChevronRight />
              </Button>
            </div>
          ) : (
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <p>Input Data</p>
                  <div className="flex items-start justify-start">
                    <Button onClick={() => setIsCollapsed(true)} variant="ghost" size="icon" className="mt-2">
                      <ChevronLeft />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>Enter text to compress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="algorithm">Compression Algorithm</Label>
                    <Tabs value={algorithm} onValueChange={setAlgorithm} className="w-full mt-2">
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="huffman">Huffman</TabsTrigger>
                        <TabsTrigger value="lzw">LZW</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div>
                    <Label htmlFor="input-method">Input Method</Label>
                    <Tabs
                      value={inputMethod}
                      onValueChange={(v) => setInputMethod(v as "text" | "file" | "sample")}
                      className="w-full mt-2"
                    >
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="text">
                          <FileText className="h-4 w-4 mr-2" /> Text Input
                        </TabsTrigger>
                        <TabsTrigger value="file">
                          <Upload className="h-4 w-4 mr-2" /> File Upload
                        </TabsTrigger>
                        <TabsTrigger value="sample">
                          <Sparkles className="h-4 w-4 mr-2" /> Sample Data
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="mt-4 p-0">
                        <Textarea
                          id="input-text"
                          placeholder="Enter text here..."
                          className="h-32"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                        />
                      </TabsContent>

                      <TabsContent value="file" className="mt-4 p-0">
                        <div className="border-2 border-dashed rounded-md p-6 text-center">
                          <Input
                            type="file"
                            ref={fileInputRef}
                            accept=".txt,.md,.json,.csv"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Upload text file</p>
                              <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                              Select File
                            </Button>
                          </div>
                          {inputText && inputMethod === "file" && (
                            <div className="mt-4 text-left">
                              <p className="text-sm font-medium">File content:</p>
                              <p className="text-xs text-muted-foreground truncate max-w-full">
                                {inputText.length > 100 ? `${inputText.substring(0, 100)}...` : inputText}
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="sample" className="mt-4 p-0">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="sample-select">Select Sample Data</Label>
                            <Select value={selectedSample} onValueChange={setSelectedSample}>
                              <SelectTrigger className="w-full mt-2">
                                <SelectValue placeholder="Select a sample" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="simple">Simple Repeating Characters</SelectItem>
                                <SelectItem value="repeatingPatterns">Repeating Patterns (LZW Optimal)</SelectItem>
                                <SelectItem value="englishText">English Text with Repetition</SelectItem>
                                <SelectItem value="htmlMarkup">HTML Markup (LZW Efficient)</SelectItem>
                                <SelectItem value="asciiArt">ASCII Art with Patterns</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="border rounded-md p-3 bg-muted/30">
                            <p className="text-sm font-medium mb-2">Preview:</p>
                            <div className="max-h-32 overflow-y-auto">
                              <pre className="text-xs whitespace-pre-wrap break-all">
                                {inputText.length > 300 ? `${inputText.substring(0, 300)}...` : inputText}
                              </pre>
                            </div>
                          </div>
                          {algorithm === "lzw" && selectedSample === "repeatingPatterns" && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                              <p className="text-sm text-green-800 dark:text-green-300">
                                This sample contains many repeating patterns, making it ideal for LZW compression which
                                builds a dictionary of patterns as it processes the data.
                              </p>
                            </div>
                          )}
                          {algorithm === "lzw" && selectedSample === "htmlMarkup" && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                              <p className="text-sm text-green-800 dark:text-green-300">
                                HTML markup contains many repeating tags and attributes, which LZW can efficiently
                                compress by adding them to its dictionary.
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div>
                    <Label htmlFor="animation-speed">Animation Speed</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm">Slow</span>
                      <Input
                        id="animation-speed"
                        type="range"
                        min="1"
                        max="3"
                        step="0.5"
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(Number.parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm">Fast</span>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 cursor-pointer" onClick={handleCompress} disabled={isAnimating}>
                        {isAnimating ? "Animating..." : "Compress"}
                      </Button>

                      {hasCompressed && (
                        <Button variant="outline" className="cursor-pointer" onClick={handleReset}>
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Compression Visualization</CardTitle>
              <CardDescription>
                {algorithm === "huffman"
                  ? "Huffman coding creates an optimal tree based on frequency"
                  : algorithm === "lzw"
                    ? "LZW builds a dictionary of patterns"
                    : "Run-Length Encoding collapses repeated characters"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="p-4">
                <Progress value={animationProgress} className="h-2 mb-2" />

                <div className="min-h-[400px] rounded-md overflow-hidden">
                  <Tabs value={algorithm} className="w-full">
                    <TabsContent value="huffman" className="mt-0">
                      <HuffmanVisualizer
                        inputText={inputText}
                        animationStep={animationStep}
                        isAnimating={isAnimating}
                        onStepChange={handleStepChange}
                        onAnimatingChange={handleAnimatingChange}
                        hasCompressed={hasCompressed}
                        animationSpeed={animationSpeed}
                      />
                    </TabsContent>
                    <TabsContent value="lzw" className="mt-0">
                      <LZWVisualizer
                        inputText={inputText}
                        animationStep={animationStep}
                        isAnimating={isAnimating}
                        onStepChange={handleStepChange}
                        onAnimatingChange={handleAnimatingChange}
                        hasCompressed={hasCompressed}
                        animationSpeed={animationSpeed}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
