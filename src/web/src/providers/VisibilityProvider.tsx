import {
	createContext,
	useContext,
	createEffect,
	Accessor,
	Setter,
	ParentProps,
} from "solid-js";
import { useNuiEvent } from "../hooks/useNuiEvent";
import { fetchNui } from "../utils/fetchNui";
import { isEnvBrowser } from "../utils/misc";
import { createSignal } from "solid-js";

// Define the shape of the context value
interface VisibilityProviderValue {
	setVisible: Setter<boolean>; // Solid.js setter type
	visible: Accessor<boolean>; // Solid.js accessor type
}

// Create the context with a default null value
const VisibilityCtx = createContext<VisibilityProviderValue | null>(null);

// This should be mounted at the top level of your application, it is currently set to
// apply a CSS visibility value. If this is non-performant, this should be customized.
export const VisibilityProvider = (props: ParentProps) => {
	const [visible, setVisible] = createSignal(false);

	// useNuiEvent hook call remains the same assuming it's Solid.js compatible
	useNuiEvent<boolean>("setVisible", setVisible);

	// Handle pressing escape/backspace
	// createEffect is Solid's equivalent of useEffect for side effects
	createEffect(() => {
		// Solid's signals are reactive, so `visible()` will trigger the effect when it changes
		if (!visible()) return;

		const keyHandler = (e: KeyboardEvent) => {
			if (["Backspace", "Escape"].includes(e.code)) {
				if (!isEnvBrowser()) {
					fetchNui("hideFrame");
				} else {
					// Toggle visibility using the setter
					setVisible((prev) => !prev);
				}
			}
		};

		window.addEventListener("keydown", keyHandler);

		// Cleanup function for the effect
		return () => window.removeEventListener("keydown", keyHandler);
	}); // No dependency array needed for createEffect when signals are used directly

	return (
		<VisibilityCtx.Provider
			value={{
				visible, // Pass the signal accessor
				setVisible, // Pass the signal setter
			}}
		>
			<div
				style={{
					visibility: visible() ? "visible" : "hidden",
					height: "100%",
				}}
			>
				{props.children}
			</div>
		</VisibilityCtx.Provider>
	);
};

export const useVisibility = () => {
	const context = useContext(VisibilityCtx);
	if (!context) {
		// It's good practice to throw an error if the context is used outside its provider
		throw new Error("useVisibility must be used within a VisibilityProvider");
	}
	return context;
};
