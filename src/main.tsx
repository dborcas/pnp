import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "./App";
import { store } from "./app/store";
import "./index.css";
import loadCacheWorker from "./load-cache-worker.ts";

loadCacheWorker();

const container = document.getElementById("root");

if (container) {
	const root = createRoot(container);
	
	const navi = ((window.navigator) as Partial<Nullable<Navigator>>);
	
	if (navi?.mediaDevices?.getUserMedia == null) {
		root.render(
		  <div className="App app-error">
			  <h1>ERROR</h1>
			  <p>
				  Your browser does not have the capabilities required to show picture-in-picture
			  </p>
		  </div>,
		);
	} else {
		root.render(
		  <StrictMode>
			  <Provider store={store}>
				  <App />
			  </Provider>
		  </StrictMode>,
		);
	}
} else {
	throw new Error(
	  "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
	);
}
