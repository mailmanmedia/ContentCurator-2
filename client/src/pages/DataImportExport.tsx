import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { 
  Database, 
  Upload, 
  Download, 
  FileText, 
  RefreshCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  File
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DataImport {
  id: number;
  filename: string;
  file_type: string;
  operation: 'import' | 'export';
  target_table?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  records_count?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

const SUPPORTED_FORMATS = ['JSON', 'CSV', 'XLSX', 'PDF', 'DOCX', 'HTML', 'JPEG', 'PNG', '.web'];
const EXPORT_TABLES = ['football_players', 'rss_articles', 'library_items', 'scenes', 'data_imports'];
const EXPORT_FORMATS = ['JSON', 'CSV', 'XLSX'];

export default function DataImportExport() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [exportTable, setExportTable] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<string>("");

  // Fetch import history
  const { data: imports, isLoading, refetch } = useQuery<DataImport[]>({
    queryKey: ['/api/admin/imports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/imports');
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.imports || [];
    },
  });

  // Upload mutation with file validation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // File validation before upload (SECURITY FIX)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const VALID_MIME_TYPES = [
        'application/json',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/html',
        'image/jpeg',
        'image/png'
      ];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Validate file type
      if (!VALID_MIME_TYPES.includes(file.type) && !file.name.endsWith('.web')) {
        throw new Error('Invalid file type. Only JSON, CSV, Excel, PDF, Word, HTML, JPEG, and PNG files are allowed.');
      }

      // Additional filename validation (prevent path traversal)
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (file.name !== safeFilename) {
        console.warn(`Filename sanitized from "${file.name}" to "${safeFilename}"`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Parsed ${data.recordsParsed || 0} records from ${data.format || 'file'}`,
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/imports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async ({ table, format }: { table: string; format: string }) => {
      const response = await fetch(`/api/admin/export/${format.toLowerCase()}?table=${table}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}_export.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { table, format };
    },
    onSuccess: ({ table, format }) => {
      toast({
        title: "Export Successful",
        description: `Downloaded ${table} as ${format}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/imports'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleExport = () => {
    if (exportTable && exportFormat) {
      exportMutation.mutate({ table: exportTable, format: exportFormat });
    }
  };

  const getStatusBadge = (status: DataImport['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, color: 'text-gray-600 dark:text-gray-400' },
      processing: { variant: 'default' as const, color: 'text-blue-600 dark:text-blue-400' },
      completed: { variant: 'default' as const, color: 'text-green-600 dark:text-green-400' },
      failed: { variant: 'destructive' as const, color: 'text-red-600 dark:text-red-400' },
    };
    return variants[status] || variants.pending;
  };

  const getStatusIcon = (status: DataImport['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('json')) return <FileJson className="w-5 h-5 text-blue-500" />;
    if (type.includes('spreadsheet') || type.includes('csv') || type.includes('xlsx')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    }
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">Data Import/Export Manager</h1>
            <p className="text-muted-foreground">Manage file uploads, data exports, and import history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Import Files Section */}
          <Card data-testid="card-import">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Files
              </CardTitle>
              <CardDescription>Upload and parse data files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
                  hover-elevate cursor-pointer
                `}
                data-testid="dropzone-upload"
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {isDragOver ? 'Drop file here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-sm text-muted-foreground">Supported formats</p>
                </label>
              </div>

              {/* Supported Formats */}
              <div className="flex flex-wrap gap-2" data-testid="supported-formats">
                {SUPPORTED_FORMATS.map((format) => (
                  <Badge key={format} variant="outline" data-testid={`format-${format.toLowerCase()}`}>
                    {format}
                  </Badge>
                ))}
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div className="p-4 rounded-lg border bg-card" data-testid="file-preview">
                  <div className="flex items-start gap-3">
                    {getFileIcon(selectedFile.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" data-testid="file-name">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground" data-testid="file-size">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid="file-type">
                        {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
                data-testid="button-upload"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Parse
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export Data Section */}
          <Card data-testid="card-export">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Data
              </CardTitle>
              <CardDescription>Download data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Table Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Table</label>
                <Select value={exportTable} onValueChange={setExportTable}>
                  <SelectTrigger data-testid="select-table">
                    <SelectValue placeholder="Select table to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_TABLES.map((table) => (
                      <SelectItem key={table} value={table} data-testid={`table-option-${table}`}>
                        {table.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Format Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger data-testid="select-format">
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map((format) => (
                      <SelectItem key={format} value={format} data-testid={`format-option-${format.toLowerCase()}`}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Info */}
              {exportTable && exportFormat && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm" data-testid="export-info">
                  <p>
                    Will export <strong>{exportTable.replace(/_/g, ' ')}</strong> as <strong>{exportFormat}</strong>
                  </p>
                </div>
              )}

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={!exportTable || !exportFormat || exportMutation.isPending}
                className="w-full"
                data-testid="button-export"
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Import History Table */}
        <Card data-testid="card-history">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Import/Export History
                </CardTitle>
                <CardDescription>Track all data operations</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : imports && imports.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="header-id">ID</TableHead>
                      <TableHead data-testid="header-filename">Filename</TableHead>
                      <TableHead data-testid="header-type">Type</TableHead>
                      <TableHead data-testid="header-operation">Operation</TableHead>
                      <TableHead data-testid="header-table">Target Table</TableHead>
                      <TableHead data-testid="header-status">Status</TableHead>
                      <TableHead data-testid="header-records">Records</TableHead>
                      <TableHead data-testid="header-date">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...imports]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((item) => {
                        const statusConfig = getStatusBadge(item.status);
                        return (
                          <TableRow key={item.id} data-testid={`row-${item.id}`}>
                            <TableCell data-testid={`cell-id-${item.id}`}>{item.id}</TableCell>
                            <TableCell 
                              className="max-w-[200px] truncate" 
                              data-testid={`cell-filename-${item.id}`}
                            >
                              {item.filename}
                            </TableCell>
                            <TableCell data-testid={`cell-type-${item.id}`}>
                              {item.file_type}
                            </TableCell>
                            <TableCell data-testid={`cell-operation-${item.id}`}>
                              <Badge variant="outline">
                                {item.operation}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`cell-table-${item.id}`}>
                              {item.target_table || '-'}
                            </TableCell>
                            <TableCell data-testid={`cell-status-${item.id}`}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(item.status)}
                                <Badge 
                                  variant={statusConfig.variant}
                                  className={statusConfig.color}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`cell-records-${item.id}`}>
                              {item.records_count || 0}
                            </TableCell>
                            <TableCell data-testid={`cell-date-${item.id}`}>
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8" data-testid="empty-state">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No import/export history yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
