import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Plus, X, Upload, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertFrameworkSchema, insertFrameworkVersionSchema } from "@shared/schema";
import type { FrameworkCategory } from "@shared/schema";
import Header from "@/components/Header";

// Form schema that extends the base framework schema
const createFrameworkSchema = insertFrameworkSchema.extend({
  // Override base schema to ensure proper validation
  name: z.string().min(1, "Framework name is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  // Initial version data
  initialVersion: z.object({
    version: z.string().min(1, "Version is required"),
    title: z.string().min(1, "Version title is required"),
    contentJson: z.any().default({}),
    changelogMarkdown: z.string().optional()
  })
});

type CreateFrameworkForm = z.infer<typeof createFrameworkSchema>;

export default function CreateFramework() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [aiProvider, setAiProvider] = useState<'openai' | 'claude'>('claude');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch framework categories
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/framework-categories'],
    select: (response: any) => response.categories as FrameworkCategory[]
  });

  const form = useForm<CreateFrameworkForm>({
    resolver: zodResolver(createFrameworkSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      tags: [],
      isPublic: false,
      isStarred: false,
      initialVersion: {
        version: "1.0.0",
        title: "Initial Version",
        contentJson: {
          sections: [],
          metadata: {}
        },
        changelogMarkdown: "Initial framework creation"
      }
    }
  });

  const createFrameworkMutation = useMutation({
    mutationFn: async (data: CreateFrameworkForm) => {
      // Create the framework first
      const frameworkData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        tags: data.tags,
        isPublic: data.isPublic,
        isStarred: data.isStarred
      };

      const frameworkResponse = await fetch('/api/frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(frameworkData)
      });

      if (!frameworkResponse.ok) {
        throw new Error('Failed to create framework');
      }

      const { framework } = await frameworkResponse.json();

      // Create the initial version
      const versionResponse = await fetch(`/api/frameworks/${framework.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.initialVersion)
      });

      if (!versionResponse.ok) {
        throw new Error('Failed to create framework version');
      }

      return { framework };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/frameworks'] });
      toast({
        title: "Framework Created",
        description: `${data.framework.name} has been created successfully`
      });
      setLocation('/frameworks');
    },
    onError: (error) => {
      console.error('Framework creation failed:', error);
      toast({
        title: "Creation Failed",
        description: "There was an error creating the framework",
        variant: "destructive"
      });
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, categoryId, provider }: { file: File; categoryId: string; provider: 'openai' | 'claude' }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('categoryId', categoryId);
      formData.append('aiProvider', provider);

      const response = await fetch('/api/frameworks/upload-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/frameworks'] });
      toast({
        title: "Framework Created from Document",
        description: `${data.framework.name} has been created successfully using AI`,
      });
      setLocation(`/frameworks/${data.framework.id}`);
    },
    onError: (error) => {
      console.error('Document upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreateFrameworkForm) => {
    console.log('Form submission attempted with data:', data);
    console.log('Form validation state:', form.formState.errors);
    
    // Additional client-side validation check
    if (!data.name || !data.description || !data.categoryId) {
      console.error('Validation failed: Required fields missing', {
        name: !data.name,
        description: !data.description,
        categoryId: !data.categoryId
      });
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Description, Category)",
        variant: "destructive"
      });
      return;
    }
    
    createFrameworkMutation.mutate(data);
  };

  const addTag = () => {
    if (newTag.trim() && !(form.getValues('tags') || []).includes(newTag.trim())) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or Word document (.pdf, .doc, .docx)",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleDocumentUpload = () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF or Word document to upload",
        variant: "destructive"
      });
      return;
    }

    const categoryId = form.getValues('categoryId');
    if (!categoryId) {
      toast({
        title: "Category Required",
        description: "Please select a category before uploading a document",
        variant: "destructive"
      });
      return;
    }

    uploadDocumentMutation.mutate({ 
      file: uploadedFile, 
      categoryId,
      provider: aiProvider
    });
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/frameworks')}
          data-testid="button-back-to-frameworks"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-create-framework">
            Create Framework
          </h1>
          <p className="text-muted-foreground">
            Build a new content template for Liverpool FC analysis
          </p>
        </div>
      </div>

      {/* AI Document Upload Section */}
      <Card className="mb-8 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>AI-Powered Framework Creation</CardTitle>
          </div>
          <CardDescription>
            Upload a PDF or Word document and let AI automatically create a framework from it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category (Required)</label>
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger data-testid="select-upload-category">
                      <SelectValue placeholder="Select category first" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as 'openai' | 'claude')}>
                <SelectTrigger data-testid="select-ai-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                  <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Document Upload</label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="flex-1"
                data-testid="input-document-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-browse-files"
              >
                <FileText className="w-4 h-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm" data-testid="text-uploaded-filename">
                {uploadedFile.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                data-testid="button-clear-file"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <Button
            type="button"
            onClick={handleDocumentUpload}
            disabled={!uploadedFile || uploadDocumentMutation.isPending || !form.getValues('categoryId')}
            className="w-full"
            data-testid="button-upload-document"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadDocumentMutation.isPending ? 'Processing...' : 'Create Framework from Document'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, Word (.doc, .docx). The AI will analyze your document and automatically create a structured framework.
          </p>
        </CardContent>
      </Card>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or create manually</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Framework Details</CardTitle>
                  <CardDescription>
                    Basic information about your framework
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Framework Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Post-Match Analysis Template"
                            {...field}
                            data-testid="input-framework-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this framework is for and how it should be used..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-framework-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-framework-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesData?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>
                    Add tags to help users discover your framework
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      data-testid="input-add-tag"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addTag}
                      data-testid="button-add-tag"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {(form.watch('tags') || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(form.watch('tags') || []).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="flex items-center gap-1"
                          data-testid={`tag-${tag}`}
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 w-4 h-4"
                            onClick={() => removeTag(tag)}
                            data-testid={`button-remove-tag-${tag}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Initial Version</CardTitle>
                  <CardDescription>
                    Set up the first version of your framework
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="initialVersion.version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="1.0.0"
                            {...field}
                            data-testid="input-version-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="initialVersion.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Initial Version"
                            {...field}
                            data-testid="input-version-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="initialVersion.changelogMarkdown"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Changelog</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what's included in this version..."
                            {...field}
                            data-testid="textarea-version-changelog"
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Describe the changes or features in this version
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createFrameworkMutation.isPending}
                    data-testid="button-create-framework-submit"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createFrameworkMutation.isPending ? 'Creating...' : 'Create Framework'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation('/frameworks')}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Framework Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Frameworks help standardize content creation</p>
                  <p>• Use clear, descriptive names and tags</p>
                  <p>• Choose the most appropriate category</p>
                  <p>• You can add more versions later</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
      </div>
    </div>
  );
}