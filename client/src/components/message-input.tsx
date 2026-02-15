import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ClipboardPaste } from "lucide-react";

interface MessageInputProps {
  onExtract: (message: string) => void;
  isLoading: boolean;
}

export function MessageInput({ onExtract, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onExtract(message.trim());
      setMessage("");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setMessage(text);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-medium" data-testid="text-input-title">
              Paste WhatsApp Message
            </h2>
            <p className="text-xs text-muted-foreground">
              AI will extract order details automatically
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaste}
            data-testid="button-paste"
          >
            <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" />
            Paste
          </Button>
        </div>
        <Textarea
          placeholder={"Bhaiya 2 kg aloo, 1 kg tamatar, aur 500g pyaaz bhej do. Total kitna hoga?\n\nPaste any WhatsApp order message here..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[120px] resize-none text-sm"
          data-testid="input-message"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            data-testid="button-extract"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Extracting..." : "Extract Order"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
