import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { QRCodeSVG } from "qrcode.react";

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});

  const [tableNo, setTableNo] = useState("");
  const [orderType, setOrderType] = useState("Dine In");
  const [waiter, setWaiter] = useState("");
  const [pax, setPax] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [gstMode, setGstMode] = useState("exclusive");
  const [serviceCharge, setServiceCharge] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [receipt, setReceipt] = useState(null);
  const [settings, setSettings] = useState(null);

  const [payMode, setPayMode] = useState("single");
  const [singleMode, setSingleMode] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");

  const [upiReference, setUpiReference] = useState("");
  const [cardReference, setCardReference] = useState("");

  const [upiId, setUpiId] = useState("");
  const [restaurantName, setRestaurantName] = useState("My Restaurant");

  const [splitAmts, setSplitAmts] = useState({
    Cash: 0,
    UPI: 0,
    Card: 0,
  });

  const [heldBills, setHeldBills] = useState([]);
  const [showHeld, setShowHeld] = useState(false);

  const [reprintBillNo, setReprintBillNo] = useState("");

  const [splitCount, setSplitCount] = useState(2);
  const [showSplitInfo, setShowSplitInfo] = useState(false);

  const [resumeOrderId, setResumeOrderId] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadHeld();
    loadSettings();
  }, []);

  async function loadProducts() {
    const { data } = await api.get("/products");
    setProducts(data);
  }

  async function loadCategories() {
    const { data } = await api.get("/categories");
    setCategories(data);
  }

  async function loadHeld() {
    const { data } = await api.get("/orders/held/list");
    setHeldBills(data);
  }
  async function loadSettings() {
    try {
      const { data } = await api.get("/settings");

      setUpiId(data.upiId || "");
      setRestaurantName(data.restaurantName || "My Restaurant");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  function addToCart(product) {
    setCart((current) => ({
      ...current,
      [product._id]: (current[product._id] || 0) + 1,
    }));
  }

  function changeQty(id, delta) {
    setCart((current) => {
      const next = {
        ...current,
        [id]: (current[id] || 0) + delta,
      };

      if (next[id] <= 0) {
        delete next[id];
      }

      return next;
    });
  }

  function removeFromCart(id) {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((p) => p._id === id);
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);

  const grossAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.qty,
    0,
  );

  let subtotal = grossAmount;
  let taxTotal = 0;

  if (gstMode === "exclusive") {
    taxTotal = cartItems.reduce(
      (sum, item) =>
        sum + Number(item.price) * item.qty * (Number(item.gst || 0) / 100),
      0,
    );
  } else {
    taxTotal = cartItems.reduce((sum, item) => {
      const rate = Number(item.gst || 0);
      const itemTotal = Number(item.price) * item.qty;

      if (rate <= 0) return sum;

      const taxableValue = itemTotal / (1 + rate / 100);

      return sum + (itemTotal - taxableValue);
    }, 0);

    subtotal = grossAmount - taxTotal;
  }

  const cgst = taxTotal / 2;
  const sgst = taxTotal / 2;

  const discountValue = Number(discount) || 0;

  const discountAmt =
    discountType === "percent"
      ? (grossAmount * discountValue) / 100
      : discountValue;

  const serviceChargeAmt = Number(serviceCharge) || 0;

  const grandTotal =
    grossAmount +
    (gstMode === "exclusive" ? taxTotal : 0) -
    discountAmt +
    serviceChargeAmt;

  const splitPerPerson = splitCount > 0 ? grandTotal / splitCount : 0;

  const cashReceivedAmt = Number(cashReceived) || 0;

  const cashChange =
    singleMode === "Cash" ? Math.max(cashReceivedAmt - grandTotal, 0) : 0;

  const cashDue =
    singleMode === "Cash" ? Math.max(grandTotal - cashReceivedAmt, 0) : 0;

  const splitPaymentTotal = Object.values(splitAmts).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );

  const splitPaymentDifference = grandTotal - splitPaymentTotal;

  const splitPaymentComplete =
    splitPaymentTotal > 0 && Math.abs(splitPaymentDifference) < 0.01;

  const paymentComplete =
    payMode === "split"
      ? splitPaymentComplete
      : singleMode === "Cash"
        ? cashReceivedAmt >= grandTotal
        : true;

  function resetForm() {
    setCart({});
    setDiscount(0);
    setServiceCharge(0);
    setCustomerPhone("");
    setCustomerName("");
    setDiscountType("amount");
    setGstMode("exclusive");
    setTableNo("");
    setWaiter("");
    setPax(1);

    setSplitAmts({
      Cash: 0,
      UPI: 0,
      Card: 0,
    });

    setSingleMode("Cash");
    setPayMode("single");
    setCashReceived("");
    setUpiReference("");
    setCardReference("");
    setResumeOrderId(null);
  }

  function buildPayments() {
    if (payMode === "single") {
      return [
        {
          mode: singleMode,
          amount: grandTotal,
          reference:
            singleMode === "UPI"
              ? upiReference
              : singleMode === "Card"
                ? cardReference
                : "",
        },
      ];
    }

    return Object.entries(splitAmts)
      .filter(([, value]) => Number(value) > 0)
      .map(([mode, amount]) => ({
        mode,
        amount: Number(amount),
        reference:
          mode === "UPI" ? upiReference : mode === "Card" ? cardReference : "",
      }));
  }

  async function generateBill() {
    if (cartItems.length === 0) return;

    if (payMode === "single" && singleMode === "Cash") {
      if (cashReceivedAmt < grandTotal) {
        alert(`Payment incomplete. ₹${cashDue.toFixed(2)} remaining.`);
        return;
      }
    }

    if (payMode === "split" && !splitPaymentComplete) {
      alert(`Split payment must equal ₹${grandTotal.toFixed(2)}.`);
      return;
    }

    if (payMode === "single" && singleMode === "UPI" && !upiReference.trim()) {
      alert("Please enter UPI transaction/reference number.");
      return;
    }

    if (
      payMode === "single" &&
      singleMode === "Card" &&
      !cardReference.trim()
    ) {
      alert("Please enter Card transaction/reference number.");
      return;
    }

    const payload = {
      items: cartItems.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        gst: item.gst,
        qty: item.qty,
      })),
      orderType,
      waiter,
      pax,
      discount: discountAmt,
      discountType,
      serviceCharge: serviceChargeAmt,
      customerName,
      customerPhone,
      gstMode,
      payments: buildPayments(),
    };

    let data;

    if (editingBillId) {
      // Existing bill me more items add/update
      const response = await api.put(`/orders/${editingBillId}/update-items`, {
        items: payload.items,
        payments: payload.payments,
      });

      data = response.data;
    } else {
      // NEW BILL
      const response = await api.post("/orders", payload);

      data = response.data;
    }

    setReceipt(data);
    setEditingBillId(null);
    resetForm();
  }

  async function holdBill() {
    if (cartItems.length === 0) return;

    const label = tableNo ? `Table ${tableNo}` : waiter || "Held Bill";

    const payload = {
      items: cartItems.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        gst: item.gst,
        qty: item.qty,
      })),
      orderType,
      waiter,
      pax,
      discount: discountAmt,
      serviceCharge: serviceChargeAmt,
      hold: true,
      heldLabel: label,
    };

    await api.post("/orders", payload);

    resetForm();
    loadHeld();
  }

  function resumeHeld(order) {
    const map = {};

    order.items.forEach((item) => {
      const product = products.find((p) => p.name === item.name);

      if (product) {
        map[product._id] = item.qty;
      }
    });

    setCart(map);
    setDiscount(order.discount || 0);
    setServiceCharge(order.serviceCharge || 0);
    setOrderType(order.orderType || "Dine In");
    setWaiter(order.waiter || "");
    setPax(order.pax || 1);

    setShowHeld(false);
    setResumeOrderId(order._id);
  }

  async function finalizeResumed() {
    const payload = {
      payments: buildPayments(),
      customerPhone,
    };

    const { data } = await api.put(`/orders/${resumeOrderId}/resume`, payload);

    setReceipt(data);
    resetForm();
    loadHeld();
  }

  async function doReprint() {
    if (!reprintBillNo) return;

    try {
      const { data } = await api.get(`/orders/reprint/${reprintBillNo}`);

      setReceipt(data);
    } catch (error) {
      alert("Bill number not found");
    }
  }

  function addMoreItemsToBill() {
    if (!receipt?._id) return;

    const map = {};

    receipt.items.forEach((item) => {
      const product = products.find(
        (p) => p._id === item.product || p.name === item.name,
      );

      if (product) {
        map[product._id] = item.qty;
      }
    });

    setCart(map);

    setTableNo(receipt.table || "");
    setOrderType(receipt.orderType || "Dine In");
    setWaiter(receipt.waiter || "");
    setPax(receipt.pax || 1);

    setDiscount(receipt.discount || 0);
    setServiceCharge(receipt.serviceCharge || 0);

    setCustomerName(receipt.customer?.name || "");
    setCustomerPhone(receipt.customer?.phone || "");

    setEditingBillId(receipt._id);

    setReceipt(null);
  }

  const visibleProducts = products
    .filter(
      (product) => activeCat === "All" || product.category?.name === activeCat,
    )
    .filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()),
    );

  const upiQrValue =
    upiId && grandTotal > 0
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
          restaurantName,
        )}&am=${grandTotal.toFixed(2)}&cu=INR`
      : "";

  return (
    <div className="space-y-4">
      {/* ================= HEADER ================= */}
      <div className="bg-white border rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-leafdark">
              Restaurant Billing
            </h1>

            <p className="text-xs text-gray-500 mt-1">
              Create a new order, manage payments and generate bills
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <input
                placeholder="Enter bill no."
                value={reprintBillNo}
                onChange={(e) => setReprintBillNo(e.target.value)}
                className="w-40 border rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-leaf/20"
              />
            </div>

            <button
              onClick={doReprint}
              className="px-4 py-2 rounded-lg border border-leaf text-leaf text-xs font-semibold hover:bg-leaf hover:text-white transition"
            >
              Reprint
            </button>

            <button
              onClick={() => setShowHeld((value) => !value)}
              className="px-4 py-2 rounded-lg bg-gold text-white text-xs font-semibold hover:opacity-90 transition"
            >
              Held Bills
              {heldBills.length > 0 && (
                <span className="ml-2 bg-white text-gold rounded-full px-2 py-0.5">
                  {heldBills.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= HELD BILLS ================= */}
      {showHeld && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-leafdark">Held Bills</h3>

              <p className="text-xs text-gray-500">
                Resume previously held orders
              </p>
            </div>

            <button
              onClick={() => setShowHeld(false)}
              className="text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>

          {heldBills.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">
              No held bills.
            </div>
          ) : (
            <div className="space-y-2">
              {heldBills.map((order) => (
                <div
                  key={order._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-xl px-4 py-3 bg-ivory"
                >
                  <div>
                    <div className="font-semibold text-sm">
                      {order.heldLabel || "Held Bill"}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      {order.items.length} items
                      {" • "}₹{Number(order.grandTotal || 0).toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => resumeHeld(order)}
                    className="bg-leaf text-white px-4 py-2 rounded-lg text-xs font-semibold"
                  >
                    Resume Bill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MAIN POS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] gap-4">
        {/* ================= PRODUCTS ================= */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          {/* Search */}
          <div className="relative mb-4">
            <input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-xl pl-4 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-leaf/20"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
            {["All", ...categories.map((c) => c.name)].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCat(category)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-full
                  text-xs font-semibold border transition
                  ${
                    activeCat === category
                      ? "bg-leaf text-white border-leaf shadow-sm"
                      : "bg-ivory text-gray-600 hover:border-leaf hover:text-leaf"
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product count */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-bold text-sm text-leafdark">
                Menu Items
              </span>

              <span className="ml-2 text-xs text-gray-400">
                {visibleProducts.length} items
              </span>
            </div>

            {cartItems.length > 0 && (
              <span className="text-xs font-semibold text-leaf">
                {cartItems.reduce((sum, item) => sum + item.qty, 0)} items in
                cart
              </span>
            )}
          </div>

          {/* Products */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleProducts.map((product) => {
              const quantity = cart[product._id] || 0;

              return (
                <button
                  key={product._id}
                  onClick={() => addToCart(product)}
                  className="
                    text-left border rounded-2xl p-3
                    bg-ivory hover:bg-white
                    hover:border-gold hover:shadow-md
                    transition relative
                  "
                >
                  {quantity > 0 && (
                    <span className="absolute top-2 right-2 bg-leaf text-white text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center">
                      {quantity}
                    </span>
                  )}

                  <div className="text-[9px] uppercase tracking-wide text-gray-400 mb-1">
                    {product.category?.name}
                  </div>

                  <div className="font-bold text-sm text-leafdark min-h-[40px]">
                    {product.name}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-base font-bold text-leafdark">
                      ₹{Number(product.price).toFixed(2)}
                    </span>

                    <span className="text-[10px] bg-leaf text-white px-2 py-1 rounded-md">
                      + Add
                    </span>
                  </div>
                </button>
              );
            })}

            {visibleProducts.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-3xl mb-2">🍽️</div>

                <div className="font-semibold text-gray-500">
                  No items found
                </div>

                <div className="text-xs text-gray-400 mt-1">
                  Try another category or search term
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= CURRENT BILL ================= */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          {/* Bill Header */}
          <div className="bg-leafdark text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-70">
                  {resumeOrderId ? "HELD BILL" : "NEW ORDER"}
                </div>

                <h2 className="text-lg font-bold mt-0.5">
                  {resumeOrderId ? "Resume Order" : "Current Bill"}
                </h2>
              </div>

              {cartItems.length > 0 && (
                <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
                  <div className="text-[10px] opacity-70">ITEMS</div>

                  <div className="font-bold">
                    {cartItems.reduce((sum, item) => sum + item.qty, 0)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            {/* Order Details */}
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Order Details
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option>Dine In</option>
                  <option>Takeaway</option>
                  <option>Delivery</option>
                </select>

                <input
                  placeholder="Table No."
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-xs"
                />

                <input
                  placeholder="Waiter"
                  value={waiter}
                  onChange={(e) => setWaiter(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-xs"
                />

                <input
                  placeholder="Guests"
                  type="number"
                  min="1"
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-xs"
                />

                <input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-xs"
                />

                <input
                  placeholder="Customer phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Cart */}
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-ivory px-3 py-2 flex justify-between text-[10px] uppercase font-bold text-gray-500">
                <span>Item</span>
                <span>Amount</span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-3xl mb-2">🛒</div>

                    <div className="text-sm font-semibold text-gray-400">
                      Your bill is empty
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      Select items from the menu
                    </div>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item._id}
                      className="px-3 py-3 border-b last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {item.name}
                          </div>

                          <div className="text-[11px] text-gray-400 mt-0.5">
                            ₹{Number(item.price).toFixed(2)} each
                          </div>
                        </div>

                        <div className="font-bold text-sm">
                          ₹{(item.price * item.qty).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => changeQty(item._id, -1)}
                            className="w-7 h-7 border rounded-lg hover:bg-red-50 hover:text-red-600"
                          >
                            −
                          </button>

                          <span className="w-8 text-center text-xs font-bold">
                            {item.qty}
                          </span>

                          <button
                            onClick={() => changeQty(item._id, 1)}
                            className="w-7 h-7 border rounded-lg hover:bg-green-50 hover:text-green-600"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-[10px] text-red-500 font-semibold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Charges */}
            <div className="mt-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Charges & Adjustments
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Discount */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Discount
                  </label>

                  <div className="flex">
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full border rounded-l-lg px-3 py-2 text-xs"
                    />

                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="border border-l-0 rounded-r-lg px-2 text-xs bg-white"
                    >
                      <option value="amount">₹</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>

                {/* Service Charge */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Service Charge
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* GST MODE */}
            <div className="mt-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Tax Mode
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGstMode("exclusive")}
                  className={`py-2 rounded-lg text-xs font-bold border ${
                    gstMode === "exclusive"
                      ? "bg-leaf text-white border-leaf"
                      : "bg-white text-gray-500"
                  }`}
                >
                  GST Exclusive
                </button>

                <button
                  onClick={() => setGstMode("inclusive")}
                  className={`py-2 rounded-lg text-xs font-bold border ${
                    gstMode === "inclusive"
                      ? "bg-leaf text-white border-leaf"
                      : "bg-white text-gray-500"
                  }`}
                >
                  GST Inclusive
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 bg-ivory rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Taxable Value</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Sub Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>CGST</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>SGST</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>

              {serviceChargeAmt > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Service Charge</span>
                  <span>₹{serviceChargeAmt.toFixed(2)}</span>
                </div>
              )}

              {discountAmt > 0 && (
                <div className="flex justify-between text-xs text-red-600">
                  <span>Discount</span>
                  <span>−₹{discountAmt.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                <span className="font-bold text-sm">Grand Total</span>

                <span className="font-extrabold text-xl text-leafdark">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="mt-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Payment
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPayMode("single")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                    payMode === "single"
                      ? "bg-leaf text-white border-leaf"
                      : "bg-white text-gray-500"
                  }`}
                >
                  Single Payment
                </button>

                <button
                  onClick={() => setPayMode("split")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                    payMode === "split"
                      ? "bg-leaf text-white border-leaf"
                      : "bg-white text-gray-500"
                  }`}
                >
                  Split Payment
                </button>
              </div>

              {payMode === "single" ? (
                <div>
                  {/* PAYMENT METHODS */}
                  <div className="grid grid-cols-3 gap-2">
                    {["Cash", "UPI", "Card"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSingleMode(mode)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                          singleMode === mode
                            ? "bg-gold text-white border-gold shadow-sm"
                            : "bg-ivory text-gray-600 hover:border-gold"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* CASH PAYMENT */}
                  {singleMode === "Cash" && (
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        Cash Received
                      </label>

                      <input
                        type="number"
                        min="0"
                        placeholder="Enter amount received"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm font-semibold"
                      />

                      {cashReceivedAmt > 0 && (
                        <div className="mt-2 bg-ivory rounded-xl p-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Bill Total</span>

                            <span className="font-semibold">
                              ₹{grandTotal.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Cash Received</span>

                            <span className="font-semibold">
                              ₹{cashReceivedAmt.toFixed(2)}
                            </span>
                          </div>

                          {cashChange > 0 && (
                            <div className="flex justify-between text-sm font-bold text-green-700 border-t pt-2">
                              <span>Change Return</span>
                              <span>₹{cashChange.toFixed(2)}</span>
                            </div>
                          )}

                          {cashDue > 0 && (
                            <div className="flex justify-between text-sm font-bold text-red-600 border-t pt-2">
                              <span>Amount Due</span>
                              <span>₹{cashDue.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPI PAYMENT */}
                  {singleMode === "UPI" && (
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        UPI Transaction / Reference No.
                      </label>

                      <input
                        type="text"
                        placeholder="Enter UPI reference number"
                        value={upiReference}
                        onChange={(e) => setUpiReference(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm"
                      />
                    </div>
                  )}

                  {/* CARD PAYMENT */}
                  {singleMode === "Card" && (
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        Card Transaction / Reference No.
                      </label>

                      <input
                        type="text"
                        placeholder="Enter card reference number"
                        value={cardReference}
                        onChange={(e) => setCardReference(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {["Cash", "UPI", "Card"].map((mode) => (
                      <div key={mode}>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                          {mode}
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={splitAmts[mode]}
                          onChange={(e) =>
                            setSplitAmts({
                              ...splitAmts,
                              [mode]: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg px-2 py-2 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  {/* SPLIT PAYMENT SUMMARY */}

                  <div className="mt-3 bg-ivory rounded-xl p-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Bill Total</span>

                      <span className="font-bold">
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">Payment Entered</span>

                      <span className="font-bold">
                        ₹{splitPaymentTotal.toFixed(2)}
                      </span>
                    </div>

                    {splitPaymentDifference > 0.01 && (
                      <div className="flex justify-between text-sm font-bold text-red-600 border-t mt-2 pt-2">
                        <span>Amount Remaining</span>

                        <span>₹{splitPaymentDifference.toFixed(2)}</span>
                      </div>
                    )}

                    {splitPaymentDifference < -0.01 && (
                      <div className="flex justify-between text-sm font-bold text-red-600 border-t mt-2 pt-2">
                        <span>Amount Excess</span>

                        <span>
                          ₹{Math.abs(splitPaymentDifference).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {splitPaymentComplete && (
                      <div className="mt-2 text-sm font-bold text-green-700">
                        ✓ Payment matched
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Split Bill */}
            <div className="mt-4 border-t pt-3">
              <button
                onClick={() => setShowSplitInfo((value) => !value)}
                className="text-xs font-bold text-leaf hover:underline"
              >
                {showSplitInfo
                  ? "Hide Split Bill"
                  : "Split Bill Between People"}
              </button>

              {showSplitInfo && (
                <div className="mt-3 bg-ivory rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span>Split into</span>

                    <input
                      type="number"
                      min="2"
                      value={splitCount}
                      onChange={(e) =>
                        setSplitCount(parseInt(e.target.value) || 2)
                      }
                      className="w-16 border rounded-lg px-2 py-1.5"
                    />

                    <span>people</span>
                  </div>

                  <div className="mt-2 text-sm font-bold text-leafdark">
                    ₹{splitPerPerson.toFixed(2)}
                    <span className="text-xs text-gray-500 font-normal">
                      {" "}
                      per person
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              {resumeOrderId ? (
                <button
                  onClick={finalizeResumed}
                  className="w-full bg-leaf text-white py-3 rounded-xl font-bold text-sm hover:opacity-90"
                >
                  Finalize & Print
                </button>
              ) : (
                <>
                  <button
                    disabled={cartItems.length === 0 || !paymentComplete}
                    onClick={generateBill}
                    className="w-full bg-leaf text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {editingBillId ? "Update Bill" : "Generate Bill"}
                  </button>

                  <button
                    disabled={cartItems.length === 0}
                    onClick={holdBill}
                    className="w-full border-2 border-gold text-gold py-2.5 rounded-xl font-bold text-sm hover:bg-gold hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Hold Bill
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= PROFESSIONAL RECEIPT ================= */}
      {receipt && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setReceipt(null)}
        >
          <div
            className="print-receipt bg-white w-full max-w-[380px] max-h-[90vh] overflow-y-auto shadow-2xl rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* SCREEN HEADER */}
            <div className="no-print bg-leafdark text-white px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-wider opacity-70">
                  Bill Generated
                </div>

                <div className="font-bold text-base">
                  Bill #{receipt.billNo}
                </div>
              </div>

              <button
                onClick={() => setReceipt(null)}
                className="text-white/70 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {/* RECEIPT BODY */}
            <div className="receipt-body px-5 py-5 text-black">
              {/* RESTAURANT HEADER */}
              <div className="text-center border-b border-dashed border-gray-400 pb-3">
                <div className="text-xl font-extrabold uppercase">
                  {restaurantName || "Restaurant POS"}
                </div>

                <div className="text-[10px] mt-1">TAX INVOICE</div>

                <div className="text-[9px] text-gray-600 mt-2">
                  {receipt.orderType || "Dine In"}
                </div>
              </div>

              {/* BILL INFORMATION */}
              <div className="py-3 border-b border-dashed border-gray-400 text-[10px]">
                <div className="flex justify-between">
                  <span>Bill No.</span>
                  <strong>#{receipt.billNo}</strong>
                </div>

                <div className="flex justify-between mt-1">
                  <span>Date</span>
                  <span>
                    {receipt.createdAt
                      ? new Date(receipt.createdAt).toLocaleDateString("en-IN")
                      : new Date().toLocaleDateString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between mt-1">
                  <span>Time</span>
                  <span>
                    {receipt.createdAt
                      ? new Date(receipt.createdAt).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : new Date().toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </span>
                </div>

                {receipt.customer?.name && (
                  <div className="flex justify-between mt-1">
                    <span>Customer</span>
                    <span>{receipt.customer.name}</span>
                  </div>
                )}
              </div>

              {/* ITEMS HEADER */}
              <div className="py-2 border-b border-gray-300">
                <div className="grid grid-cols-[1fr_35px_75px] text-[9px] font-bold uppercase">
                  <span>Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Amount</span>
                </div>
              </div>

              {/* ITEMS */}
              <div className="py-2 border-b border-dashed border-gray-400">
                {receipt.items.map((item, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="grid grid-cols-[1fr_35px_75px] text-[10px]">
                      <span className="font-semibold pr-2">{item.name}</span>

                      <span className="text-center">{item.qty}</span>

                      <span className="text-right font-semibold">
                        ₹{(Number(item.price) * Number(item.qty)).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[8px] text-gray-500 mt-0.5">
                      ₹{Number(item.price).toFixed(2)} × {item.qty}
                      {" • "}GST {Number(item.gst || 0)}%
                    </div>
                  </div>
                ))}
              </div>

              {/* SUMMARY */}
              <div className="py-3 border-b border-gray-400 text-[10px] space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{Number(receipt.subtotal || 0).toFixed(2)}</span>
                </div>

                {Number(receipt.discount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>-₹{Number(receipt.discount).toFixed(2)}</span>
                  </div>
                )}

                {Number(receipt.cgst || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>CGST</span>
                    <span>₹{Number(receipt.cgst).toFixed(2)}</span>
                  </div>
                )}

                {Number(receipt.sgst || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>SGST</span>
                    <span>₹{Number(receipt.sgst).toFixed(2)}</span>
                  </div>
                )}

                {Number(receipt.serviceCharge || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span>₹{Number(receipt.serviceCharge).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* GRAND TOTAL */}
              <div className="py-3 border-b border-dashed border-gray-400">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-extrabold">GRAND TOTAL</span>

                  <span className="text-xl font-extrabold">
                    ₹{Number(receipt.grandTotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* PAYMENT */}
              <div className="py-3 border-b border-dashed border-gray-400 text-[10px]">
                <div className="flex justify-between">
                  <span>Payment Mode</span>

                  <strong>{receipt.paymentMode || "Cash"}</strong>
                </div>

                {(receipt.payments || []).map((payment, index) => (
                  <div
                    key={index}
                    className="flex justify-between mt-1 text-gray-600"
                  >
                    <span>{payment.mode}</span>

                    <span>₹{Number(payment.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* UPI QR */}
              {upiId && Number(receipt.grandTotal || 0) > 0 && (
                <div className="py-4 text-center border-b border-dashed border-gray-400">
                  <div className="text-[10px] font-bold mb-2">
                    SCAN & PAY VIA UPI
                  </div>

                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`upi://pay?pa=${encodeURIComponent(
                        upiId,
                      )}&pn=${encodeURIComponent(
                        restaurantName || "Restaurant POS",
                      )}&am=${Number(receipt.grandTotal).toFixed(2)}&cu=INR`}
                      size={135}
                      level="M"
                    />
                  </div>

                  <div className="text-[9px] mt-2">{upiId}</div>

                  <div className="text-[10px] font-bold mt-1">
                    ₹{Number(receipt.grandTotal).toFixed(2)}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="text-center pt-4">
                <div className="text-[10px] font-bold">Thank You!</div>

                <div className="text-[9px] text-gray-500 mt-1">
                  Please visit again
                </div>

                <div className="text-[8px] text-gray-400 mt-2">
                  Powered by RestaurantPOS
                </div>
              </div>

              {/* SCREEN BUTTONS */}
              <div className="no-print grid grid-cols-3 gap-2 mt-5">
                <button
                  onClick={addMoreItemsToBill}
                  className="border border-gold text-gold py-2.5 rounded-lg font-bold text-xs hover:bg-gold hover:text-white"
                >
                  Add More Items
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-leaf text-white py-2.5 rounded-lg font-bold text-sm"
                >
                  Print Receipt
                </button>

                <button
                  onClick={() => setReceipt(null)}
                  className="border border-gray-300 py-2.5 rounded-lg font-bold text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
