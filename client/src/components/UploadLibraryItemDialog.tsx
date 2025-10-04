import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, Image, Code, Link, FileText, X } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  category: z.string().default("General"),
  tags: z.array(z.string()).default([]),
  contentUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  metaJson: z.record(z.any()).default({}),
});

interface UploadLibraryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadLibraryItemDialog({
  open,
  onOpenChange,
}: UploadLibraryItemDialogProps) {
  const [uploadType, setUploadType] = useState<"image" | "html" | "code" | "link">("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoryType, setCategoryType] = useState<"preset" | "custom">("preset");
  const [customCategory, setCustomCategory] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "template",
      category: "General",
      tags: [],
      contentUrl: "",
      thumbnailUrl: "",
      metaJson: {},
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // If image file, use multipart upload then create library item
      if (uploadType === "image" && selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("title", data.name);
        formData.append("description", data.description || "");
        formData.append("category", data.category);
        
        const imageResponse = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!imageResponse.ok) {
          throw new Error(`Upload failed: ${imageResponse.status}`);
        }
        
        const imageData = await imageResponse.json();
        
        // Create library item for the uploaded image
        const libraryItemData = {
          type: "image",
          name: data.name,
          description: data.description || "",
          category: data.category,
          tags: data.tags,
          thumbnailUrl: imageData.image?.thumbnail || "",
          contentUrl: imageData.image?.url || "",
          fileSize: imageData.image?.size || "",
          mimeType: imageData.image?.mimeType || "",
          metaJson: {
            imageId: imageData.image?.id
          },
          isActive: true,
          isStarred: false,
        };
        
        const libraryResponse = await apiRequest("POST", "/api/library-items", libraryItemData);
        return libraryResponse.json();
      } else {
        // For HTML/code/links, store content appropriately
        const libraryItemData: any = {
          type: data.type,
          name: data.name,
          description: data.description || "",
          category: data.category,
          tags: data.tags,
          metaJson: {
            uploadType,
            content: uploadType !== "link" ? data.contentUrl : undefined,
          },
          isActive: true,
          isStarred: false,
        };
        
        // Only include contentUrl/thumbnailUrl for links or if they have values
        if (uploadType === "link" && data.contentUrl) {
          libraryItemData.contentUrl = data.contentUrl;
        }
        if (data.thumbnailUrl) {
          libraryItemData.thumbnailUrl = data.thumbnailUrl;
        }
        
        const response = await apiRequest("POST", "/api/library-items", libraryItemData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Upload Successful",
        description: "Your content has been added to the library",
      });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("name", file.name.split(".")[0].replace(/[-_]/g, " "));
      form.setValue("type", "image");
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag) {
      const currentTags = form.getValues("tags");
      // Deduplicate tags (case-insensitive)
      if (!currentTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
        form.setValue("tags", [...currentTags, trimmedTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter((_, i) => i !== index));
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setUploadProgress(50);
    uploadMutation.mutate(data);
  };

  const handleTypeChange = (type: "image" | "html" | "code" | "link") => {
    setUploadType(type);
    setSelectedFile(null);
    
    // Set appropriate type for library items
    if (type === "image") {
      form.setValue("type", "image");
    } else if (type === "html") {
      form.setValue("type", "template");
    } else if (type === "code") {
      form.setValue("type", "template");
    } else if (type === "link") {
      form.setValue("type", "template");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Content to Library</DialogTitle>
          <DialogDescription>
            Add images, HTML artifacts, code snippets, or links to your content library
          </DialogDescription>
        </DialogHeader>

        <Tabs value={uploadType} onValueChange={(v) => handleTypeChange(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="image" className="flex items-center gap-2" data-testid="tab-upload-image">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2" data-testid="tab-upload-html">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">HTML</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2" data-testid="tab-upload-code">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Code</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2" data-testid="tab-upload-link">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">Link</span>
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <TabsContent value="image" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                    data-testid="input-image-file"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <Image className="w-12 h-12 mx-auto text-primary" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="font-medium">Click to upload image</p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="html" className="space-y-4">
                <FormField
                  control={form.control}
                  name="contentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HTML Content or Artifact URL</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste HTML code or Claude artifact URL..."
                          className="min-h-[200px] font-mono text-sm"
                          {...field}
                          data-testid="textarea-html-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="code" className="space-y-4">
                <FormField
                  control={form.control}
                  name="contentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code Snippet</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste your code here..."
                          className="min-h-[200px] font-mono text-sm"
                          {...field}
                          data-testid="textarea-code-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="link" className="space-y-4">
                <FormField
                  control={form.control}
                  name="contentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          {...field}
                          data-testid="input-link-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://... (preview image)"
                          {...field}
                          data-testid="input-thumbnail-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Common fields for all types */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Content" {...field} data-testid="input-item-name" />
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
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this content..."
                        {...field}
                        data-testid="textarea-item-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === "__custom__") {
                          setCategoryType("custom");
                          field.onChange("");
                        } else {
                          setCategoryType("preset");
                          field.onChange(value);
                        }
                      }} 
                      defaultValue={categoryType === "preset" ? field.value : "__custom__"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Graphics">Graphics</SelectItem>
                        <SelectItem value="Overlays">Overlays</SelectItem>
                        <SelectItem value="Templates">Templates</SelectItem>
                        <SelectItem value="Artifacts">Artifacts</SelectItem>
                        <SelectItem value="Lower Thirds">Lower Thirds</SelectItem>
                        <SelectItem value="Tickers">Tickers</SelectItem>
                        <SelectItem value="Backgrounds">Backgrounds</SelectItem>
                        <SelectItem value="__custom__">Other (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                    {categoryType === "custom" && (
                      <FormControl>
                        <Input
                          placeholder="Enter custom category name..."
                          value={customCategory}
                          onChange={(e) => {
                            setCustomCategory(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          data-testid="input-custom-category"
                          className="mt-2"
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    data-testid="input-tag"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    data-testid="button-add-tag"
                  >
                    Add
                  </Button>
                </div>
                {form.watch("tags").length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("tags").map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1" data-testid={`badge-tag-${index}`}>
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => handleRemoveTag(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploadMutation.isPending || (uploadType === "image" && !selectedFile)}
                  data-testid="button-submit-upload"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
