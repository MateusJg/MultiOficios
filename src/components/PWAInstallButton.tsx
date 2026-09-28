import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  X, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  ExternalLink, 
  CheckCircle, 
  Copy, 
  AlertTriangle, 
  QrCode,
  ArrowUp,
  Search,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'floating';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { 
    canPromptDirectly, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isInAppBrowser, 
    isInsideIframe,
    directAppUrl, 
    install 
  } = usePWAInstall();
  
  const [showModal, setShowModal] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generate QR code for seamless scanning with phone camera
  useEffect(() => {
    QRCode.toDataURL(directAppUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR code generation error:', err));
  }, [directAppUrl]);

  // If already running inside standalone PWA mode, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Handle install click
  const handleClick = async () => {
    // If inside an iframe (like AI Studio preview), native install is blocked by browser security
    if (isInsideIframe) {
      setShowModal(true);
      return;
    }

    if (canPromptDirectly) {
      const result = await install();
      if (result === 'manual_guide' || result === 'dismissed') {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(directAppUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <>
      {/* 1. Header Button */}
      {variant === 'header' && (
        <button
          onClick={handleClick}
          type="button"
          title="Instalar aplicación MultiOficios en tu dispositivo"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-xs hover:shadow-md transition cursor-pointer shrink-0 active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="inline">Instalar</span>
          <span className="hidden sm:inline">App</span>
          <Download className="w-3 h-3 opacity-80 shrink-0" />
        </button>
      )}

      {/* 2. Top Banner */}
      {variant === 'banner' && !dismissedBanner && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white px-4 py-2.5 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shrink-0 font-black shadow-sm shadow-amber-500/30 animate-pulse">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-stone-100 flex items-center gap-1.5">
                <span>📲 Instala la App de MultiOficios en tu Celular</span>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold hidden sm:inline">PWA</span>
              </p>
              <p className="text-[11px] text-stone-300">
                {isInsideIframe 
                  ? 'Escanea el código QR o abre el enlace directo para instalar MultiOficios con su propio ícono.'
                  : 'Acceso rápido desde tu pantalla de inicio, alertas en tiempo real y modo sin conexión.'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition cursor-pointer shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar Ahora</span>
            </button>
            <button
              onClick={() => setDismissedBanner(true)}
              className="p-1.5 text-stone-400 hover:text-white transition cursor-pointer rounded-lg hover:bg-stone-800"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Floating Action Button on Mobile */}
      {variant === 'floating' && (
        <div className="sm:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={handleClick}
            type="button"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/40 border border-amber-400 cursor-pointer active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar App</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Step-by-Step Installation Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-center relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer bg-stone-100 hover:bg-stone-200 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Smartphone className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-stone-900 mb-1">
              Instalar MultiOficios en tu Celular
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Instálala como aplicación nativa con su propio ícono en la pantalla de inicio.
            </p>

            {/* CRITICAL CASE: Running inside AI Studio preview iframe */}
            {isInsideIframe ? (
              <div className="space-y-4 text-left text-xs mb-4">
                {/* Method 1: QR Code Scan (Easiest & Zero Errors) */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl p-4 text-stone-900">
                  <div className="flex items-center gap-2 font-black text-amber-900 mb-2">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>MÉTODO RÁPIDO: Escanea este Código QR con tu Teléfono</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mb-3">
                    Abre la cámara de tu celular (o Google Lens) y apunta a este código en tu pantalla. Tocas el enlace que aparece y se abrirá directamente en Chrome sin escribir ni buscar nada:
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Código QR para instalar MultiOficios" 
                        className="w-40 h-40 rounded-xl border border-stone-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400">
                        Cargando QR...
                      </div>
                    )}
                    <div className="space-y-2 text-[11px] text-stone-700 max-w-xs">
                      <div className="flex items-start gap-1.5 font-bold text-stone-900">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>1. Apunta con la cámara</span>
                      </div>
                      <div className="flex items-start gap-1.5 font-bold text-stone-900">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>2. Toca el botón amarillo o enlace que aparece</span>
                      </div>
                      <div className="flex items-start gap-1.5 font-bold text-stone-900">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>3. En Chrome, pulsa "Instalar MultiOficios"</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Explanation: Don't paste in Google Search! */}
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950 space-y-2.5">
                  <div className="flex items-start gap-2 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>⚠️ Evita pegar el enlace en el buscador de Google</span>
                  </div>
                  <p className="text-[11px] text-stone-700 leading-relaxed">
                    Si copias el enlace y lo pegas en el campo de búsqueda central de <b>Google (la barra con la lupa <Search className="w-3 h-3 inline text-stone-500" />)</b>, Google intentará buscarlo en la web y dirá <i>"No se han encontrado resultados"</i> porque es un enlace privado de desarrollo.
                  </p>
                  
                  <div className="bg-white p-3 rounded-xl border border-rose-200 text-[11px] space-y-1.5 text-stone-800">
                    <div className="font-bold flex items-center gap-1 text-emerald-700">
                      <ArrowUp className="w-4 h-4 text-emerald-600" />
                      <span>Forma correcta si lo abres manualmente:</span>
                    </div>
                    <p>
                      Debes pegarlo en la <b>Barra de Direcciones del Navegador</b> (la que está arriba del todo con el candado 🔒, donde dice <code>google.com</code>) y pulsar la tecla <b>"Ir" o la flecha azul (➜)</b> en tu teclado.
                    </p>
                  </div>
                </div>

                {/* Copy link option */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                  <p className="font-bold text-stone-900 text-[11px]">
                    Enlace directo de la aplicación:
                  </p>
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                    <code className="text-[10px] text-stone-800 font-mono break-all truncate">
                      {directAppUrl}
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-[10px] shrink-0 flex items-center gap-1 cursor-pointer transition active:scale-95"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar URL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <a
                    href={directAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en Pestaña Nueva de tu Navegador</span>
                  </a>
                </div>

                {/* Note about Hostinger */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900">
                  <span className="font-bold">Recuerda: </span>
                  Cuando despliegues en tu dominio propio en Hostinger (ej: <code>multioficios.com</code>), este paso no existirá. Los usuarios solo entrarán a tu dominio y el botón de instalar funcionará directo en 1 clic.
                </div>
              </div>
            ) : (
              /* STANDALONE TAB: Direct instructions for Android/iOS */
              <div className="space-y-3.5 text-left text-xs mb-5">
                {/* Case: In-App Browser (Internal Browser / Social Apps) */}
                {isInAppBrowser && (
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 space-y-2 text-rose-900">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700">
                      <ExternalLink className="w-4 h-4" />
                      <span>Navegador interno detectado</span>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      Toca los <b>3 puntos (⋮)</b> arriba y pulsa <b>"Abrir en Chrome"</b> o <b>"Abrir en navegador"</b> para habilitar la instalación directa.
                    </p>
                  </div>
                )}

                {/* Case: iOS Safari */}
                {isIOS && !isInAppBrowser && (
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 text-stone-700">
                    <div className="font-bold text-stone-900 text-center mb-1">
                      Pasos para iPhone / iPad (Safari)
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <div>Toca el botón <b>Compartir</b> <Share2 className="w-3.5 h-3.5 inline text-blue-600 mb-0.5" /> en Safari.</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <div>Desplaza y pulsa <b>"Añadir a la pantalla de inicio"</b> <PlusSquare className="w-3.5 h-3.5 inline text-stone-700 mb-0.5" />.</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <div>Pulsa <b>Añadir</b> arriba a la derecha. ¡Listo!</div>
                    </div>
                  </div>
                )}

                {/* Case: Android / Chrome / Samsung Internet */}
                {!isIOS && !isInAppBrowser && (
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 text-stone-700">
                    <div className="font-bold text-stone-900 text-center mb-1">
                      {isAndroid ? 'Pasos para Celulares Android' : 'Instalación en tu Navegador'}
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <div>
                        Toca el menú de <b>3 puntos (⋮)</b> <MoreVertical className="w-3.5 h-3.5 inline text-stone-700 mb-0.5" /> en la esquina superior derecha de tu navegador Chrome.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <div>
                        Pulsa la opción <b>"Agregar a la pantalla principal"</b> (o <b>"Instalar aplicación"</b>). <i>En la primera visita a cualquier PWA, Android siempre muestra "Agregar a la pantalla principal" para registrarla.</i>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <div>
                        Toca <b>Agregar / Instalar</b>. ¡El ícono de MultiOficios aparecerá en tu teléfono y se abrirá en pantalla completa como una app real!
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 mt-2">
                      <span className="font-bold">¿Por qué dice "Agregar a pantalla" y luego "Instalar"? </span>
                      Es el mecanismo nativo de Google Play y Chrome: primero registra el acceso en tu pantalla y de inmediato compila la aplicación nativa en tu teléfono.
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 justify-center bg-emerald-50 py-1.5 px-2 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>No ocupa memoria de Google Play ni App Store</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
