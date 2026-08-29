import { ShopSettings } from '../types';

/**
 * Service to generate WhatsApp deep links for various business scenarios.
 * Uses wa.me for cross-platform compatibility.
 */
export const whatsAppService = {
  /**
   * Generates a link to notify the customer that their booking is confirmed.
   */
  getConfirmationLink: (
    phone: string, 
    customerName: string, 
    shopName: string, 
    serviceName: string, 
    time: string, 
    date: string
  ): string => {
    const message = `Hi ${customerName}! 👋 Your booking at *${shopName}* for ${serviceName} on ${date} at ${time} has been *CONFIRMED*. Look forward to seeing you then!`;
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Generates a link to suggest a new time or notify of a decline.
   */
  getUpdateLink: (
    phone: string, 
    customerName: string, 
    shopName: string, 
    reason?: string
  ): string => {
    const message = `Hi ${customerName}! This is *${shopName}*. Regarding your booking request: ${reason || 'we need to reschedule'}. Please let us know what time works best for you!`;
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Generates a link for a digital receipt.
   */
  getReceiptLink: (
    phone: string, 
    customerName: string, 
    shopName: string, 
    total: string, 
    items: string
  ): string => {
    const message = `Hi ${customerName}! 🧾 Here is your receipt from *${shopName}*.\n\n*Items:* ${items}\n*Total:* ${total}\n\nThank you for choosing us!`;
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Sends automated WhatsApp message using central platform gateway or custom tenant API key.
   */
  sendMessage: async (
    phone: string,
    message: string,
    settings?: ShopSettings
  ): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const apiKey = settings?.customWhatsAppApiKey || import.meta.env.VITE_WHATSAPP_API_KEY;

    if (apiKey) {
      try {
        // Example integration with UltraMsg / WhatsApp API gateway
        const response = await fetch('https://api.ultramsg.com/instance/messages/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: apiKey,
            to: cleanPhone,
            body: message
          })
        });
        return response.ok;
      } catch (err) {
        console.error('WhatsApp API Direct Send Error:', err);
      }
    }

    // Fallback: Open wa.me link
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    return true;
  },

  /**
   * Shares a PDF file via Web Share API if available,
   * otherwise falls back to wa.me text link.
   * Returns true if shared successfully via Web Share API.
   */
  sharePDF: async (
    pdfBlob: Blob,
    filename: string,
    phone: string,
    messageText: string
  ): Promise<boolean> => {
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    // Try Web Share API with file support (works on modern mobile browsers)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: filename,
          text: messageText
        });
        return true;
      } catch (e) {
        // User cancelled the share — not an error
        if ((e as Error).name === 'AbortError') return false;
        // Fall through to WhatsApp fallback
      }
    }

    // Fallback: open WhatsApp with text-only message
    const cleanPhone = phone.replace(/\D/g, '');
    const fallbackMessage = messageText + '\n\n_📎 PDF receipt was downloaded to your device._';
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fallbackMessage)}`,
      '_blank'
    );
    return false;
  }
};
