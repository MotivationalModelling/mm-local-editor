import {useEffect, useState} from "react";

// Define a generic type for the initial value
type InitialValueType<T> = T | (() => T);

const isEmptyObject = (obj: object) =>
  obj && typeof obj === "object" && Object.keys(obj).length === 0;

const resolveInitialValue = <T,>(initialValue: InitialValueType<T>): T =>
	initialValue instanceof Function ? initialValue() : initialValue;

const getStoredData = <T,>(
	key: string,
	initialValue: InitialValueType<T>
): T => {
	const storedData = localStorage.getItem(key);
	if (storedData === null) return resolveInitialValue(initialValue);

	let data: unknown;
	try {
		data = JSON.parse(storedData);
	} catch {
		localStorage.removeItem(key);
		return resolveInitialValue(initialValue);
	}

	if (data === null || (Array.isArray(data) && data.length === 0) || isEmptyObject(data as object)) {
		return resolveInitialValue(initialValue);
	}

	return data as T;
};

const useLocalStorage = <T,>(
	key: string,
	initialValue: InitialValueType<T>
): [T, React.Dispatch<React.SetStateAction<T>>] => {
	const [value, setValue] = useState(() => getStoredData(key, initialValue));

	// Auto save data to the local storage
	useEffect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
};

export default useLocalStorage;
