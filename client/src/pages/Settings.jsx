import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function Settings() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data } = await api.get("/settings");
      setForm(data);
      setError("");
    } catch (err) {
      console.error("Settings load error:", err);

      setError(err.response?.data?.message || "Unable to load settings");
    }
  }

  async function save() {
    try {
      const { data } = await api.put("/settings", form);
      setForm(data);
      alert("Settings saved");
    } catch (err) {
      console.error("Settings save error:", err);

      alert(err.response?.data?.message || "Failed to save settings");
    }
  }

  if (!form) {
    return (
      <div className="bg-white rounded-2xl p-5 border max-w-2xl">
        {error ? (
          <div className="text-red-600 text-sm">{error}</div>
        ) : (
          <div className="text-gray-500 text-sm">Loading settings...</div>
        )}
      </div>
    );
  }

  const fields = [
    ["restaurantName", "Restaurant Name"],
    ["tagline", "Tagline"],
    ["address", "Address"],
    ["phone", "Phone"],
    ["gstin", "GSTIN"],
    ["fssai", "FSSAI License No."],
    ["upiId", "UPI ID"],
    ["defaultGst", "Default GST %"],
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border max-w-2xl">
      <h2 className="font-bold text-lg text-leafdark mb-4">
        Restaurant Settings
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([key, label]) => (
          <div key={key}>
            <label className="text-xs text-gray-500 block mb-1">{label}</label>
            <input
              value={form[key] || ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <button
        onClick={save}
        className="bg-leaf text-white px-5 py-2 rounded-lg text-sm font-semibold mt-5"
      >
        Save Details
      </button>
    </div>
  );
}
