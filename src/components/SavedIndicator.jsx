/**
 * Indicador visual temporal de "guardado".
 * Solo presentacional: el padre controla cuándo mostrar (show) y el mensaje.
 */
function SavedIndicator({ show = false, message = "✅ Cambios guardados automáticamente" }) {
  if (!show) return null;

  return (
    <div
      className="fixed top-4 right-4 z-10 px-3 py-2 bg-green-100 border border-green-300 text-green-800 rounded-full text-sm font-medium shadow-md animate-pulse"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

export default SavedIndicator;
