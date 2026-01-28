// Polyfills for Microsoft Edge compatibility
import 'core-js/stable';

// Ensure globalThis is available
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// Polyfill for Array.prototype.at (if needed)
if (!Array.prototype.at) {
  Array.prototype.at = function(index: number) {
    const len = this.length;
    const relativeIndex = Math.trunc(index) || 0;
    const k = relativeIndex < 0 ? len + relativeIndex : relativeIndex;
    return k < 0 || k >= len ? undefined : this[k];
  };
}

// Polyfill for String.prototype.at (if needed)
if (!String.prototype.at) {
  String.prototype.at = function(index: number) {
    const len = this.length;
    const relativeIndex = Math.trunc(index) || 0;
    const k = relativeIndex < 0 ? len + relativeIndex : relativeIndex;
    return k < 0 || k >= len ? undefined : this[k];
  };
}