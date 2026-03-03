import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ApiClientProvider } from "./ApiClientContext";

export default function App() {
  return (
    <ApiClientProvider>
      <RouterProvider router={router} />
    </ApiClientProvider>
  );
}
