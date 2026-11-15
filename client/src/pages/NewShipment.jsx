import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { Layout, TopBar } from "../components/Layout.jsx";
import { generateParcelLabelPdf } from "../lib/pdfGenerator.js";
import { C, Btn, Spinner } from "../components/ui.jsx";

const SECTION = ({ num, title, children }) => (
  <div
    style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 24,
    }}
  >
    <h2
      style={{
        fontSize: 15,
        fontWeight: 600,
        margin: "0 0 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: C.blue,
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {num}
      </span>
      {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, required, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>
      {label}
      {required && <span style={{ color: C.red }}> *</span>}
    </label>
    {children}
  </div>
);

const inputStyle = {
  padding: "9px 12px",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
};

const selectStyle = { ...inputStyle, background: "#fff", cursor: "pointer" };

export default function NewShipment() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  const [form, setForm] = useState({
    customer_id: "",
    customer_name: "",
    receiver_name: "",
    receiver_phone: "",
    destination: "Kano",
    parcel_type: "Personal Items",
    quantity: 1,
    weight: "",
    declared_value: "",
    description: "",
    notes: "",
    total_amount: "",
    amount_paid: "",
    payment_method: "Cash",
  });
  
  

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomers([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get(`/customers?search=${customerSearch}&limit=6`)
        .then((r) => setCustomers(r.data.customers))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const balance =
    (parseFloat(form.total_amount) || 0) - (parseFloat(form.amount_paid) || 0);

  const validate = () => {
    const e = {};
    if (!form.customer_id) e.customer = "Select a customer";
    if (!form.receiver_name) e.receiver_name = "Required";
    if (!form.receiver_phone) e.receiver_phone = "Required";
    if (!form.weight) e.weight = "Required";
    if (!form.total_amount) e.total_amount = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const [createdParcel, setCreatedParcel] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach((p) => fd.append("photos", p));
      const res = await api.post("/parcels", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCreatedParcel(res.data);
      setSuccess(res.data.tracking_id);
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || "Failed to create shipment",
      });
    } finally {
      setSaving(false);
    }
  };

  if (success)
    return (
      <Layout>
        <div
          style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <i
              className="ti ti-circle-check"
              style={{ fontSize: 44, color: C.green }}
            />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
            Shipment Created!
          </h2>
          <p style={{ color: C.muted, marginBottom: 8 }}>
            Tracking number assigned:
          </p>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 2,
              color: C.blue,
              fontFamily: "monospace",
              background: "#eff6ff",
              padding: "14px 24px",
              borderRadius: 10,
              display: "inline-block",
              marginBottom: 28,
            }}
          >
            {success}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Btn
              color="green"
              onClick={() =>
                generateParcelLabelPdf(
                  {
                     tracking_id: createdParcel.tracking_id,
                     destination: createdParcel.destination,
                     customer_name: createdParcel.customer_name,
                     recipient_name: createdParcel.receiver_name,
                     recipient_contact: createdParcel.receiver_phone,
                     total_weight: createdParcel.weight,
                     sack_code: createdParcel.sack_number,
                  },
                  "Admin"
                )
              }
            >
              <i className="ti ti-printer" />
              Print Label
            </Btn>
            <Btn
              color="green"
              onClick={() => {
                setSuccess(null);
                setForm({
                  customer_id: "",
                  customer_name: "",
                  receiver_name: "",
                  receiver_phone: "",
                  destination: "Kano",
                  parcel_type: "Personal Items",
                  quantity: 1,
                  weight: "",
                  declared_value: "",
                  description: "",
                  notes: "",
                  total_amount: "",
                  amount_paid: "",
                  payment_method: "Cash",
                });
                setPhotos([]);
              }}
            >
              <i className="ti ti-plus" /> New Shipment
            </Btn>
            <Btn
              variant="outline"
              color="blue"
              onClick={() => navigate(`/shipments/${success}`)}
            >
              <i className="ti ti-eye" /> View Parcel
            </Btn>
          </div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <TopBar
        title="New Shipment"
        subtitle="Register a new parcel for shipping"
      />
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Section 1 - Customer */}
            <SECTION num="1" title="Customer Information">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <Field label="Customer Name" required>
                  <div style={{ position: "relative" }}>
                    <input
                      value={
                        form.customer_id ? form.customer_name : customerSearch
                      }
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        set("customer_id", "");
                        set("customer_name", "");
                        setShowCustomerDrop(true);
                      }}
                      onFocus={() => setShowCustomerDrop(true)}
                      placeholder="Search customer by name or phone..."
                      style={{
                        ...inputStyle,
                        borderColor: errors.customer ? C.red : C.border,
                      }}
                    />
                    {form.customer_id && (
                      <button
                        type="button"
                        onClick={() => {
                          set("customer_id", "");
                          set("customer_name", "");
                          setCustomerSearch("");
                        }}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: C.muted,
                        }}
                      >
                        <i className="ti ti-x" />
                      </button>
                    )}
                    {showCustomerDrop &&
                      customers.length > 0 &&
                      !form.customer_id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: C.white,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            zIndex: 50,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            marginTop: 4,
                          }}
                        >
                          {customers.map((c) => (
                            <div
                              key={c.id}
                              onMouseDown={() => {
                                set("customer_id", c.id);
                                set("customer_name", c.name);
                                setCustomerSearch("");
                                setShowCustomerDrop(false);
                              }}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                borderBottom: `1px solid ${C.border}`,
                                fontSize: 13,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = C.lightGray)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "")
                              }
                            >
                              <div style={{ fontWeight: 600 }}>{c.name}</div>
                              <div style={{ color: C.muted, fontSize: 11 }}>
                                {c.phone} · {c.city}
                              </div>
                            </div>
                          ))}
                          <div
                            onMouseDown={() => {
                              setShowCustomerDrop(false);
                              navigate("/customers");
                            }}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              color: C.blue,
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            <i className="ti ti-plus" /> Add new customer
                          </div>
                        </div>
                      )}
                  </div>
                  {errors.customer && (
                    <span style={{ fontSize: 11, color: C.red }}>
                      {errors.customer}
                    </span>
                  )}
                </Field>
                <Field label="Customer Phone">
                  <input
                    value={
                      customers.find((c) => c.id == form.customer_id)?.phone ||
                      ""
                    }
                    readOnly
                    placeholder="Auto-filled from customer"
                    style={{ ...inputStyle, background: C.lightGray }}
                  />
                </Field>
              </div>
            </SECTION>

            {/* Section 2 - Receiver */}
            <SECTION num="2" title="Receiver Information">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <Field label="Receiver Name" required>
                  <input
                    value={form.receiver_name}
                    onChange={(e) => set("receiver_name", e.target.value)}
                    placeholder="Full name of the receiver"
                    style={{
                      ...inputStyle,
                      borderColor: errors.receiver_name ? C.red : C.border,
                    }}
                  />
                  {errors.receiver_name && (
                    <span style={{ fontSize: 11, color: C.red }}>
                      {errors.receiver_name}
                    </span>
                  )}
                </Field>
                <Field label="Receiver Phone" required>
                  <input
                    value={form.receiver_phone}
                    onChange={(e) => set("receiver_phone", e.target.value)}
                    placeholder="+234 801 234 5678"
                    style={{
                      ...inputStyle,
                      borderColor: errors.receiver_phone ? C.red : C.border,
                    }}
                  />
                  {errors.receiver_phone && (
                    <span style={{ fontSize: 11, color: C.red }}>
                      {errors.receiver_phone}
                    </span>
                  )}
                </Field>
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Destination" required>
                    <select
                      value={form.destination}
                      onChange={(e) => set("destination", e.target.value)}
                      style={selectStyle}
                    >
                      <option>Kano</option>
                      <option>Abuja</option>
                      <option>Lagos</option>
                    </select>
                  </Field>
                </div>
              </div>
            </SECTION>

            {/* Section 3 - Parcel */}
            <SECTION num="3" title="Parcel Information">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <Field label="Parcel Type" required>
                  <select
                    value={form.parcel_type}
                    onChange={(e) => set("parcel_type", e.target.value)}
                    style={selectStyle}
                  >
                    {[
                      "Personal Items",
                      "Electronics",
                      "Documents",
                      "Food Items",
                      "Clothing",
                      "Fragile Items",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity" required>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Weight (kg)" required>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.weight}
                    onChange={(e) => set("weight", e.target.value)}
                    placeholder="0.00"
                    style={{
                      ...inputStyle,
                      borderColor: errors.weight ? C.red : C.border,
                    }}
                  />
                  {errors.weight && (
                    <span style={{ fontSize: 11, color: C.red }}>
                      {errors.weight}
                    </span>
                  )}
                </Field>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <Field label="Declared Value (EGP)">
                  <input
                    type="number"
                    min="0"
                    value={form.declared_value}
                    onChange={(e) => set("declared_value", e.target.value)}
                    placeholder="0"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Description / Contents">
                  <input
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="e.g. Clothes, shoes, personal effects"
                    style={inputStyle}
                  />
                </Field>
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Notes (Optional)">
                    <input
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      placeholder="e.g. Handle with care, fragile"
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>

              {/* Photo upload */}
              <Field label="Add Photos (Optional)">
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 4,
                  }}
                >
                  {photos.map((file, i) => (
                    <div
                      key={i}
                      style={{ position: "relative", width: 76, height: 76 }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        style={{
                          width: 76,
                          height: 76,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos((p) => p.filter((_, j) => j !== i))
                        }
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: C.red,
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i className="ti ti-x" style={{ fontSize: 10 }} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <div
                      onClick={() => fileRef.current.click()}
                      style={{
                        width: 76,
                        height: 76,
                        border: `2px dashed ${C.border}`,
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        cursor: "pointer",
                        color: C.muted,
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = C.blue)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = C.border)
                      }
                    >
                      <i
                        className="ti ti-camera-plus"
                        style={{ fontSize: 20 }}
                      />
                      <span style={{ fontSize: 9, fontWeight: 500 }}>
                        Add Photo
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) =>
                      setPhotos((p) =>
                        [...p, ...Array.from(e.target.files)].slice(0, 5),
                      )
                    }
                  />
                </div>
              </Field>
            </SECTION>

            {/* Section 4 - Payment */}
            <SECTION num="4" title="Payment Information">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 14,
                }}
              >
                <Field label="Total Amount (EGP)" required>
                  <input
                    type="number"
                    min="0"
                    value={form.total_amount}
                    onChange={(e) => set("total_amount", e.target.value)}
                    placeholder="0"
                    style={{
                      ...inputStyle,
                      borderColor: errors.total_amount ? C.red : C.border,
                    }}
                  />
                  {errors.total_amount && (
                    <span style={{ fontSize: 11, color: C.red }}>
                      {errors.total_amount}
                    </span>
                  )}
                </Field>
                <Field label="Amount Paid (EGP)" required>
                  <input
                    type="number"
                    min="0"
                    value={form.amount_paid}
                    onChange={(e) => set("amount_paid", e.target.value)}
                    placeholder="0"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Balance (EGP)">
                  <input
                    value={isNaN(balance) ? "" : balance.toFixed(2)}
                    readOnly
                    style={{
                      ...inputStyle,
                      background: C.lightGray,
                      fontWeight: 700,
                      color: balance > 0 ? C.red : C.green,
                    }}
                  />
                </Field>
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Payment Method">
                    <select
                      value={form.payment_method}
                      onChange={(e) => set("payment_method", e.target.value)}
                      style={selectStyle}
                    >
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>Mobile Money</option>
                    </select>
                  </Field>
                </div>
              </div>

              {!isNaN(balance) && balance === 0 && form.total_amount && (
                <div
                  style={{
                    marginTop: 14,
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <i
                    className="ti ti-circle-check"
                    style={{ color: C.green, fontSize: 20 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#166534",
                      }}
                    >
                      Payment Complete
                    </div>
                    <div style={{ fontSize: 11, color: "#166534" }}>
                      No balance outstanding
                    </div>
                  </div>
                </div>
              )}
              {!isNaN(balance) && balance > 0 && form.total_amount && (
                <div
                  style={{
                    marginTop: 14,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <i
                    className="ti ti-alert-triangle"
                    style={{ color: C.orange, fontSize: 20 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#9a3412",
                      }}
                    >
                      Partial Payment
                    </div>
                    <div style={{ fontSize: 11, color: "#9a3412" }}>
                      Balance of EGP {balance.toFixed(2)} will be recorded
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div
                  style={{
                    marginTop: 14,
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: C.red,
                  }}
                >
                  <i className="ti ti-alert-circle" /> {errors.submit}
                </div>
              )}
            </SECTION>
          </div>

          {/* Right sidebar - Summary */}
          <div style={{ position: "sticky", top: 20 }}>
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 12,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>
                Shipment Summary
              </h2>
              {[
                {
                  icon: "ti-user",
                  label: "Customer",
                  value: form.customer_name || "—",
                },
                {
                  icon: "ti-map-pin",
                  label: "Destination",
                  value: form.destination,
                  color: C.blue,
                },
                {
                  icon: "ti-package",
                  label: "Parcel Type",
                  value: form.parcel_type,
                },
                {
                  icon: "ti-list-numbers",
                  label: "Quantity",
                  value: form.quantity || "—",
                },
                {
                  icon: "ti-weight",
                  label: "Weight",
                  value: form.weight ? `${form.weight} kg` : "—",
                },
                {
                  icon: "ti-currency-dollar",
                  label: "Declared Value",
                  value: form.declared_value
                    ? `EGP ${parseFloat(form.declared_value).toLocaleString()}`
                    : "—",
                },
                {
                  icon: "ti-tag",
                  label: "Total Amount",
                  value: form.total_amount
                    ? `EGP ${parseFloat(form.total_amount).toLocaleString()}`
                    : "—",
                },
                {
                  icon: "ti-cash",
                  label: "Amount Paid",
                  value: form.amount_paid
                    ? `EGP ${parseFloat(form.amount_paid).toLocaleString()}`
                    : "—",
                },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.border}`,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: C.muted,
                    }}
                  >
                    <i className={`ti ${r.icon}`} style={{ fontSize: 14 }} />
                    {r.label}
                  </div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: r.color || C.text,
                      maxWidth: 140,
                      textAlign: "right",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>Balance</span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 20,
                    color:
                      !isNaN(balance) && balance === 0 && form.total_amount
                        ? C.green
                        : C.red,
                  }}
                >
                  EGP {isNaN(balance) ? "0" : balance.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: 12,
                  border: "none",
                  borderRadius: 8,
                  background: saving ? "#93c5fd" : C.blue,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <i
                      className="ti ti-loader-2"
                      style={{ animation: "spin 0.7s linear infinite" }}
                    />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-device-floppy" /> Save & Generate Label
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/shipments")}
                style={{
                  padding: 10,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.white,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: C.muted,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="ti ti-shield-check" style={{ color: C.green }} />
              All shipments are recorded and tracked in real-time
            </div>
          </div>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Layout>
  );
}
