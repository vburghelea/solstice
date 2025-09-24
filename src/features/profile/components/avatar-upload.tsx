import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { removeUploadedAvatar, uploadAvatar } from "~/features/profile/profile.mutations";

interface AvatarUploadProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  uploadedAvatarPath?: string | null;
}

export function AvatarUpload({
  name,
  email,
  image,
  uploadedAvatarPath,
}: AvatarUploadProps) {
  const qc = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const doUpload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["userProfile"] }),
        qc.invalidateQueries({ queryKey: ["user"] }),
        qc.invalidateQueries({ queryKey: ["teamMembers"] }),
        qc.invalidateQueries({ queryKey: ["blocklist"] }),
      ]);
      toast.success("Avatar updated");
    },
    onError: () => toast.error("Failed to upload avatar"),
  });

  const doRemove = useMutation({
    mutationFn: removeUploadedAvatar,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["userProfile"] }),
        qc.invalidateQueries({ queryKey: ["user"] }),
        qc.invalidateQueries({ queryKey: ["teamMembers"] }),
        qc.invalidateQueries({ queryKey: ["blocklist"] }),
      ]);
      toast.success("Reverted to provider avatar");
    },
    onError: () => toast.error("Failed to remove avatar"),
  });

  async function handleFile(file: File) {
    try {
      setIsProcessing(true);
      const dataUrl = await resizeToSquareWebp(file, 256);
      await doUpload.mutateAsync({
        data: { imageData: dataUrl, contentType: "image/webp" },
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not process image");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar
          className="h-16 w-16"
          name={name ?? null}
          email={email ?? null}
          srcUploaded={uploadedAvatarPath ?? null}
          srcProvider={image ?? null}
        />
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              // Reset the input so selecting the same file again triggers onChange
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessing ? "Processing..." : "Upload avatar"}
          </Button>
          {uploadedAvatarPath ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => doRemove.mutate(undefined)}
              disabled={doRemove.isPending}
            >
              Use provider avatar
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

async function resizeToSquareWebp(file: File, target: number): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const size = Math.min(img.width, img.height);
  const sx = (img.width - size) / 2;
  const sy = (img.height - size) / 2;
  ctx.drawImage(img, sx, sy, size, size, 0, 0, target, target);
  const dataUrl = canvas.toDataURL("image/webp", 0.9);
  return dataUrl;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
