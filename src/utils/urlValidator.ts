export interface UrlValidationResult {
  isValid: boolean;
  normalized?: string;
  hostname?: string;
  error?: string;
}

export type ReachabilityStatus = 'verified' | 'http_error' | 'timeout' | 'cors_inconclusive';

export interface ReachabilityResult {
  reachable: boolean;
  status: ReachabilityStatus;
  httpStatus?: number;
  message?: string;
  error?: string;
}

// Check for private / internal / link-local / cloud metadata IP addresses
function isPrivateOrLocalIp(hostname: string): boolean {
  // IPv4 regex
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some(o => o < 0 || o > 255)) return true;

    const [o1, o2] = octets;
    // 0.0.0.0/8 (current network)
    if (o1 === 0) return true;
    // 127.0.0.0/8 (loopback)
    if (o1 === 127) return true;
    // 10.0.0.0/8 (private)
    if (o1 === 10) return true;
    // 172.16.0.0/12 (private: 172.16.x.x - 172.31.x.x)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    // 192.168.0.0/16 (private)
    if (o1 === 192 && o2 === 168) return true;
    // 169.254.0.0/16 (link-local and cloud metadata like 169.254.169.254)
    if (o1 === 169 && o2 === 254) return true;

    return false;
  }

  // IPv6 checks
  if (hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) {
    const rawIpv6 = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    // Loopback ::1
    if (rawIpv6 === '::1' || rawIpv6 === '0:0:0:0:0:0:0:1') return true;
    // Link-local fe80::
    if (rawIpv6.startsWith('fe80:')) return true;
    // Unique local fc00:: or fd00::
    if (rawIpv6.startsWith('fc') || rawIpv6.startsWith('fd')) return true;
    return true; // Default restrict raw IPv6 for safety
  }

  return false;
}

// Format and safety validator
export function validateUrlFormat(rawInput: string): UrlValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter a website address to continue.'
    };
  }

  const lower = trimmed.toLowerCase();
  const forbiddenSchemes = [
    'javascript:',
    'file:',
    'data:',
    'ftp:',
    'vbscript:',
    'blob:',
    'about:',
    'ws:',
    'wss:'
  ];

  for (const scheme of forbiddenSchemes) {
    if (lower.startsWith(scheme)) {
      return {
        isValid: false,
        error: `The "${scheme}" protocol is unsupported. Only HTTP and HTTPS website addresses are permitted.`
      };
    }
  }

  // Prepend https:// if protocol was omitted
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    candidate = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Only standard HTTP and HTTPS website protocols are supported.'
      };
    }

    if (!parsed.hostname) {
      return {
        isValid: false,
        error: 'Please enter a valid website address with a domain name.'
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for invalid formatting
    if (
      hostname.startsWith('.') ||
      hostname.endsWith('.') ||
      hostname.includes('..') ||
      hostname.includes(' ')
    ) {
      return {
        isValid: false,
        error: 'The website domain format is invalid. Please remove extra dots or spaces.'
      };
    }

    // Block localhost and internal names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.test') ||
      hostname.endsWith('.invalid') ||
      hostname.endsWith('.example') ||
      hostname.endsWith('.lan')
    ) {
      return {
        isValid: false,
        error: 'Localhost and internal network addresses are not permitted. Please enter a public website.'
      };
    }

    // Block private/internal IP ranges
    if (isPrivateOrLocalIp(hostname)) {
      return {
        isValid: false,
        error: 'Private IP addresses and internal infrastructure endpoints are restricted.'
      };
    }

    // Verify valid domain name structure
    const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (!isIpv4) {
      const parts = hostname.split('.');
      if (parts.length < 2) {
        return {
          isValid: false,
          error: 'Please enter a complete domain address (e.g. example.com or https://example.com).'
        };
      }

      const tld = parts[parts.length - 1];
      if (!/^[a-zA-Z]{2,}$/.test(tld)) {
        return {
          isValid: false,
          error: 'The website address must include a valid top-level domain (e.g., .com, .org, .io).'
        };
      }

      // Check each domain label
      for (const part of parts) {
        if (!part || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(part)) {
          return {
            isValid: false,
            error: 'Domain name contains invalid characters. Use letters, numbers, and hyphens only.'
          };
        }
      }
    }

    return {
      isValid: true,
      normalized: parsed.href,
      hostname: parsed.hostname
    };
  } catch {
    return {
      isValid: false,
      error: 'Unable to parse this website address. Please check for typos and try again.'
    };
  }
}

// Bounded browser reachability verification
export async function checkWebsiteReachability(
  normalizedUrl: string,
  timeoutMs = 4000
): Promise<ReachabilityResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Attempt standard fetch with timeout (no mode: 'no-cors' per prompt guidelines)
    const response = await fetch(normalizedUrl, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timer);

    if (response.ok || (response.status >= 200 && response.status < 400)) {
      return {
        reachable: true,
        status: 'verified',
        httpStatus: response.status,
        message: 'Target website reached and verified successfully.'
      };
    }

    if (response.status === 404) {
      return {
        reachable: false,
        status: 'http_error',
        httpStatus: 404,
        error: 'The server was reached but returned a 404 (Not Found) error. Please check the address.'
      };
    }

    return {
      reachable: false,
      status: 'http_error',
      httpStatus: response.status,
      error: `The server was reached but returned an HTTP ${response.status} error.`
    };
  } catch (err: any) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      return {
        reachable: false,
        status: 'timeout',
        error: 'Connection timed out. The website did not respond within 4 seconds.'
      };
    }

    // In browser JavaScript, cross-origin security (CORS) or DNS resolution failures throw TypeError
    return {
      reachable: false,
      status: 'cors_inconclusive',
      error: 'Reachability check inconclusive: Browser cross-origin security (CORS) prevents direct frontend reachability verification for this domain. The domain format is valid, but live reachability could not be confirmed without a backend service.'
    };
  }
}
