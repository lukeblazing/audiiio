import React from "react";
import ReactStickyNotes from './components/react-sticky-notes';
import './app.scss';

function App() {
    return (
        <div className="app">
            <div className="app-body">
                <ReactStickyNotes
                    backgroundColor="#fefefe"
                    useCSS={true}
                    containerHeight={"400px"}
                />
            </div>
        </div>
    );
}

// Export the App component
export default App;
