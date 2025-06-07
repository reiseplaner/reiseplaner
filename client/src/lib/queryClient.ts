import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`🌐 API Request: ${method} ${url}`);
  console.log(`🌐 Request Data:`, data);
  
  // Get current session for authorization
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log(`🌐 Session:`, session ? 'Present' : 'Missing');
  console.log(`🌐 Session Error:`, sessionError);
  console.log(`🌐 Access Token:`, session?.access_token ? 'Present' : 'Missing');
  console.log(`🌐 User ID:`, session?.user?.id);
  console.log(`🌐 Token expires at:`, session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
  
  // Check if token is expired
  if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
    console.error(`🔴 Token is expired! Expires at: ${new Date(session.expires_at * 1000)}, Current time: ${new Date()}`);
    // Try to refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    console.log(`🔄 Session refresh result:`, refreshData, refreshError);
    if (refreshData?.session) {
      console.log(`🟢 Session refreshed successfully`);
    }
  }
  
  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    console.error(`🔴 No access token available for request!`);
  }

  console.log(`🌐 Request Headers:`, headers);

  const res = await fetch(url, {
    method,
    headers,
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  console.log(`🌐 Response Status: ${res.status} ${res.statusText}`);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`🔴 API Error Response:`, errorText);
    
    // If 401 error, try to refresh session and retry once
    if (res.status === 401 && session) {
      console.log(`🔄 Got 401 error, attempting to refresh session...`);
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshData?.session && !refreshError) {
        console.log(`🟢 Session refreshed, retrying original request...`);
        
        // Update headers with new token
        const newHeaders = { ...headers };
        newHeaders.Authorization = `Bearer ${refreshData.session.access_token}`;
        
        // Retry the original request
        const retryRes = await fetch(url, {
          method,
          headers: newHeaders,
          body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
          credentials: "include",
        });
        
        if (retryRes.ok) {
          console.log(`🟢 Retry successful after session refresh`);
          return retryRes;
        } else {
          console.error(`🔴 Retry also failed with status:`, retryRes.status);
        }
      } else {
        console.error(`🔴 Session refresh failed:`, refreshError);
      }
    }
    
    // Re-create response for throwIfResNotOk
    const errorResponse = new Response(errorText, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    });
    await throwIfResNotOk(errorResponse);
  }

  console.log(`🌐 Response OK`);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get current session for authorization
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
