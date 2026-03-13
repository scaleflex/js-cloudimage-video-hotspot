import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '../src/popover/sanitize';

describe('sanitizeHTML', () => {
  it('allows safe tags', () => {
    const result = sanitizeHTML('<p>Hello <strong>world</strong></p>');
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });

  it('removes script tags', () => {
    const result = sanitizeHTML('<p>Safe</p><script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Safe');
  });

  it('removes event handlers', () => {
    const result = sanitizeHTML('<p onclick="alert(1)">Click</p>');
    expect(result).not.toContain('onclick');
  });

  it('removes disallowed tags', () => {
    const result = sanitizeHTML('<iframe src="evil.com"></iframe><p>OK</p>');
    expect(result).not.toContain('iframe');
    expect(result).toContain('OK');
  });

  it('allows safe links', () => {
    const result = sanitizeHTML('<a href="https://example.com">Link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('removes javascript: URLs', () => {
    const result = sanitizeHTML('<a href="javascript:alert(1)">Bad</a>');
    expect(result).not.toContain('javascript');
  });

  it('allows safe images', () => {
    const result = sanitizeHTML('<img src="https://example.com/img.jpg" alt="test">');
    expect(result).toContain('src="https://example.com/img.jpg"');
  });

  it('removes data:image/svg sources', () => {
    const result = sanitizeHTML('<img src="data:image/svg+xml,<svg onload=alert(1)>">');
    expect(result).not.toContain('data:image/svg');
  });
});
