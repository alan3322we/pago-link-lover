import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, DollarSign, FileText, Upload, X } from 'lucide-react';

interface CheckoutLinkFormProps {
  onLinkCreated: () => void;
}

function CheckoutLinkForm({ onLinkCreated }: CheckoutLinkFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryLink, setDeliveryLink] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = null;
      
      // Upload da imagem se selecionada
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          toast({
            title: "Erro",
            description: "Não foi possível fazer upload da imagem.",
            variant: "destructive",
          });
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-link', {
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          currency: 'BRL',
          image_url: imageUrl,
          delivery_link: deliveryLink.trim() || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Link criado!",
        description: "Seu link de checkout foi criado com sucesso.",
      });

      // Limpar formulário
      setTitle('');
      setDescription('');
      setAmount('');
      setDeliveryLink('');
      removeImage();
      
      onLinkCreated();
    } catch (error: any) {
      console.error('Error creating link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o link. Verifique suas configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          <CardTitle>Criar Novo Link</CardTitle>
        </div>
        <CardDescription>
          Crie um novo link de checkout para receber pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Título *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Produto Premium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição opcional do produto/serviço..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor (R$) *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link de Entrega
            </Label>
            <Input
              id="delivery-link"
              type="url"
              placeholder="https://drive.google.com/... ou https://..."
              value={deliveryLink}
              onChange={(e) => setDeliveryLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Link que será liberado após o pagamento ser aprovado (opcional)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Imagem do Produto
            </Label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Clique para selecionar uma imagem
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !title.trim() || !amount}
          >
            {isLoading ? 'Criando...' : 'Criar Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default CheckoutLinkForm;