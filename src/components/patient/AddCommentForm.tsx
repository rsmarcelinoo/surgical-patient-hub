import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, Pin } from "lucide-react";
import { toast } from "sonner";

interface AddCommentFormProps {
  patientId: string;
  episodeId?: string;
  surgeryId?: string;
}

export function AddCommentForm({ patientId, episodeId, surgeryId }: AddCommentFormProps) {
  const [text, setText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      // Extract mentions from text (@username)
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]);
      }

      const { error } = await supabase.from("comments").insert({
        patient_id: patientId,
        episode_id: episodeId || null,
        surgery_id: surgeryId || null,
        text,
        author: "Current User", // In real app, get from auth
        mentions: mentions.length > 0 ? mentions : null,
        is_pinned: isPinned,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-comments", patientId] });
      setText("");
      setIsPinned(false);
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addCommentMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment... Use @name to mention someone"
        rows={3}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="pinned"
            checked={isPinned}
            onCheckedChange={(checked) => setIsPinned(checked === true)}
          />
          <Label htmlFor="pinned" className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer">
            <Pin className="h-3 w-3" />
            Pin this comment
          </Label>
        </div>
        <Button type="submit" size="sm" disabled={!text.trim() || addCommentMutation.isPending}>
          <Send className="h-4 w-4 mr-1" />
          Send
        </Button>
      </div>
    </form>
  );
}
