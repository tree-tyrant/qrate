declare module 'canvas-confetti' {
  type ConfettiOptions = Record<string, unknown>;

  interface ConfettiFunction {
    (options?: ConfettiOptions): void;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}

declare module 'qrcode' {
  interface QRCodeColorOptions {
    dark?: string;
    light?: string;
  }

  interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: string;
    margin?: number;
    scale?: number;
    color?: QRCodeColorOptions;
    rendererOpts?: Record<string, unknown>;
  }

  interface QRCodeModule {
    toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  }

  const QRCode: QRCodeModule;
  export default QRCode;
}

declare module 'sonner';
declare module 'sonner@2.0.3';

