import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

const COMPANY = {
  name: "Cargo Tracker",
  tagline: "Egypt → Nigeria",
  logo: "/logo.png", // Place inside /public/logo.png
};

const DESTINATION_COLOURS = {
  Abuja: [0, 119, 237],
  Kano: [255, 140, 0],
  Kaduna: [46, 125, 50],
  Lagos: [128, 0, 128],
  Sokoto: [220, 53, 69],
  Default: [0, 119, 237],
};

async function generateBarcode(value) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");

    JsBarcode(canvas, value, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: false,
      margin: 0,
    });

    resolve(canvas.toDataURL("image/png"));
  });
}

async function generateQrCode(value) {
  return QRCode.toDataURL(value, {
    margin: 1,
    scale: 8,
    errorCorrectionLevel: "M",
  });
}

async function loadLogo() {
  return new Promise((resolve) => {
    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canavs");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => resolve(null);

    img.src = COMPANY.logo;
  });
}

function getDestinationColour(destination) {
  return DESTINATION_COLOURS[destination] || DESTINATION_COLOURS.Default;
}

function drawWrappedText(doc, text, x, y, width, lineHeight = 5) {
  const lines = doc.splitTextToSize(String(text || ""), width);
  doc.text(lines, x, y);

  return lines.length * lineHeight;
}

function drawDivider(doc, y, width) {
  doc.setDrawColor(220);

  doc.line(6, y, width - 6, y);
}

function drawBox(doc, x, y, w, h, fill = false) {
  doc.roundedRect(x, y, w, h, 2, 2, fill ? "FD" : "D");
}

async function drawHeader(doc, title) {
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(11, 31, 58);

  doc.rect(0, 0, W, 18, "F");

  const logo = await loadLogo();

  if (logo) {
    doc.addImage(logo, "PNG", 6, 3, 10, 10);
  }

  doc.setTextColor(255);

  doc.setFontSize(14);

  doc.setFont("helvetica", "bold");

  doc.text(title, 20, 11);

  doc.setFontSize(9);

  doc.setFont("helvetica", "normal");

  doc.text(COMPANY.tagline, W - 8, 11, {
    align: "right",
  });

  doc.setTextColor(0);
}

function drawFooter(doc, pageNumber) {
  const H = doc.internal.pageSize.getHeight();
  const W = doc.internal.pageSize.getWidth();

  doc.setFontSize(8);

  doc.setTextColor(120);

  doc.text(COMPANY.name, 8, H - 6);

  doc.text(`Page ${pageNumber}`, W - 8, H - 6, {
    align: "right",
  });
}

function drawPrintInfo(doc, operator = "System") {
  const now = new Date();

  const text = `Printed: ${now.toLocaleString()}\n` + `Operator: ${operator}`;

  doc.setFontSize(8);

  doc.setTextColor(90);

  doc.text(text, 14, doc.internal.pageSize.getHeight() - 20);

  doc.setTextColor(0);
}

function addPageNumbers(doc) {
  const total = doc.getNumberOfPages();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    const W = doc.internal.pageSize.getWidth();

    const H = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);

    doc.setTextColor(120);

    doc.text(`Page ${i} of ${total}`, W - 10, H - 8, {
      align: "right",
    });
  }
}

function drawSignatures(doc, y) {
  doc.setFontSize(9);

  doc.text("Prepared By", 18, y);

  doc.line(18, y + 12, 60, y + 12);

  doc.text("Checked By", 82, y);

  doc.line(82, y + 12, 124, y + 12);

  doc.text("Received By", 146, y);

  doc.line(146, y + 12, 190, y + 12);
}

