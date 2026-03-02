import { useState } from 'react';

/**
 * Hook que alterna un valor booleano.
 * @param {boolean} initial - Valor inicial
 * @returns {[boolean, () => void, () => void, () => void]}
 */

function useToggle(initial = false) {
	const [value, setValue] = useState(initial);

	return [value, () => setValue(!value), () => setValue(true), () => setValue(false)];
}

export default useToggle;