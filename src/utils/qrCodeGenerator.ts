import QRCode from 'qrcode';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const generateQRCodeSVG = async (data: string): Promise<string> => {
  try {
    const qrCodeSVG = await QRCode.toString(data, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    return `data:image/svg+xml;base64,${btoa(qrCodeSVG)}`;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw error;
  }
};