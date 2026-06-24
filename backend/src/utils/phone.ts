export function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function getTimeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getDefaultWhatsAppMessage(date: Date = new Date()): string {
  return `${getTimeGreeting(date)}, tudo bem?`;
}

export function getWhatsAppLink(phone: string, message?: string): string | null {
  let digits = getPhoneDigits(phone);
  if (!digits) return null;

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  let baseUrl: string;
  if (digits.startsWith('55') && digits.length >= 12) {
    baseUrl = `https://wa.me/${digits}`;
  } else if (digits.length === 10 || digits.length === 11) {
    baseUrl = `https://wa.me/55${digits}`;
  } else {
    baseUrl = `https://wa.me/${digits}`;
  }

  const text = message?.trim();
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }

  return baseUrl;
}
