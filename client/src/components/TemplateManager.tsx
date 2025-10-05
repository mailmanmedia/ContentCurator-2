import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2, Palette, FileText, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  templateType: string;
  styling: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    fontFamily?: string;
    borderColor?: string;
    padding?: string;
  };
  defaultContent: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().default(""),
  category: z.string().min(1, "Category is required"),
  templateType: z.string().min(1, "Template type is required"),
  styling: z.object({
    backgroundColor: z.string().default("#C8102E"),
    textColor: z.string().default("#FFFFFF"),
    fontSize: z.string().default("24px"),
    fontFamily: z.string().default("League Spartan, sans-serif"),
    borderColor: z.string().default("#F6EB61"),
    padding: z.string().default("16px"),
  }).default({}),
  defaultContent: z.record(z.string()).default({}),
  isActive: z.boolean().default(true),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export default function TemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contentPairs, setContentPairs] = useState<Array<{ key: string; value: string }>>([]);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ templates: Template[] }>({
    queryKey: ['/api/templates'],
  });

  const templates = data?.templates || [];

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      templateType: '',
      styling: {
        backgroundColor: '#C8102E',
        textColor: '#FFFFFF',
        fontSize: '24px',
        fontFamily: 'League Spartan, sans-serif',
        borderColor: '#F6EB61',
        padding: '16px',
      },
      defaultContent: {},
      isActive: true,
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: TemplateFormData) => {
      const response = await apiRequest('POST', '/api/templates', templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      const response = await apiRequest('PATCH', `/api/templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template updated successfully' });
      setIsDialogOpen(false);
      setSelectedTemplate(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Failed to update template', variant: 'destructive' });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete template', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    form.reset({
      name: '',
      description: '',
      category: '',
      templateType: '',
      styling: {
        backgroundColor: '#C8102E',
        textColor: '#FFFFFF',
        fontSize: '24px',
        fontFamily: 'League Spartan, sans-serif',
        borderColor: '#F6EB61',
        padding: '16px',
      },
      defaultContent: {},
      isActive: true,
    });
    setContentPairs([]);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    
    // Convert defaultContent object to array of key-value pairs
    const pairs = Object.entries(template.defaultContent || {}).map(([key, value]) => ({
      key,
      value,
    }));
    setContentPairs(pairs);

    form.reset({
      name: template.name,
      description: template.description || '',
      category: template.category,
      templateType: template.templateType,
      styling: {
        backgroundColor: template.styling?.backgroundColor || '#C8102E',
        textColor: template.styling?.textColor || '#FFFFFF',
        fontSize: template.styling?.fontSize || '24px',
        fontFamily: template.styling?.fontFamily || 'League Spartan, sans-serif',
        borderColor: template.styling?.borderColor || '#F6EB61',
        padding: template.styling?.padding || '16px',
      },
      defaultContent: template.defaultContent || {},
      isActive: template.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setSelectedTemplate(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: TemplateFormData) => {
    // Convert content pairs to object
    const defaultContent: Record<string, string> = {};
    contentPairs.forEach(pair => {
      if (pair.key && pair.value) {
        defaultContent[pair.key] = pair.value;
      }
    });

    const submissionData = {
      ...data,
      defaultContent,
    };

    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data: submissionData });
    } else {
      createTemplateMutation.mutate(submissionData);
    }
  };

  const addContentPair = () => {
    setContentPairs([...contentPairs, { key: '', value: '' }]);
  };

  const removeContentPair = (index: number) => {
    setContentPairs(contentPairs.filter((_, i) => i !== index));
  };

  const updateContentPair = (index: number, field: 'key' | 'value', value: string) => {
    const newPairs = [...contentPairs];
    newPairs[index][field] = value;
    setContentPairs(newPairs);
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'lower-third': return 'default';
      case 'banner': return 'secondary';
      case 'full-screen': return 'outline';
      case 'ticker': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-league-spartan font-bold text-xl uppercase tracking-wide">
          Template Manager
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mailman Monday Lower Third"
                            data-testid="input-template-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-template-active"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Is Active
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Weekly show opener with Liverpool branding"
                          rows={2}
                          data-testid="input-template-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-template-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lower-third">Lower Third</SelectItem>
                            <SelectItem value="banner">Banner</SelectItem>
                            <SelectItem value="full-screen">Full Screen</SelectItem>
                            <SelectItem value="ticker">Ticker</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="templateType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-template-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mailman-monday">Mailman Monday</SelectItem>
                            <SelectItem value="data-dive-wednesday">Data Dive Wednesday</SelectItem>
                            <SelectItem value="future-focus-friday">Future Focus Friday</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <Label className="text-base font-semibold">Styling</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                    <FormField
                      control={form.control}
                      name="styling.backgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="color"
                                className="w-16 h-9 p-1"
                                data-testid="input-styling-bgcolor"
                                {...field}
                              />
                            </FormControl>
                            <Input
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="#C8102E"
                              className="flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="styling.textColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="color"
                                className="w-16 h-9 p-1"
                                data-testid="input-styling-textcolor"
                                {...field}
                              />
                            </FormControl>
                            <Input
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="#FFFFFF"
                              className="flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="styling.borderColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Border Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="color"
                                className="w-16 h-9 p-1"
                                data-testid="input-styling-bordercolor"
                                {...field}
                              />
                            </FormControl>
                            <Input
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="#F6EB61"
                              className="flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="styling.fontSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Size</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="24px"
                              data-testid="input-styling-fontsize"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="styling.fontFamily"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Family</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="League Spartan, sans-serif"
                              data-testid="input-styling-fontfamily"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="styling.padding"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Padding</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="16px"
                              data-testid="input-styling-padding"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <Label className="text-base font-semibold">Default Content</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addContentPair}
                      data-testid="button-add-content-pair"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  <div className="space-y-2 p-4 border rounded-md">
                    {contentPairs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No default content fields. Click "Add Field" to create key-value pairs.
                      </p>
                    ) : (
                      contentPairs.map((pair, index) => (
                        <div key={index} className="flex gap-2 items-center" data-testid={`content-pair-${index}`}>
                          <Input
                            placeholder="Key (e.g., title)"
                            value={pair.key}
                            onChange={(e) => updateContentPair(index, 'key', e.target.value)}
                            className="flex-1"
                            data-testid={`input-content-key-${index}`}
                          />
                          <Input
                            placeholder="Value (e.g., Mailman Monday)"
                            value={pair.value}
                            onChange={(e) => updateContentPair(index, 'value', e.target.value)}
                            className="flex-1"
                            data-testid={`input-content-value-${index}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeContentPair(index)}
                            data-testid={`button-remove-content-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-template"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    data-testid="button-submit-template"
                  >
                    {selectedTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No Templates Yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first branded template for lower thirds and banners
            </p>
            <Button onClick={handleOpenNewDialog} data-testid="button-create-first-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg" data-testid={`text-template-name-${template.id}`}>
                      {template.name}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={getCategoryBadgeVariant(template.category)} data-testid={`badge-category-${template.id}`}>
                        {template.category}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-type-${template.id}`}>
                        {template.templateType}
                      </Badge>
                      {!template.isActive && (
                        <Badge variant="secondary" data-testid={`badge-inactive-${template.id}`}>
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-description-${template.id}`}>
                    {template.description}
                  </p>
                )}
                <div
                  className="rounded-md p-4 flex items-center justify-center min-h-[100px]"
                  style={{
                    backgroundColor: template.styling?.backgroundColor || '#C8102E',
                    color: template.styling?.textColor || '#FFFFFF',
                    borderLeft: `4px solid ${template.styling?.borderColor || '#F6EB61'}`,
                    fontFamily: template.styling?.fontFamily || 'League Spartan, sans-serif',
                    fontSize: template.styling?.fontSize || '24px',
                  }}
                  data-testid={`preview-${template.id}`}
                >
                  <div className="text-center">
                    <div className="font-bold">{template.name}</div>
                    {Object.keys(template.defaultContent || {}).length > 0 && (
                      <div className="text-sm opacity-80 mt-1">
                        {Object.values(template.defaultContent)[0]}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                  className="flex-1"
                  data-testid={`button-edit-${template.id}`}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                  disabled={deleteTemplateMutation.isPending}
                  data-testid={`button-delete-${template.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
