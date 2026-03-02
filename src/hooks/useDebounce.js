import { useEffect, useState } from 'react';

/**
 * Hook que devuelve una versión "debounced" de un valor.
 * La actualización se retrasa hasta que el valor permanece estable
 * durante el número de milisegundos indicado por `delay`.
 *
 * Esto es útil, por ejemplo, para búsquedas: evitamos lanzar
 * filtrados o peticiones en cada tecla y solo reaccionamos cuando
 * la persona deja de escribir un momento.
 *
 * @param {string} value - Valor de entrada (p. ej. searchTerm)
 * @param {number} delay - Retardo en ms antes de propagar el cambio
 * @returns {string} - Valor debounced
 */
function useDebounce(value, delay = 300) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		// Programamos una actualización futura del valor debounced.
		const timerId = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Cleanup: si `value` o `delay` cambian antes de que se cumpla
		// el timeout, cancelamos el anterior. Así solo se ejecuta el último.
		return () => clearTimeout(timerId);
	}, [value, delay]);

	return debouncedValue;
}

export default useDebounce;

