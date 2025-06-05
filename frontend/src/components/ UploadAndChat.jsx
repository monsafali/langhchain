// 📁 frontend/src/components/UploadAndChat.jsx
import React, { useState } from "react";
import axios from "axios";

const UploadAndChat = () => {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please upload a file first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  const askQuestion = async () => {
    if (!question) return;

    try {
      const res = await axios.post("http://localhost:5000/api/ask", {
        question,
      });
      setAnswer(res.data.answer);
    } catch (err) {
      console.error(err);
      alert("Failed to get answer.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧠 Document QA</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
      >
        Upload File
      </button>

      <div className="mt-6">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="border p-2 w-full mb-2"
        />
        <button
          onClick={askQuestion}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Ask
        </button>
      </div>

      {answer && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Answer:</h2>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default UploadAndChat;
