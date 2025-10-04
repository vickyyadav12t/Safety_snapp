import React from "react";
import { Toaster } from "react-hot-toast";
import ImageUpload from "./components/ImageUpload";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <ImageUpload />
    </div>
  );
}

export default App;

