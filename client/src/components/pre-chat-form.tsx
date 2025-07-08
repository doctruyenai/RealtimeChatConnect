import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, PreChatFormData } from "@shared/schema";

interface PreChatFormProps {
  onStartChat: (conversation: Conversation) => void;
}

export default function PreChatForm({ onStartChat }: PreChatFormProps) {
  const [formData, setFormData] = useState<PreChatFormData>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    requestType: "",
    content: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();

  const createConversationMutation = useMutation({
    mutationFn: async (data: PreChatFormData) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
    onSuccess: (conversation: Conversation) => {
      toast({
        title: "Cuoc tro chuyen da duoc tao",
        description: "Ban da duoc ket noi voi agent ho tro",
      });
      onStartChat(conversation);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Loi tao cuoc tro chuyen",
        description: error.message || "Vui long thu lai sau",
      });
    },
  });

  const handleInputChange = (field: keyof PreChatFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      toast({
        variant: "destructive",
        title: "Loi",
        description: "Vui long nhap ho ten",
      });
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast({
        variant: "destructive", 
        title: "Loi",
        description: "Vui long nhap so dien thoai",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Loi", 
        description: "Vui long dong y voi dieu khoan su dung",
      });
      return;
    }

    createConversationMutation.mutate(formData);
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
          <MessageCircle className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Bat dau cuoc tro chuyen</h3>
        <p className="text-sm text-gray-600 mt-1">
          Vui long cung cap thong tin de duoc ho tro tot nhat
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Ho va ten *
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.customerName}
            onChange={(e) => handleInputChange("customerName", e.target.value)}
            placeholder="Nhap ho va ten"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            So dien thoai *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => handleInputChange("customerPhone", e.target.value)}
            placeholder="Nhap so dien thoai"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Dia chi
          </Label>
          <Input
            id="address"
            type="text"
            value={formData.customerAddress}
            onChange={(e) => handleInputChange("customerAddress", e.target.value)}
            placeholder="Nhap dia chi"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="requestType" className="text-sm font-medium text-gray-700">
            Loai yeu cau
          </Label>
          <Select value={formData.requestType} onValueChange={(value) => handleInputChange("requestType", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Chon loai yeu cau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Ho tro ky thuat</SelectItem>
              <SelectItem value="sales">Tu van ban hang</SelectItem>
              <SelectItem value="complaint">Khieu nai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="content" className="text-sm font-medium text-gray-700">
            Noi dung
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange("content", e.target.value)}
            placeholder="Mo ta van de cua ban..."
            className="mt-1 resize-none"
            rows={3}
          />
        </div>

        <div className="flex items-start">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
            className="mt-1"
            required
          />
          <Label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            Toi dong y voi{" "}
            <a href="#" className="text-blue-600 hover:underline">
              dieu khoan su dung
            </a>{" "}
            va{" "}
            <a href="#" className="text-blue-600 hover:underline">
              chinh sach bao mat
            </a>
          </Label>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => window.parent.postMessage("closeChat", "*")}
          >
            Huy
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={createConversationMutation.isPending}
          >
            {createConversationMutation.isPending ? "Dang tao..." : "Bat dau chat"}
          </Button>
        </div>
      </form>
    </div>
  );
}
