const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254", // AWS/GCP/Azure Metadata
  "metadata.google.internal",
];

export function validateWebhookUrl(urlStr: string): { isValid: boolean; error?: string } {
  try {
    const url = new URL(urlStr);

    // Yalnızca HTTP ve HTTPS protokolleri
    if (!["http:", "https:"].includes(url.protocol)) {
      return { isValid: false, error: "Yalnızca HTTP ve HTTPS protokolleri desteklenmektedir." };
    }

    const hostname = url.hostname.toLowerCase();

    // Loopback ve Metadata kontrolü
    if (BLOCKED_HOSTS.includes(hostname)) {
      return { isValid: false, error: "Güvenlik İhlali: Yerel veya metadata adreslerine webhook kurulamaz (SSRF koruması)." };
    }

    // Özel IP Aralıkları (RFC 1918 ve Link-Local koruması)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      if (
        octet1 === 10 ||
        octet1 === 127 ||
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) ||
        (octet1 === 192 && octet2 === 168) ||
        (octet1 === 169 && octet2 === 254) ||
        octet1 === 0
      ) {
        return { isValid: false, error: "Güvenlik İhlali: Özel IP bloklarına (Private Subnet) webhook kurulamaz." };
      }
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Geçersiz URL formatı." };
  }
}