export async function generateParcelLabelPdf(parcel, operator = "System") {
  const trackUrl = `${ORIGIN}/track/${parcel.tracking_id}`;

  const qrCode = await generateQrCode(trackUrl);
  const barcode = await generateBarcode(parcel.tracking_id);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a6",
    compress: true,
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ----------------------------
  // Outer Border
  // ----------------------------

  doc.setDrawColor(180);

  doc.roundedRect(2, 2, W - 4, H - 4, 2, 2);

  // ----------------------------
  // Header
  // ----------------------------

  await drawHeader(doc, COMPANY.name);

  // ----------------------------
  // Destination Badge
  // ----------------------------

  const colour = getDestinationColour(parcel.destination);

  doc.setFillColor(...colour);

  doc.roundedRect(8, 22, 28, 9, 2, 2, "F");

  doc.setTextColor(255);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(11);

  doc.text(String(parcel.destination).toUpperCase(), 22, 28, {
    align: "center",
  });

  doc.setTextColor(0);

  // ----------------------------
  // Tracking Title
  // ----------------------------

  doc.setTextColor(120);

  doc.setFontSize(8);

  doc.setFont("helvetica", "normal");

  doc.text("TRACKING NUMBER", 8, 38);

  // ----------------------------
  // Tracking Number
  // ----------------------------

  doc.setFontSize(17);

  doc.setFont("helvetica", "bold");

  doc.setTextColor(0);

  doc.text(parcel.tracking_id, 8, 45);

  // ----------------------------
  // Barcode
  // ----------------------------

  doc.addImage(barcode, "PNG", 8, 48, 65, 14);

  // ----------------------------
  // QR Code
  // ----------------------------

  doc.addImage(qrCode, "PNG", W - 42, 22, 34, 34);

  drawDivider(doc, 64, W);

  // ----------------------------
  // Recipient
  // ----------------------------

  let y = 70;

  doc.setFontSize(7);

  doc.setTextColor(120);

  doc.text("SHIP TO", 8, y);

  y += 5;

  doc.setFontSize(11);

  doc.setFont("helvetica", "bold");

  y += drawWrappedText(doc, parcel.recipient_name, 8, y, 65);

  doc.setFontSize(9);

  doc.setFont("helvetica", "normal");

  y += drawWrappedText(doc, parcel.recipient_contact, 8, y, 65);

  // ----------------------------
  // Sender
  // ----------------------------

  y += 4;

  doc.setFontSize(7);

  doc.setTextColor(120);

  doc.text("SHIP FROM", 8, y);

  y += 5;

  doc.setFontSize(9);

  doc.setTextColor(0);

  y += drawWrappedText(doc, parcel.customer_name, 8, y, 65);

  // ----------------------------
  // Info Box
  // ----------------------------

  y += 6;

  doc.setFillColor(248);

  doc.roundedRect(8, y, W - 16, 18, 2, 2, "F");

  doc.setFontSize(8);

  doc.setTextColor(80);

  doc.text("Weight", 12, y + 6);

  doc.text("Sack", 45, y + 6);

  doc.text("Status", 72, y + 6);

  doc.setFontSize(10);

  doc.setFont("helvetica", "bold");

  doc.setTextColor(0);

  doc.text(`${parcel.total_weight} kg`, 12, y + 13);

  doc.text(parcel.sack_code || "-", 45, y + 13);

  doc.text("Received", 72, y + 13);

  // ----------------------------
  // Instructions
  // ----------------------------

  y += 24;

  drawDivider(doc, y, W);

  y += 6;

  doc.setFontSize(7);

  doc.setTextColor(120);

  doc.text("Scan the QR code to track this shipment online.", W / 2, y, {
    align: "center",
  });

  y += 5;

  doc.text(`${ORIGIN}/track/${parcel.tracking_id}`, W / 2, y, {
    align: "center",
  });

  // ----------------------------
  // Print Information
  // ----------------------------

  drawPrintInfo(doc, operator);

  drawFooter(doc, 1);

  doc.save(`label-${parcel.tracking_id}.pdf`);
}

