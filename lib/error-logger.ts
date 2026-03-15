import { supabase } from "./supabase";

export function logError(params: {
  searchKeyword?: string;
  errorMessage: string;
  errorType: "platform_search" | "claude_analysis" | "timeout" | "unknown";
}): void {
  supabase
    .from("error_logs")
    .insert({
      search_keyword: params.searchKeyword || null,
      error_message: params.errorMessage,
      error_type: params.errorType,
    })
    .then(({ error }) => {
      if (error) console.error("[error-logger] Failed to log:", error.message);
    });
}
