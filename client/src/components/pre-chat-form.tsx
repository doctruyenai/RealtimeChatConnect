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
        title: "Cuộc trò chuyện đã được tạo",
        description: "Bạn đã được kết nối với agent hỗ trợ",
      });
      onStartChat(conversation);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi tạo cuộc trò chuyện",
        description: error.message || "Vui lòng thử lại sau",
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
        title: "Lỗi",
        description: "Vui lòng nhập họ tên",
      });
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast({
        variant: "destructive", 
        title: "Lỗi",
        description: "Vui lòng nhập số điện thoại",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Lỗi", 
        description: "Vui lòng đồng ý với điều khoản sử dụng",
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
        <h3 className="text-lg font-semibold text-gray-900">Bắt đầu cuộc trò chuyện</h3>
        <p className="text-sm text-gray-600 mt-1">
          Vui lòng cung cấp thông tin để được hỗ trợ tốt nhất
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Họ và tên *
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.customerName}
            onChange={(e) => handleInputChange("customerName", e.target.value)}
            placeholder="Nhập họ và tên"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Số điện thoại *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => handleInputChange("customerPhone", e.target.value)}
            placeholder="Nhập số điện thoại"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Địa chỉ
          </Label>
          <Input
            id="address"
            type="text"
            value={formData.customerAddress}
            onChange={(e) => handleInputChange("customerAddress", e.target.value)}
            placeholder="Nhập địa chỉ"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="requestType" className="text-sm font-medium text-gray-700">
            Loại yêu cầu
          </Label>
          <Select value={formData.requestType} onValueChange={(value) => handleInputChange("requestType", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Chọn loại yêu cầu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Hỗ trợ kỹ thuật</SelectItem>
              <SelectItem value="sales">Tư vấn bán hàng</SelectItem>
              <SelectItem value="complaint">Khiếu nại</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="content" className="text-sm font-medium text-gray-700">
            Nội dung
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange("content", e.target.value)}
            placeholder="Mô tả vấn đề của bạn..."
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
            Tôi đồng ý với{" "}
            <a href="#" className="text-blue-600 hover:underline">
              điều khoản sử dụng
            </a>{" "}
            và{" "}
            <a href="#" className="text-blue-600 hover:underline">
              chính sách bảo mật
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
            Hủy
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={createConversationMutation.isPending}
          >
            {createConversationMutation.isPending ? "Đang tạo..." : "Bắt đầu chat"}
          </Button>
        </div>
      </form>
    </div>
  );
}
