"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useEffect, useMemo, useState } from "react"

interface HuffmanCodeTableProps {
  frequencies: Map<string, number>
  codes: Map<string, string>
  highlightedChar: string | null
  animationStep: number
}

export function HuffmanCodeTable({ frequencies, codes, highlightedChar, animationStep }: HuffmanCodeTableProps) {
  const sortedEntries = useMemo(() => Array.from(frequencies.entries()), [frequencies])

  const [revealedChars, setRevealedChars] = useState<string[]>([])

  const currentHighlightIndex = sortedEntries.findIndex(([char]) => char === highlightedChar)

  useEffect(()=>{
    if(revealedChars.length !== currentHighlightIndex-1){
      setRevealedChars((prev) => {
        const newRevealedChars = [...prev];
        for (let i = 0; i < currentHighlightIndex; i++) {
          if (!newRevealedChars.includes(sortedEntries[i][0])) {
            newRevealedChars.push(sortedEntries[i][0]);
          }
        }
        return newRevealedChars;
      })
    }
  },[sortedEntries])

  useEffect(() => {
    if (highlightedChar && !revealedChars.includes(highlightedChar)) {
      setRevealedChars((prev) => [...prev, highlightedChar])
    }
  }, [highlightedChar])

  if (frequencies.size === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  const showCodes = animationStep >= 2

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Character</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Bits</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedEntries.map(([char, freq], index) => {
          const code = codes.get(char) || ""
          const isHighlighted = char === highlightedChar
          const isVisible = showCodes && revealedChars.includes(char) 

          return (
            <TableRow key={char} className={isHighlighted ? "bg-primary/10" : ""}>
              <TableCell>
                <Badge
                  variant={isHighlighted ? "default" : "outline"}
                  className={`font-mono ${isHighlighted ? "animate-pulse" : ""}`}
                >
                  {char === " " ? "Space" : char}
                </Badge>
              </TableCell>
              <TableCell>{freq}</TableCell>
              <TableCell>
                {isVisible ? (
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{code || "N/A"}</code>
                ) : (
                  <div className="w-8 h-4 bg-muted/30 rounded animate-pulse"></div>
                )}
              </TableCell>
              <TableCell>
                {isVisible ? (
                  <Badge variant="secondary" className="font-mono">
                    {code.length || 0}
                  </Badge>
                ) : (
                  <div className="w-6 h-6 bg-muted/30 rounded-full animate-pulse"></div>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
