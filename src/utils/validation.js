// src/utils/validation.js
export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const combined = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return btoa(String.fromCharCode(...hashArray));
}

export async function verifyPassword(password, hash, salt) {
  const computedHash = await hashPassword(password, salt);
  return computedHash === hash;
}

export function generateSalt() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
}

export function sanitizeString(str) {
  if (!str) return '';
  return str.replace(/[<>]/g, '');
}

export function validatePrice(price) {
  return typeof price === 'number' && price > 0;
}

export function validateBedrooms(bedrooms) {
  return typeof bedrooms === 'number' && bedrooms >= 0;
}

export function validateBathrooms(bathrooms) {
  return typeof bathrooms === 'number' && bathrooms >= 0;
}

export function validateArea(area) {
  return typeof area === 'number' && area > 0;
}
