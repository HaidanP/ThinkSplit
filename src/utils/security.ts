// Security utilities for protecting sensitive data

export class SecurityManager {
  private static instance: SecurityManager;
  private sensitiveKeys: Set<string> = new Set();

  private constructor() {
    this.initializeSecurityMeasures();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private initializeSecurityMeasures() {
    // Prevent developer tools in production
    if (process.env.NODE_ENV === 'production') {
      this.preventDevTools();
    }

    // Override global functions that could leak data
    this.protectGlobalFunctions();
    
    // Monitor for potential XSS attempts
    this.monitorXSS();
  }

  private preventDevTools() {
    // Detect if developer tools are open
    let devtools = { open: false, orientation: null };
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        if (!devtools.open) {
          devtools.open = true;
          console.clear();
          console.warn('Developer tools detected. API keys are protected.');
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  private protectGlobalFunctions() {
    // Override JSON.stringify to hide sensitive data
    const originalStringify = JSON.stringify;
    JSON.stringify = (value, replacer, space) => {
      return originalStringify(value, (key, val) => {
        if (this.isSensitiveKey(key) || this.containsSensitiveData(val)) {
          return '[PROTECTED]';
        }
        return typeof replacer === 'function' ? replacer(key, val) : val;
      }, space);
    };

    // Override localStorage to encrypt sensitive data
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key: string, value: string) => {
      if (this.isSensitiveKey(key)) {
        value = this.encryptData(value);
      }
      return originalSetItem.call(localStorage, key, value);
    };

    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key: string) => {
      const value = originalGetItem.call(localStorage, key);
      if (value && this.isSensitiveKey(key)) {
        return this.decryptData(value);
      }
      return value;
    };
  }

  private monitorXSS() {
    // Monitor for suspicious script injection attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'SCRIPT' || 
                  element.innerHTML.includes('<script') ||
                  element.innerHTML.includes('javascript:')) {
                console.warn('Potential XSS attempt detected and blocked');
                element.remove();
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  public registerSensitiveKey(key: string) {
    this.sensitiveKeys.add(key.toLowerCase());
  }

  public unregisterSensitiveKey(key: string) {
    this.sensitiveKeys.delete(key.toLowerCase());
  }

  private isSensitiveKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('api') || 
           lowerKey.includes('key') || 
           lowerKey.includes('token') || 
           lowerKey.includes('secret') ||
           this.sensitiveKeys.has(lowerKey);
  }

  private containsSensitiveData(value: any): boolean {
    if (typeof value !== 'string') return false;
    return value.startsWith('sk-') || 
           value.startsWith('sk-or-v1-') ||
           value.length > 20 && /^[A-Za-z0-9_-]+$/.test(value);
  }

  private encryptData(data: string): string {
    // Simple obfuscation for client-side storage
    // Note: This is not cryptographically secure, just prevents casual inspection
    return btoa(data.split('').reverse().join(''));
  }

  private decryptData(data: string): string {
    try {
      return atob(data).split('').reverse().join('');
    } catch {
      return data; // Return original if decryption fails
    }
  }

  // Secure API key validation
  public validateApiKey(key: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!key) {
      errors.push('API key is required');
      return { isValid: false, errors };
    }

    if (typeof key !== 'string') {
      errors.push('API key must be a string');
      return { isValid: false, errors };
    }

    if (!key.startsWith('sk-or-v1-')) {
      errors.push('Invalid API key format');
    }

    if (key.length < 25) {
      errors.push('API key too short');
    }

    if (key.length > 200) {
      errors.push('API key too long');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(key)) {
      errors.push('API key contains invalid characters');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Content Security Policy headers (for server-side implementation)
  public static getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://openrouter.ai",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }
}

// Initialize security manager
export const securityManager = SecurityManager.getInstance();

// Register common sensitive key patterns
securityManager.registerSensitiveKey('apikey');
securityManager.registerSensitiveKey('openrouter');
securityManager.registerSensitiveKey('bearer');
securityManager.registerSensitiveKey('authorization');