export async function generateSackManifestPdf(manifest, operator = "System") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const qr = await generateQrCode(
    `${ORIGIN}/track/${manifest.sack_code}?type=sack`,
  );

  let page = 1;

  await drawManifestHeader(doc, manifest, qr);

  let y = 84;

  drawManifestTableHeader(doc, y);

  y += 8;

  let totalWeight = 0;

  manifest.parcels.forEach((parcel, index) => {
    // New Page
    if (y > 270) {
      drawFooter(doc, page);

      doc.addPage();

      page++;

      drawManifestHeader(doc, manifest, qr, true);

      y = 30;

      drawManifestTableHeader(doc, y);

      y += 8;
    }

    totalWeight += Number(parcel.total_weight);

    drawManifestRow(doc, y, index + 1, parcel, index % 2 === 0);

    y += 8;
  });

  y += 6;

  drawManifestTotals(doc, y, manifest, totalWeight);

  y += 28;

  drawSignatures(doc, y);

  drawPrintInfo(doc, operator);

  drawFooter(doc, page);

  addPageNumbers(doc);

  doc.save(`manifest-${manifest.sack_code}.pdf`);
}

async function drawManifestHeader(doc, manifest, qr, continued = false) {
  await drawHeader(
    doc,
    continued ? "SACK MANIFEST (CONTINUED)" : "SACK MANIFEST",
  );

  const W = doc.internal.pageSize.getWidth();

  doc.addImage(qr, "PNG", W - 42, 24, 28, 28);

  doc.setFontSize(8);

  doc.setTextColor(120);

  doc.text("SACK CODE", 14, 28);

  doc.setFontSize(14);

  doc.setFont("helvetica", "bold");

  doc.setTextColor(0);

  doc.text(manifest.sack_code, 14, 36);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(10);

  doc.text(`Destination : ${manifest.destination}`, 14, 46);

  doc.text(`Status : ${manifest.status}`, 14, 53);

  doc.text(`Declared Weight : ${manifest.weight} kg`, 14, 60);

  doc.text(`Parcels : ${manifest.parcels.length}`, 14, 67);

  drawDivider(doc, 74, W);
}

function drawManifestTableHeader(doc, y) {
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(25, 32, 72);

  doc.rect(10, y - 5, W - 20, 8, "F");

  doc.setTextColor(255);

  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");

  doc.text("#", 14, y);

  doc.text("Tracking", 22, y);

  doc.text("Customer", 68, y);

  doc.text("Recipient", 120, y);

  doc.text("KG", W - 14, y, {
    align: "right",
  });

  doc.setTextColor(0);
}

function drawManifestRow(doc, y, index, parcel, shaded) {
  const W = doc.internal.pageSize.getWidth();

  if (shaded) {
    doc.setFillColor(248, 248, 248);

    doc.rect(10, y - 5, W - 20, 8, "F");
  }

  doc.setDrawColor(230);

  doc.rect(10, y - 5, W - 20, 8);

  doc.setFontSize(8);

  doc.setFont("helvetica", "normal");

  doc.text(String(index), 14, y);

  doc.text(String(parcel.tracking_id), 22, y);

  doc.text(doc.splitTextToSize(parcel.customer_name, 40)[0], 68, y);

  doc.text(doc.splitTextToSize(parcel.recipient_name, 40)[0], 120, y);

  doc.text(String(parcel.total_weight), W - 14, y, {
    align: "right",
  });
}

function drawManifestTotals(doc, y, manifest, totalWeight) {
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(245, 245, 245);

  doc.roundedRect(10, y, W - 20, 24, 2, 2, "F");

  doc.setFont("helvetica", "bold");

  doc.setFontSize(10);

  doc.text("SUMMARY", 16, y + 7);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(9);

  doc.text(`Destination : ${manifest.destination}`, 16, y + 14);

  doc.text(`Parcels : ${manifest.parcels.length}`, 80, y + 14);

  doc.text(`Calculated Weight : ${totalWeight} kg`, 140, y + 14);
}
