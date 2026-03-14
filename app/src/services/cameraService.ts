import { isNative } from "@/utils/platform";

interface CaptureResult {
  dataUrl: string;
  blob: Blob;
}

/**
 * Capture or select a scorecard photo.
 * On native (Capacitor): uses @capacitor/camera plugin.
 * On web: falls back to a hidden file input.
 */
export async function captureScorecard(): Promise<CaptureResult | null> {
  if (isNative()) {
    return captureNative();
  }
  return captureWeb();
}

async function captureNative(): Promise<CaptureResult | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      width: 1600,
      height: 1200,
    });

    if (!photo.dataUrl) return null;

    const response = await fetch(photo.dataUrl);
    const blob = await response.blob();

    return { dataUrl: photo.dataUrl, blob };
  } catch {
    // User cancelled or plugin not available
    return null;
  }
}

function captureWeb(): Promise<CaptureResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ dataUrl, blob: file });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    // Handle cancel (input doesn't fire change on cancel, so we use focus)
    const handleFocus = () => {
      window.removeEventListener("focus", handleFocus);
      setTimeout(() => {
        if (!input.files?.length) resolve(null);
      }, 500);
    };
    window.addEventListener("focus", handleFocus);

    input.click();
  });
}

/**
 * Upload a scorecard image to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadScorecardImage(
  blob: Blob,
  roundId: string
): Promise<string | null> {
  try {
    const { supabase } = await import("@/services/supabaseClient");
    const fileName = `scorecards/${roundId}-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("scorecard-photos")
      .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("scorecard-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch {
    console.error("Supabase storage not configured");
    return null;
  }
}
