// Safe API fetch helper to prevent "Unexpected token '<' is not valid JSON" errors
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';

  // Read response as text first to safely inspect before JSON parsing
  const rawText = await res.text();
  const trimmed = rawText ? rawText.trim() : '';
  const isHtml = trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html');

  // If response is HTML, never pass it to JSON.parse
  if (isHtml) {
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('ফাইলের সাইজ খুব বড় (HTTP 413 Payload Too Large)। ক্লাউড সার্ভারের সর্বোচ্চ সীমা ৩২ মেগাবাইট। অনুগ্রহ করে ছোট ফাইল নির্বাচন করুন অথবা সরাসরি ভিডিও লিঙ্ক দিন।');
      }
      throw new Error(`সার্ভার ত্রুটি (HTTP ${res.status}): অনুরোধ প্রক্রিয়া করা যায়নি।`);
    }
    throw new Error(`সার্ভার থেকে অপ্রত্যাশিত ফরম্যাট পাওয়া গেছে (HTTP ${res.status})।`);
  }

  // Parse as JSON safely
  let data: any = {};
  if (trimmed) {
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('ফাইলের সাইজ খুব বড় (HTTP 413 Payload Too Large)। অনুগ্রহ করে ছোট ফাইল আপলোড করুন।');
        }
        throw new Error(`সার্ভার ত্রুটি (HTTP ${res.status})`);
      }
      // Return empty object instead of throwing raw SyntaxError
      data = {};
    }
  }

  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('ফাইলের সাইজ খুব বড় (HTTP 413 Payload Too Large)। ক্লাউড সার্ভার সর্বোচ্চ ৩২ মেগাবাইট অনুমোদন করে।');
    }
    const errorMsg = (data && typeof data === 'object' && data.error) || `অনুরোধ ব্যর্থ হয়েছে (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}
