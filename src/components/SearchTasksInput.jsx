/**
 * Input controlado para filtrar tareas por texto.
 * El padre debe controlar cuándo mostrarlo (p. ej. solo si tasks.length > 1).
 */
function SearchTasksInput({ value, onChange, placeholder = 'Buscar tareas...' }) {
	return (
		<div className="mb-4">
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
				aria-label="Buscar tareas"
			/>
		</div>
	);
}

export default SearchTasksInput;
