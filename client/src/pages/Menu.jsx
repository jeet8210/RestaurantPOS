import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    gst: 5,
  });
  const [newCat, setNewCat] = useState("");

  function load() {
    api.get("/products").then((r) => setProducts(r.data));
    api.get("/categories").then((r) => setCategories(r.data));
  }
  useEffect(load, []);

  async function addProduct() {
    if (!form.name || !form.price || !form.category)
      return alert("Fill all fields");
    await api.post("/products", form);
    setForm({ name: "", category: "", price: "", gst: 5 });
    load();
  }
  async function addCategory() {
    if (!newCat) return;
    await api.post("/categories", { name: newCat });
    setNewCat("");
    load();
  }
  async function deleteProduct(id) {
    if (!confirm("Delete this item?")) return;
    await api.delete(`/products/${id}`);
    load();
  }

  async function deleteCategory(id, name) {
    const itemsInCategory = products.filter((p) => p.category?._id === id);

    if (itemsInCategory.length > 0) {
      return alert(
        `"${name}" category cannot be deleted because ${itemsInCategory.length} menu item(s) are using it.`,
      );
    }

    if (!confirm(`Delete "${name}" category?`)) return;

    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete category");
    }
  }

  async function updateField(id, field, value) {
    await api.put(`/products/${id}`, { [field]: value });
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Menu Management</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Item name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm w-24"
        />
        <input
          placeholder="GST %"
          type="number"
          value={form.gst}
          onChange={(e) => setForm({ ...form, gst: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm w-20"
        />
        <button
          onClick={addProduct}
          className="bg-leaf text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          + Add Item
        </button>
      </div>

      <div className="mb-5 border-t pt-4">
        <div className="flex gap-2 mb-3">
          <input
            placeholder="New category"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <button
            onClick={addCategory}
            className="border border-leaf text-leaf px-4 py-2 rounded-lg text-sm font-semibold"
          >
            + Add Category
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c._id}
              className="flex items-center gap-2 bg-gray-100 border rounded-lg px-3 py-2"
            >
              <span className="text-sm font-medium">{c.name}</span>

              <button
                onClick={() => deleteCategory(c._id, c.name)}
                className="text-red-600 text-xs font-semibold hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b-2 border-black">
            <th className="py-2">Item</th>
            <th>Category</th>
            <th>Price</th>
            <th>GST %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-b">
              <td className="py-2">{p.name}</td>
              <td>
                <span className="bg-goldsoft text-leafdark text-xs px-2 py-0.5 rounded-full">
                  {p.category?.name}
                </span>
              </td>
              <td>
                <input
                  defaultValue={p.price}
                  onBlur={(e) =>
                    updateField(p._id, "price", parseFloat(e.target.value))
                  }
                  className="w-20 border rounded px-2 py-1 text-xs"
                />
              </td>
              <td>
                <input
                  defaultValue={p.gst}
                  onBlur={(e) =>
                    updateField(p._id, "gst", parseFloat(e.target.value))
                  }
                  className="w-16 border rounded px-2 py-1 text-xs"
                />
              </td>
              <td>
                <button
                  onClick={() => deleteProduct(p._id)}
                  className="text-red-600 text-xs font-semibold"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
