export function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function getWhatsAppLink(phone: string): string | null {
  let digits = getPhoneDigits(phone);
  if (!digits) return null;

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith('55') && digits.length >= 12) {
    return `https://wa.me/${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `https://wa.me/55${digits}`;
  }

  return `https://wa.me/${digits}`;
}
