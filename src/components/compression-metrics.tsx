import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CompressionMetricsProps {
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export function CompressionMetrics({ originalSize, compressedSize, compressionRatio }: CompressionMetricsProps) {
  if (originalSize === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Compress data to see metrics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Original Size</span>
              <span className="text-sm">{originalSize} bits</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Compressed Size</span>
              <span className="text-sm">{compressedSize} bits</span>
            </div>
            <Progress value={(compressedSize / originalSize) * 100} className="h-2 bg-muted" />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Compression Ratio</span>
              <span className="text-lg font-bold text-primary">{compressionRatio.toFixed(2)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {compressionRatio > 50
                ? "Excellent compression!"
                : compressionRatio > 30
                  ? "Good compression"
                  : "Moderate compression"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
