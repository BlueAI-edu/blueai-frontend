import { toast } from "@/hooks/use-toast";

export function getApiErrorMessage(
  error,
  fallbackMessage = "Something went wrong",
) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((err) => err.msg || "Validation error").join(", ");
  }
  return detail || error?.message || fallbackMessage;
}

export function handleApiError(
  error,
  fallbackMessage = "Something went wrong",
) {
  const message = getApiErrorMessage(error, fallbackMessage);
  console.error(fallbackMessage, error);
  toast({ title: "Error", description: message, variant: "destructive" });
}

export function showSuccess(message) {
  toast({ title: "Success", description: message });
}
