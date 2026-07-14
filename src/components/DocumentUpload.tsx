import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Trash2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  type: 'business' | 'profile';
  title: string;
  description: string;
  documentTypes: { value: string; label: string }[];
  maxFiles?: number;
}

interface UploadedDocument {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
}

export function DocumentUpload({ type, title, description, documentTypes, maxFiles = 5 }: DocumentUploadProps) {
  const { user } = useAuth();
  const { business } = useUserProfile();
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    if (!user) return;
    try {
      const tableName = type === 'business' ? 'business_documents' : 'profile_documents';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedType || !user) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucketName = type === 'business' ? 'business-documents' : 'profile-documents';

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const tableName = type === 'business' ? 'business_documents' : 'profile_documents';
      const documentData = {
        user_id: user.id,
        ...(type === 'business' && business ? { business_id: business.id } : {}),
        file_name: file.name,
        file_path: fileName,
        document_type: selectedType,
        file_size: file.size,
      };

      const { error: dbError } = await supabase.from(tableName).insert([documentData]);
      if (dbError) throw dbError;

      toast.success('Document uploaded successfully!');
      setSelectedType('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    try {
      const bucketName = type === 'business' ? 'business-documents' : 'profile-documents';
      
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      if (storageError) throw storageError;

      const tableName = type === 'business' ? 'business_documents' : 'profile_documents';
      const { error: dbError } = await supabase.from(tableName).delete().eq('id', docId);
      if (dbError) throw dbError;

      toast.success('Document deleted successfully.');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getCreditScoreImpact = () => {
    const docCount = documents.length;
    if (docCount === 0) return { impact: 'None', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (docCount < 3) return { impact: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { impact: 'High', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const creditImpact = getCreditScoreImpact();

  return (
    <Card className="professional-card overflow-hidden">
      <CardHeader className="bg-muted/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          {/* <Badge className={cn("text-xs font-semibold py-1 px-3 rounded-full flex items-center gap-1.5 shrink-0", creditImpact.color)}>
            <creditImpact.icon className="h-3.5 w-3.5" />
            Credit Impact: {creditImpact.impact}
          </Badge> */}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Upload Section */}
        <div className="p-4 border rounded-lg bg-background shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${type}-document-type`} className="font-medium">Document Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((docType) => (
                    <SelectItem key={docType.value} value={docType.value}>
                      {docType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`${type}-file`} className="font-medium">Upload File</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  ref={fileInputRef}
                  id={`${type}-file`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading || !selectedType || documents.length >= maxFiles}
                  className="flex-1"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !selectedType || documents.length >= maxFiles}
                  variant="outline"
                  className="w-full sm:w-auto shrink-0"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Browse'}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Accepted formats: PDF, JPG, PNG, DOC, DOCX. Max size: 5MB.
          </p>
        </div>

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-md">Uploaded Documents ({documents.length}/{maxFiles})</h4>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-sm break-all">{doc.file_name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary" className="font-normal">
                          {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </Badge>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full mt-2 sm:mt-0 ml-auto sm:ml-2 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Score Tips */}
        {/* <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
          <h5 className="font-semibold text-md flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Credit Score Tips
          </h5>
          <ul className="text-sm text-blue-700/90 mt-2 list-disc list-inside space-y-1">
            <li>Upload official business registration documents.</li>
            <li>Include tax documentation for better verification.</li>
            <li>Ensure uploaded images are clear and readable.</li>
            <li>More verified documents can lead to a higher credibility score.</li>
          </ul>
        </div> */}
      </CardContent>
    </Card>
  );
}
