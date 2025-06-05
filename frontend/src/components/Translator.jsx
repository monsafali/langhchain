// src/components/Translator.jsx
import { useState } from "react";

export default function Translator() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });

    const data = await res.json();
    setOutput(data.translation);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">English to Urdu Translator</h1>
      <textarea
        className="w-full border p-2 rounded"
        rows="4"
        placeholder="Enter English sentence..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleTranslate}
        disabled={loading}
      >
        {loading ? "Translating..." : "Translate"}
      </button>
      {output && (
        <div className="bg-gray-100 p-4 rounded border">
          <h2 className="font-semibold">Urdu Translation:</h2>
          <p className="mt-1 text-right font-noto">{output}</p>
        </div>
      )}
    </div>
  );
}
