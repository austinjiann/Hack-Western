import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import Landing from "./pages/Landing";
import Canvas from "./pages/Canvas";

export default function App() {
  return (
    <Theme>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Canvas />} />
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}
