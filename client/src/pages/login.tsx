import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Mail, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("agent", JSON.stringify(data.agent));
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${data.agent.name}!`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: error.message || "Email hoặc mật khẩu không đúng",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
      });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Hệ Thống Chat Real-time
          </CardTitle>
          <p className="text-gray-600 mt-2">Đăng nhập để truy cập dashboard agent</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@company.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mật khẩu
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Tài khoản demo:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Email: agent1@company.com</div>
              <div>Password: password123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
