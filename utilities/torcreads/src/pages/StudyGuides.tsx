import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Download, Trash2, FileText, Upload, X } from "lucide-react";
import { getStudyGuides, saveStudyGuide, deleteStudyGuide, uploadStudyGuideFile, type StudyGuide } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const StudyGuides = () => {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    bookTitle: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    setLoading(true);
    try {
      const data = await getStudyGuides();
      setGuides(data);
    } catch (error) {
      console.error('Error loading guides:', error);
      toast({
        title: "Error loading guides",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter only .docx files
    const docxFiles = files.filter(file => 
      file.name.endsWith('.docx') || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (docxFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only .docx files are allowed",
        variant: "destructive"
      });
    }

    setSelectedFiles(prev => [...prev, ...docxFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one .docx file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload each file
      for (const file of selectedFiles) {
        const fileUrl = await uploadStudyGuideFile(file);

        const newGuide: StudyGuide = {
          title: formData.title || file.name.replace('.docx', ''),
          bookTitle: formData.bookTitle,
          fileUrl: fileUrl,
          fileName: file.name,
          fileSize: file.size,
        };

        await saveStudyGuide(newGuide);
      }

      await loadGuides();
      setOpen(false);
      setFormData({ title: "", bookTitle: "" });
      setSelectedFiles([]);
      
      toast({ 
        title: `${selectedFiles.length} study guide(s) added successfully!` 
      });
    } catch (error) {
      console.error('Error saving guides:', error);
      toast({
        title: "Error uploading files",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this study guide?')) {
      return;
    }

    try {
      await deleteStudyGuide(id);
      await loadGuides();
      toast({ title: "Study guide removed" });
    } catch (error) {
      console.error('Error deleting guide:', error);
      toast({
        title: "Error deleting guide",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (guide: StudyGuide) => {
    if (guide.fileUrl) {
      window.open(guide.fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading study guides...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light mb-2">Study Guides</h1>
            <p className="text-muted-foreground">Access reading guides and discussion materials</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Study Guide</DialogTitle>
                <DialogDescription>Upload .docx files for study guides</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Guide Title (optional)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Leave empty to use file name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bookTitle">Book Title</Label>
                    <Input
                      id="bookTitle"
                      value={formData.bookTitle}
                      onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="files">Upload Files (.docx)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="files"
                        type="file"
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        multiple
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Selected Files ({selectedFiles.length})</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      'Save Guides'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Card key={guide.id}>
              <CardHeader>
                <CardTitle className="font-normal">{guide.title}</CardTitle>
                <CardDescription>{guide.bookTitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="truncate">{guide.fileName}</span>
                </div>
                {guide.fileSize && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(guide.fileSize)}
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(guide)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(guide.id!)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {guides.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted mb-4" />
            <p className="text-muted-foreground">No study guides yet. Add your first guide!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyGuides;