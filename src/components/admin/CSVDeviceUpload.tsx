'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Upload, Download, FileSpreadsheet, CheckCircle2, 
  AlertCircle, X, Loader2, FileWarning 
} from 'lucide-react'
import { toast } from 'sonner'

interface UploadResult {
  success: boolean
  totalRows: number
  insertedCount: number
  errorCount: number
  errors: Array<{ row: number; errors: string[] }>
  insertedDevices: Array<{ name: string; organization: string; location: string }>
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'done'

export function CSVDeviceUpload() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reset = () => {
    setState('idle')
    setSelectedFile(null)
    setPreviewRows([])
    setPreviewHeaders([])
    setResult(null)
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) reset()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please select a .csv file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File too large (max 5MB)')
      return
    }

    setErrorMessage(null)
    setSelectedFile(file)

    // Parse preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      
      if (lines.length < 2) {
        setErrorMessage('CSV must have a header row and at least one data row')
        return
      }

      // Simple preview parse (just split by comma for display)
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setPreviewHeaders(headers)

      const rows = lines.slice(1, 6).map(line => 
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      )
      setPreviewRows(rows)
      setState('selected')
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setState('uploading')
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/hardware/csv-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Upload failed')
        setState('selected')
        return
      }

      setResult(data as UploadResult)
      setState('done')

      if (data.insertedCount > 0) {
        toast.success(`${data.insertedCount} device${data.insertedCount !== 1 ? 's' : ''} imported successfully`)
        router.refresh()
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.')
      setState('selected')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/hardware/csv-template')
      if (!response.ok) throw new Error('Failed to download template')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'device-upload-template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="h-10">
          <Upload className="h-4 w-4 mr-2" />
          CSV Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Devices
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple devices at once. Organization and location names are matched automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Template download */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/30">
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-muted-foreground">Pre-filled with your org/location names</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            .csv
          </Button>
        </div>

        {/* IDLE: File picker */}
        {state === 'idle' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select a CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">Maximum 500 rows, 5MB file size</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Required columns:</p>
              <p><code className="bg-muted px-1 rounded">organization_name</code>, <code className="bg-muted px-1 rounded">location_name</code>, <code className="bg-muted px-1 rounded">name</code>, <code className="bg-muted px-1 rounded">hardware_type</code></p>
              <p className="font-medium mt-2">Optional columns:</p>
              <p><code className="bg-muted px-1 rounded">manufacturer</code>, <code className="bg-muted px-1 rounded">model_number</code>, <code className="bg-muted px-1 rounded">serial_number</code>, <code className="bg-muted px-1 rounded">status</code>, <code className="bg-muted px-1 rounded">installation_date</code>, <code className="bg-muted px-1 rounded">warranty_expiration</code>, <code className="bg-muted px-1 rounded">internal_notes</code></p>
            </div>
          </div>
        )}

        {/* SELECTED: Preview */}
        {state === 'selected' && selectedFile && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Badge variant="outline" className="text-xs">
                  {previewRows.length}+ rows
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Preview table */}
            <div className="border rounded-lg overflow-auto max-h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewHeaders.map((h, i) => (
                      <TableHead key={i} className="text-xs whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, ri) => (
                    <TableRow key={ri}>
                      {row.map((cell, ci) => (
                        <TableCell key={ci} className="text-xs py-2 whitespace-nowrap max-w-[150px] truncate">
                          {cell || <span className="text-muted-foreground italic">empty</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">Showing first {previewRows.length} rows. Full validation happens on upload.</p>
          </div>
        )}

        {/* UPLOADING: Progress */}
        {state === 'uploading' && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading and validating...</p>
            <p className="text-xs text-muted-foreground">Resolving organizations and locations</p>
          </div>
        )}

        {/* DONE: Results */}
        {state === 'done' && result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className={`p-4 rounded-lg border ${result.errorCount === 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.errorCount === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <FileWarning className="h-5 w-5 text-orange-600" />
                )}
                <p className="font-semibold text-sm">
                  {result.errorCount === 0
                    ? `All ${result.insertedCount} devices imported successfully`
                    : `${result.insertedCount} of ${result.totalRows} devices imported`}
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-700">{result.insertedCount} imported</span>
                {result.errorCount > 0 && (
                  <span className="text-red-600">{result.errorCount} failed</span>
                )}
              </div>
            </div>

            {/* Imported devices */}
            {result.insertedDevices.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Imported devices:</p>
                <div className="border rounded-lg overflow-auto max-h-[150px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Device Name</TableHead>
                        <TableHead className="text-xs">Organization</TableHead>
                        <TableHead className="text-xs">Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.insertedDevices.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs py-2 font-medium">{d.name}</TableCell>
                          <TableCell className="text-xs py-2">{d.organization}</TableCell>
                          <TableCell className="text-xs py-2">{d.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Errors ({result.errorCount} rows):</p>
                <div className="border border-red-200 rounded-lg overflow-auto max-h-[200px]">
                  <div className="divide-y divide-red-100">
                    {result.errors.map((err, i) => (
                      <div key={i} className="p-3 text-xs">
                        <span className="font-mono font-semibold text-red-700">Row {err.row}:</span>
                        <ul className="list-disc pl-5 mt-1 space-y-0.5 text-red-600">
                          {err.errors.map((e, ei) => (
                            <li key={ei}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          {state === 'selected' && (
            <>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button onClick={handleUpload} className="bg-accent hover:bg-accent-dark">
                <Upload className="h-4 w-4 mr-2" />
                Upload & Import
              </Button>
            </>
          )}
          {state === 'done' && (
            <Button onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
