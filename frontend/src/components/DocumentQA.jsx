import { useRef, useState } from "react";

export default function DocumentQA() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      console.log("Selected file:", selectedFile.name);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Upload response:", data);

      if (res.ok && data.message) {
        setUploaded(true);
        alert("✅ Upload successful!");
      } else {
        alert("❌ Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload error. Check console.");
    }
  };

  const handleAsk = async () => {
    if (!question) return;

    setLoading(true);

    const res = await fetch("http://localhost:5000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Ask Questions from a PDF</h1>

      {/* Hidden file input */}
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Select File Button */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => fileInputRef.current.click()}
      >
        {file ? `📄 ${file.name}` : "📁 Select PDF Document"}
      </button>

      {/* Upload Button */}
      {file && (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleUpload}
        >
          Upload Document
        </button>
      )}

      {/* Ask Section */}
      {uploaded && (
        <>
          <textarea
            placeholder="Ask a question..."
            className="w-full border p-2 rounded"
            rows="3"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={handleAsk}
            disabled={!question || loading}
          >
            {loading ? "Thinking..." : "Get Answer"}
          </button>
        </>
      )}

      {answer && (
        <div className="bg-gray-100 p-4 border rounded">
          <strong>Answer:</strong>
          <p className="mt-2">{answer}</p>
        </div>
      )}
    </div>
  );
}
