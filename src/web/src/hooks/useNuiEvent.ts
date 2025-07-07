import { createEffect, createSignal, onCleanup } from "solid-js";
import { noop } from "../utils/misc"; // Assuming noop is a simple no-operation function

interface NuiMessageData<T = unknown> {
	action: string;
	data: T;
}

type NuiHandlerSignature<T> = (data: T) => void;

/**
 * A hook that manages event listeners for receiving data from the client scripts
 * @param action The specific `action` that should be listened for.
 * @param handler The callback function that will handle data relayed by this hook
 *
 * @example
 * useNuiEvent<{visibility: true, wasVisible: 'something'}>('setVisible', (data) => {
 * // whatever logic you want
 * })
 *
 **/
export const useNuiEvent = <T = unknown>(
	action: string,
	handler: NuiHandlerSignature<T>, // Directly use the handler from props
) => {
	// In Solid, we can directly capture the `handler` in a signal
	// if we need to ensure it's always the latest.
	// However, `createEffect` will re-run if `handler` (which is a prop) changes,
	// making the `savedHandler` signal mostly redundant here unless the handler
	// itself is a constantly changing reactive value from within the Solid component tree.
	// For simplicity and direct translation, we'll keep a similar pattern.
	const [savedHandler, setSavedHandler] =
		createSignal<NuiHandlerSignature<T>>(noop);

	// This effect ensures `savedHandler` always holds the latest `handler` prop.
	// Solid's createEffect will automatically re-run if `handler` (a prop) changes.
	createEffect(() => {
		setSavedHandler(() => handler); // Update the signal with the latest handler
	});

	// This effect handles the event listener setup and teardown.
	// It only re-runs if `action` changes (though usually, `action` would be static).
	createEffect(() => {
		const eventListener = (event: MessageEvent<NuiMessageData<T>>) => {
			const { action: eventAction, data } = event.data;

			// Access the current handler from the signal
			const currentHandler = savedHandler();

			if (currentHandler) {
				if (eventAction === action) {
					currentHandler(data);
				}
			}
		};

		window.addEventListener("message", eventListener);

		// `onCleanup` is Solid's equivalent of `useEffect`'s return function for cleanup
		onCleanup(() => {
			window.removeEventListener("message", eventListener);
		});
	}); // No dependencies array needed for createEffect as it automatically tracks signals/props used inside
};
