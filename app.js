const DEFAULT_PRICES = {
  "Cabinet": 26000,
  "Aluminium": 28000,
  "Other": 0
};

const LOCAL_LOGO_URL = "logo.png";
const RAW_LOGO_URL = "https://raw.githubusercontent.com/ewkena2-ops/klever-proforma-generator/main/logo.png";
const CONFIG_LOGO_URL = "https://drive.google.com/uc?export=view&id=1t-dPbpxjtt3kdD_dYm3QkmZKf2Qt7M36";

const ROOMS = [
  "Modern Kitchen",
  "Traditional Kitchen",
  "Island",
  "Closet",
  "Wardrobe",
  "Vanity",
  "TV Unit",
  "Aluminium",
  "Open Shelf",
  "Shoe Rack",
  "Laundry",
  "Other"
];

const ITEM_TYPES = ["Cabinet", "Aluminium", "Other"];
const INSIDE_MATERIALS = ["Particle Board", "MDF", "HDF", "Solid Wood"];
const OUTSIDE_FINISHES = ["UV / HDF", "UV / Solid Wood", "Super Matt / HDF", "Super Matt / Solid Wood", "Laminate MDF", "Painted MDF"];
const QUALITY_LEVELS = ["High-End", "Premium", "Standard"];

const state = {
  prices: loadPrices(),
  items: []
};

state.items.push(createDefaultItem());

const els = {
  projectId: document.getElementById("projectId"),
  clientName: document.getElementById("clientName"),
  clientPhone: document.getElementById("clientPhone"),
  clientLocation: document.getElementById("clientLocation"),
  orderDate: document.getElementById("orderDate"),
  preparedBy: document.getElementById("preparedBy"),
  docType: document.getElementById("docType"),
  docStatus: document.getElementById("docStatus"),
  installationScope: document.getElementById("installationScope"),
  accessoryScope: document.getElementById("accessoryScope"),
  deliveryDays: document.getElementById("deliveryDays"),
  estimatedDeliveryDate: document.getElementById("estimatedDeliveryDate"),
  itemsBody: document.getElementById("itemsBody"),
  preview: document.getElementById("proformaPreview"),
  metricArea: document.getElementById("metricArea"),
  metricSubtotal: document.getElementById("metricSubtotal"),
  metricVat: document.getElementById("metricVat"),
  metricTotal: document.getElementById("metricTotal"),
  appLogo: document.getElementById("appLogo"),
  projectFileInput: document.getElementById("projectFileInput")
};

function init() {
  bindLogoFallback(els.appLogo, "app-logo-fallback", "KLEVER KUCHE");
  els.appLogo.src = LOCAL_LOGO_URL;
  els.orderDate.value = new Date().toISOString().slice(0, 10);
  document.getElementById("pdfBtn").textContent = getPdfButtonLabel();
  bindFormInputs();
  bindPreparedBy();
  bindPriceInputs();
  renderItems();
  renderPreview();
}

function bindPreparedBy() {
  const select = document.getElementById("preparedBy");
  const other = document.getElementById("preparedByOther");
  if (!select || !other) return;
  select.addEventListener("change", () => {
    const isOther = select.value === "__other__";
    other.style.display = isOther ? "" : "none";
    if (isOther) other.focus();
    renderPreview();
  });
  other.addEventListener("input", renderPreview);
}

function getPreparedBy() {
  const select = document.getElementById("preparedBy");
  const other = document.getElementById("preparedByOther");
  if (select && select.value === "__other__") return (other ? other.value.trim() : "") || "";
  return select ? select.value.trim() : "";
}

function bindPriceInputs() {
  ["Cabinet", "Aluminium", "Other"].forEach(type => {
    const input = document.getElementById("prices" + type);
    if (!input) return;
    input.value = state.prices[type] || 0;
    input.addEventListener("input", () => {
      state.prices[type] = toNumber(input.value);
      try { localStorage.setItem("kk_proforma_prices", JSON.stringify(state.prices)); } catch (e) {}
    });
  });
}

function bindLogoFallback(img, className, text) {
  if (!img) return;
  let fallbackIndex = 0;
  const fallbacks = [RAW_LOGO_URL, CONFIG_LOGO_URL];
  img.addEventListener("error", () => {
    if (fallbackIndex < fallbacks.length) {
      img.src = fallbacks[fallbackIndex];
      fallbackIndex++;
      return;
    }
    const fallback = document.createElement("div");
    fallback.className = className;
    fallback.textContent = text;
    img.replaceWith(fallback);
  });
}

function bindFormInputs() {
  [
    "projectId",
    "clientName",
    "clientPhone",
    "clientLocation",
    "orderDate",
    "preparedBy",
    "docType",
    "docStatus",
    "installationScope",
    "accessoryScope"
  ].forEach(id => document.getElementById(id).addEventListener("input", renderPreview));

  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("resetBtn").addEventListener("click", resetGenerator);
  document.getElementById("loadProjectBtn").addEventListener("click", () => els.projectFileInput.click());
  document.getElementById("pdfBtn").addEventListener("click", downloadPdf);
  document.getElementById("excelBtn").addEventListener("click", downloadExcelCsv);
  els.projectFileInput.addEventListener("change", loadProjectFile);
}

function loadPrices() {
  try {
    const saved = localStorage.getItem("kk_proforma_prices");
    if (saved) return Object.assign({}, DEFAULT_PRICES, JSON.parse(saved));
  } catch (e) {}
  return Object.assign({}, DEFAULT_PRICES);
}

function resetGenerator() {
  if (!confirm("Reset project fields and items?")) return;
  els.projectId.value = "";
  els.clientName.value = "";
  els.clientPhone.value = "+251";
  els.clientLocation.value = "Addis Ababa";
  els.orderDate.value = new Date().toISOString().slice(0, 10);
  els.preparedBy.value = "";
  const resetOther = document.getElementById("preparedByOther");
  if (resetOther) { resetOther.value = ""; resetOther.style.display = "none"; }
  els.docType.value = "Acknowledgement";
  els.docStatus.value = "Active";
  els.installationScope.value = "With Installation";
  els.accessoryScope.value = "With Accessories";
  els.deliveryDays.value = 0;
  els.estimatedDeliveryDate.value = "";
  state.items = [createDefaultItem()];
  renderItems();
  renderPreview();
}

function addItem() {
  state.items.push(createDefaultItem());
  renderItems();
  renderPreview();
}

function duplicateItem(index) {
  const item = state.items[index];
  if (!item) return;
  const copy = cloneItem(item);
  copy.nickname = nextDuplicateNickname(copy.nickname, copy.room);
  state.items.splice(index + 1, 0, copy);
  renderItems();
  renderPreview();
}

function createDefaultItem() {
  return {
    room: "Modern Kitchen",
    nickname: "",
    itemType: "Cabinet",
    description: defaultDescriptionForType("Cabinet"),
    insideMaterials: ["MDF"],
    outsideFinishes: [],
    quality: "High-End",
    qty: 1,
    area: 1,
    price: state.prices.Cabinet || DEFAULT_PRICES.Cabinet
  };
}

function cloneItem(item) {
  return {
    room: item.room,
    nickname: item.nickname || "",
    itemType: item.itemType || "Cabinet",
    description: item.description || defaultDescriptionForType(item.itemType || "Cabinet"),
    insideMaterials: getItemChoices(item, "insideMaterials"),
    outsideFinishes: getItemChoices(item, "outsideFinishes"),
    quality: item.quality || "High-End",
    qty: getItemQty(item),
    area: toNumber(item.area),
    price: toNumber(item.price)
  };
}

function nextDuplicateNickname(nickname, room) {
  const value = (nickname || "").toString().trim();
  if (!value) return `${room || "Item"} 2`;
  const match = value.match(/^(.*?)(\d+)$/);
  if (match) return `${match[1]}${Number(match[2]) + 1}`;
  return `${value} 2`;
}

function renderItems() {
  els.itemsBody.innerHTML = "";
  state.items.forEach((item, index) => {
    const cabinetItem = isCabinetItem(item);
    const tr = document.createElement("tr");
    tr.className = cabinetItem ? "" : "non-cabinet-row";
    tr.innerHTML = `
      <td data-label="Room">${selectHtml("room", ROOMS, item.room)}</td>
      <td data-label="Nickname"><input class="nickname" data-field="nickname" placeholder="Wardrobe 1" value="${escapeAttr(item.nickname || "")}"></td>
      <td data-label="Description"><input class="description" data-field="description" value="${escapeAttr(item.description)}"></td>
      <td data-label="Type">${selectHtml("itemType", ITEM_TYPES, item.itemType || "Cabinet")}</td>
      <td class="cabinet-only${cabinetItem ? "" : " empty"}" data-label="Inside Material">${cabinetItem ? choicePickerHtml(item, "insideMaterials", INSIDE_MATERIALS, "Inside material") : notApplicableHtml()}</td>
      <td class="cabinet-only${cabinetItem ? "" : " empty"}" data-label="Outside Finish">${cabinetItem ? choicePickerHtml(item, "outsideFinishes", OUTSIDE_FINISHES, "No outside finish") : notApplicableHtml()}</td>
      <td data-label="Quality">${selectHtml("quality", QUALITY_LEVELS, item.quality || "High-End")}</td>
      <td data-label="Qty"><input class="qty" data-field="qty" type="number" min="0" step="1" value="${Number(item.qty ?? 1)}"></td>
      <td data-label="Area m2"><input data-field="area" type="number" min="0" step="0.001" value="${Number(item.area || 0)}"></td>
      <td data-label="ETB/m2"><input data-field="price" type="number" min="0" step="1" value="${Number(item.price || 0)}"></td>
      <td class="row-total" data-label="Total">${money(rowTotal(item))}</td>
      <td class="row-actions" data-label="Actions">
        <button class="duplicate-row" type="button" aria-label="Duplicate row">Copy</button>
        <button class="remove-row" type="button" aria-label="Remove row">x</button>
      </td>
    `;

    tr.querySelectorAll("input, select").forEach(input => {
      input.addEventListener("input", event => updateItem(index, event.target));
    });
    tr.querySelector(".duplicate-row").addEventListener("click", () => duplicateItem(index));
    tr.querySelector(".remove-row").addEventListener("click", () => removeItem(index));
    els.itemsBody.appendChild(tr);
  });
  initChoicePickers();
}

let _choiceBackdrop = null;

function initChoicePickers() {
  document.querySelectorAll(".choice-picker").forEach(picker => {
    picker.addEventListener("toggle", function () {
      if (this.open) {
        closeAllChoicePickers(this);
        if (window.innerWidth > 760) positionChoiceDropdown(this);
        else showChoiceBackdrop(this);
      } else {
        resetChoiceDropdown(this);
        hideChoiceBackdrop();
      }
    });
  });
}

function closeAllChoicePickers(except) {
  document.querySelectorAll(".choice-picker[open]").forEach(other => {
    if (other !== except) {
      resetChoiceDropdown(other);
      other.removeAttribute("open");
    }
  });
}

function positionChoiceDropdown(picker) {
  const summary = picker.querySelector("summary");
  const options = picker.querySelector(".choice-options");
  if (!summary || !options) return;
  const rect = summary.getBoundingClientRect();
  options.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${rect.left}px;min-width:${Math.max(220, rect.width)}px;z-index:200;`;
}

function resetChoiceDropdown(picker) {
  const options = picker.querySelector(".choice-options");
  if (options) options.style.cssText = "";
}

function showChoiceBackdrop(picker) {
  hideChoiceBackdrop();
  _choiceBackdrop = document.createElement("div");
  _choiceBackdrop.className = "choice-sheet-backdrop";
  _choiceBackdrop.onclick = () => { picker.open = false; };
  document.body.appendChild(_choiceBackdrop);
}

function hideChoiceBackdrop() {
  if (_choiceBackdrop) { _choiceBackdrop.remove(); _choiceBackdrop = null; }
}

document.addEventListener("scroll", () => {
  document.querySelectorAll(".choice-picker[open]").forEach(picker => {
    resetChoiceDropdown(picker);
    picker.removeAttribute("open");
  });
  hideChoiceBackdrop();
}, true);

function selectHtml(field, options, value) {
  const opts = options.map(option => {
    const selected = option === value ? " selected" : "";
    return `<option${selected}>${escapeHtml(option)}</option>`;
  }).join("");
  return `<select data-field="${field}">${opts}</select>`;
}

function choicePickerHtml(item, field, optionsList, emptyLabel) {
  const selected = getItemChoices(item, field);
  const selectedLabel = selected.length ? selected.join(", ") : emptyLabel;
  const options = optionsList.map(option => {
    const checked = selected.includes(option) ? " checked" : "";
    return `
      <label class="choice-option">
        <input type="checkbox" data-field="${field}" data-option="${escapeAttr(option)}"${checked}>
        <span>${escapeHtml(option)}</span>
      </label>
    `;
  }).join("");

  return `
    <details class="choice-picker" data-empty="${escapeAttr(emptyLabel)}">
      <summary class="selected-choices">${escapeHtml(selectedLabel)}</summary>
      <div class="choice-options">${options}</div>
    </details>
  `;
}

function notApplicableHtml() {
  return `<span class="not-applicable">Not used</span>`;
}

function updateItem(index, input) {
  const field = input.dataset.field;
  const item = state.items[index];
  if (!item) return;

  if (field === "insideMaterials" || field === "outsideFinishes") {
    const option = input.dataset.option;
    const selected = new Set(getItemChoices(item, field));
    if (input.checked) selected.add(option);
    else selected.delete(option);
    item[field] = Array.from(selected);
    updateEntryRow(input, item);
    renderPreview();
    return;
  }

  if (field === "itemType") {
    const previousType = item.itemType || "Cabinet";
    const previousDescription = (item.description || "").toString().trim();
    item.itemType = input.value;
    if (!previousDescription || previousDescription === defaultDescriptionForType(previousType)) {
      item.description = defaultDescriptionForType(item.itemType);
    }
    item.price = state.prices[item.itemType] || DEFAULT_PRICES[item.itemType] || 0;
    renderItems();
    renderPreview();
    return;
  }

  if (field === "area" || field === "price" || field === "qty") {
    item[field] = toNumber(input.value);
  } else {
    item[field] = input.value;
  }

  updateEntryRow(input, item);
  renderPreview();
}

function updateEntryRow(input, item) {
  const row = input.closest("tr");
  if (!row) return;

  const totalCell = row.querySelector(".row-total");
  if (totalCell) totalCell.textContent = money(rowTotal(item));

  const picker = input.closest(".choice-picker");
  if (picker) {
    const selected = getItemChoices(item, input.dataset.field);
    const summary = picker.querySelector(".selected-choices");
    if (summary) summary.textContent = selected.length ? selected.join(", ") : picker.dataset.empty;
  }
}

function removeItem(index) {
  state.items.splice(index, 1);
  if (state.items.length === 0) addItem();
  renderItems();
  renderPreview();
}

function getDocData() {
  const subtotal = state.items.reduce((sum, item) => sum + rowTotal(item), 0);
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;
  const area = state.items.reduce((sum, item) => sum + rowArea(item), 0);
  const deliveryDays = calculateDeliveryDays(area);
  const estimatedDeliveryDate = calculateEstimatedDeliveryDate(els.orderDate.value, deliveryDays);
  return {
    projectId: els.projectId.value.trim() || "KK0001",
    clientName: els.clientName.value.trim() || "Client",
    clientPhone: els.clientPhone.value.trim(),
    clientLocation: els.clientLocation.value.trim(),
    orderDate: formatDate(els.orderDate.value),
    preparedBy: getPreparedBy() || "Sales",
    docType: els.docType.value,
    docStatus: els.docStatus.value,
    installationScope: els.installationScope.value,
    accessoryScope: els.accessoryScope.value,
    deliveryDays,
    estimatedDeliveryDate,
    subtotal,
    vat,
    total,
    area
  };
}

function renderPreview() {
  const data = getDocData();
  els.deliveryDays.value = data.deliveryDays;
  els.estimatedDeliveryDate.value = data.estimatedDeliveryDate;
  els.metricArea.textContent = `${data.area.toFixed(3)} m2`;
  els.metricSubtotal.textContent = money(data.subtotal);
  els.metricVat.textContent = money(data.vat);
  els.metricTotal.textContent = money(data.total);
  els.preview.innerHTML = proformaMarkup(data);
}

function isCancelledDoc(data) {
  return (data && data.docStatus === "Cancelled");
}

function proformaMarkup(data) {
  const cancelled = isCancelledDoc(data);
  const statusBadge = `<span class="doc-status ${cancelled ? "cancelled" : "active"}">${cancelled ? "Cancelled" : "Active"}</span>`;
  const rows = state.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(formatCategory(item))}</td>
      <td>${escapeHtml(formatItemDescription(item))}</td>
      <td>${escapeHtml(formatMaterialTextForDoc(item, data.docType))}</td>
      <td class="num">${formatQty(item)}</td>
      <td class="num">${toNumber(item.area).toFixed(3)}</td>
      <td class="num">${money(item.price)}</td>
      <td class="num">${money(rowTotal(item))}</td>
    </tr>
  `).join("");

  return `
    ${cancelled ? `<div class="cancelled-watermark">CANCELLED</div>` : ""}
    <header class="doc-header">
      <div>
        <div class="doc-title-line">
          <div class="doc-title">${escapeHtml(data.docType)}</div>
          ${statusBadge}
        </div>
        <div class="doc-sub">Proforma for ${escapeHtml(data.projectId)} | ${escapeHtml(data.orderDate)}</div>
        <div class="doc-address">Head Office & Showroom | +251 963 999 992/94/96<br>www.kleverkuche.com | Addis Ababa, Ethiopia</div>
      </div>
      <div class="brand"><img class="brand-logo" src="${LOCAL_LOGO_URL}" alt="Klever Kuche logo" onerror="if(!this.dataset.rawTried){this.dataset.rawTried='1';this.src='${RAW_LOGO_URL}'}else if(!this.dataset.configTried){this.dataset.configTried='1';this.src='${CONFIG_LOGO_URL}'}else{this.replaceWith(Object.assign(document.createElement('div'),{className:'brand-fallback',textContent:'KLEVER KUCHE'}))}"></div>
    </header>

    <section class="doc-section">
      <div class="doc-section-title">Project And Customer</div>
      <table class="doc-table">
        <tbody>
          <tr>
            <td class="label">Order Number</td>
            <td>${escapeHtml(data.projectId)}</td>
            <td class="label">Payment Terms</td>
            <td>50% advance after proforma approval. 50% balance on production.</td>
          </tr>
          <tr>
            <td class="label">Order Date</td>
            <td>${escapeHtml(data.orderDate)}</td>
            <td class="label">Delivery</td>
            <td>${data.deliveryDays} working days after final approval.</td>
          </tr>
          <tr>
            <td class="label">Sold To</td>
            <td>${escapeHtml(data.clientName)}</td>
            <td class="label">Ship To</td>
            <td>${escapeHtml(data.clientLocation)}</td>
          </tr>
          <tr>
            <td class="label">Phone</td>
            <td>${escapeHtml(data.clientPhone)}</td>
            <td class="label">Prepared By</td>
            <td>${escapeHtml(data.preparedBy)}</td>
          </tr>
          <tr>
            <td class="label">Installation</td>
            <td>${data.installationScope === "With Installation" ? "Included" : "Not Included"}</td>
            <td class="label">Accessories</td>
            <td>${data.accessoryScope === "With Accessories" ? "Included" : "Not Included"}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="doc-section">
      <div class="doc-section-title">Items</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Category</th>
            <th>Description</th>
            <th>Material</th>
            <th class="num">Qty</th>
            <th class="num">m2</th>
            <th class="num">ETB/m2</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="5"></td>
            <td class="num"><strong>${data.area.toFixed(3)}</strong></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="doc-section">
      <table class="doc-table totals-table">
        <tbody>
          <tr><td>Price (ETB)</td><td class="num">${money(data.subtotal)}</td></tr>
          <tr><td>VAT 15%</td><td class="num">${money(data.vat)}</td></tr>
          <tr><td>Total Price (ETB)</td><td class="num"><strong>${money(data.total)}</strong></td></tr>
        </tbody>
      </table>
    </section>

    <section class="doc-section">
      <table class="doc-table">
        <tbody>
          <tr>
            <td>Prepared By: ${escapeHtml(data.preparedBy)}</td>
            <td>Signature: ___________________</td>
            <td>Date: ________</td>
          </tr>
          <tr>
            <td>Approved By: Ephrata Assefa</td>
            <td>Signature: ___________________</td>
            <td>Date: ________</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="doc-section terms">
      <div class="doc-section-title">Terms And Conditions</div>
      ${cancelled ? `<p class="cancelled-note">This proforma has been cancelled and should not be used for production, payment, or delivery approval.</p>` : ""}
      <p><strong>Payment Terms</strong>A 50% advance payment is required upon approval of this proforma. The remaining 50% balance is payable at the production stage unless otherwise agreed in writing.</p>
      <p><strong>Scope of Work</strong>This proforma covers only the furniture, cabinetry, and project items listed in the line item table.</p>
      <p><strong>Installation</strong>${escapeHtml(formatInstallationTerms(data.installationScope))}</p>
      <p><strong>Accessories</strong>${escapeHtml(formatAccessoryTerms(data.accessoryScope))}</p>
      <p><strong>Exclusions</strong>Granite, marble, quartz, countertops, appliances, plumbing works, electrical works, civil works, site preparation, and any item not specifically listed in this proforma are not included.</p>
      <p><strong>Delivery Timeline</strong>The estimated delivery period begins after final design approval and advance payment confirmation.</p>
      <p><strong>Variations &amp; Amendments</strong>Any requested change must be submitted before final design approval. After final design approval, amendments or changes are not accepted under this proforma unless Klever Kuche issues and approves a separate written agreement.</p>
    </section>
  `;
}

function formatMaterialTextForDoc(item, docType) {
  const joinWord = docType === "Amendment" ? "and" : "or";
  const quality = formatQualityPrefix(item && item.quality);
  const itemType = getItemType(item);

  if (itemType === "Aluminium") {
    return `${quality ? `${quality} ` : ""}aluminium profile/frame material`;
  }

  if (itemType === "Other") {
    return `${quality ? `${quality} ` : ""}custom project item specification`;
  }

  const inside = getItemChoices(item, "insideMaterials");
  const finishes = getItemChoices(item, "outsideFinishes");
  const lead = `${quality ? `${quality} ` : ""}cabinet body`;
  const insideText = joinChoices(inside, joinWord);
  const finishText = joinChoices(finishes, joinWord);
  const finishNoun = finishes.length > 1 ? "finishes" : "finish";

  if (insideText && finishText) return `${lead} made from ${insideText} with ${finishText} ${finishNoun}`;
  if (insideText) return `${lead} made from ${insideText}`;
  if (finishText) return `${lead} with ${finishText} ${finishNoun}`;
  return lead;
}

function formatInstallationTerms(value) {
  return value === "Without Installation"
    ? "Installation, site fitting, and assembly labor are not included."
    : "Standard installation is included for the listed items only.";
}

function formatAccessoryTerms(value) {
  return value === "With Accessories"
    ? "Accessories are included only where specifically listed in the line items."
    : "Accessories and optional add-ons are not included.";
}

function formatItemDescription(item) {
  const description = (item && item.description ? item.description : "").toString().trim();
  if (description) return description;
  return defaultDescriptionForType(getItemType(item));
}

function defaultDescriptionForType(itemType) {
  if (itemType === "Aluminium") return "Aluminium profile/frame";
  if (itemType === "Other") return "Custom project item";
  return "Custom cabinet work";
}

function getItemType(item) {
  return (item && item.itemType ? item.itemType : "Cabinet").toString();
}

function isCabinetItem(item) {
  return getItemType(item) === "Cabinet";
}

function formatQualityPrefix(quality) {
  const value = (quality || "").toString().trim();
  if (!value) return "";
  if (/^high[-\s]?end$/i.test(value)) return "High-end";
  return value;
}

function joinChoices(values, joinWord) {
  const cleanValues = values.filter(Boolean);
  if (cleanValues.length === 0) return "";
  if (cleanValues.length === 1) return cleanValues[0];
  if (cleanValues.length === 2) return `${cleanValues[0]} ${joinWord} ${cleanValues[1]}`;
  return `${cleanValues.slice(0, -1).join(", ")} ${joinWord} ${cleanValues[cleanValues.length - 1]}`;
}

function formatCategory(item) {
  const nickname = (item && item.nickname ? item.nickname : "").toString().trim();
  const room = (item && item.room ? item.room : "").toString().trim() || "Project Item";
  return nickname ? `${room} - ${nickname}` : room;
}

function rowTotal(item) {
  return Math.round(rowArea(item) * toNumber(item.price));
}

function rowArea(item) {
  return toNumber(item.area) * getItemQty(item);
}

function getItemQty(item) {
  if (!item || item.qty === undefined || item.qty === null || item.qty === "") return 1;
  return Math.max(0, toNumber(item.qty));
}

function formatQty(item) {
  const qty = getItemQty(item);
  if (Number.isInteger(qty)) return String(qty);
  return qty.toFixed(2).replace(/\.?0+$/, "");
}

function calculateDeliveryDays(area) {
  const cleanArea = Math.max(0, toNumber(area));
  const baseDays =
    getStageDays("DESIGN", cleanArea) +
    getStageDays("PURCHASE", cleanArea) +
    getStageDays("PRODUCTION", cleanArea) +
    getStageDays("DELIVERY", cleanArea) +
    getStageDays("SITE_ASSEMBLY", cleanArea);
  return Math.ceil(baseDays * 1.25);
}

function getStageDays(stage, area) {
  switch (stage) {
    case "DESIGN": return Math.ceil(area / 10) || 1;
    case "PURCHASE": return 3;
    case "PRODUCTION": return Math.ceil(area / 60) || 1;
    case "DELIVERY": return 1;
    case "SITE_ASSEMBLY": return Math.ceil(area / 6) || 1;
    default: return 5;
  }
}

function calculateEstimatedDeliveryDate(orderDateValue, days) {
  const base = orderDateValue ? new Date(`${orderDateValue}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + Math.max(0, Math.round(toNumber(days))));
  return formatDisplayDate(base);
}

function getItemChoices(item, field) {
  if (!item) return [];
  if (Array.isArray(item[field])) return normalizeItemChoices(field, item[field]);
  if (field === "insideMaterials" && Array.isArray(item.materials)) {
    return normalizeItemChoices(field, item.materials);
  }
  if (field === "outsideFinishes" && Array.isArray(item.materials)) {
    return normalizeItemChoices(field, item.materials);
  }
  return [];
}

function normalizeItemChoices(field, values) {
  const allowed = field === "outsideFinishes" ? OUTSIDE_FINISHES : INSIDE_MATERIALS;
  return values
    .map(value => normalizeChoiceValue(field, value))
    .filter(value => value && allowed.includes(value));
}

function normalizeChoiceValue(field, value) {
  const text = String(value || "").trim();
  if (field !== "outsideFinishes") return text;
  if (text === "UV") return "UV / HDF";
  if (text === "Solid Matt" || text === "Super Matt") return "Super Matt / HDF";
  return text;
}

function toNumber(value) {
  const numberValue = Number(String(value || 0).replace(/,/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function money(value) {
  return `${Math.round(toNumber(value)).toLocaleString("en-US")} ETB`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return formatDisplayDate(date);
}

function formatDisplayDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function getProjectPayload() {
  const data = getDocData();
  return {
    app: "Klever Kuche Proforma Generator",
    version: 1,
    savedAt: new Date().toISOString(),
    fields: {
      projectId: els.projectId.value.trim() || "KK0001",
      clientName: els.clientName.value.trim() || "Client",
      clientPhone: els.clientPhone.value.trim(),
      clientLocation: els.clientLocation.value.trim(),
      orderDate: els.orderDate.value,
      preparedBy: getPreparedBy() || "Sales",
      docType: els.docType.value,
      docStatus: els.docStatus.value,
      installationScope: els.installationScope.value,
      accessoryScope: els.accessoryScope.value
    },
    totals: {
      deliveryDays: data.deliveryDays,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      area: data.area,
      subtotal: data.subtotal,
      vat: data.vat,
      total: data.total
    },
    items: state.items.map(projectItemPayload)
  };
}

function projectItemPayload(item) {
  return {
    room: item.room || "Other",
    nickname: item.nickname || "",
    itemType: getItemType(item),
    description: formatItemDescription(item),
    insideMaterials: getItemChoices(item, "insideMaterials"),
    outsideFinishes: getItemChoices(item, "outsideFinishes"),
    quality: item.quality || "High-End",
    qty: getItemQty(item),
    area: toNumber(item.area),
    price: toNumber(item.price)
  };
}

function loadProjectFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (isPdfFile(file)) {
    loadProjectFromPdf(file)
      .then(applyProjectPayload)
      .catch(error => {
        alert(`Could not load PDF proforma. ${error && error.message ? error.message : ""}`.trim());
      })
      .finally(() => { event.target.value = ""; });
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const payload = isCsvFile(file) ? projectPayloadFromCsv(text) : JSON.parse(text);
      applyProjectPayload(payload);
    } catch (error) {
      alert(`Could not load this proforma file. ${error && error.message ? error.message : ""}`.trim());
    } finally {
      event.target.value = "";
    }
  };
  reader.onerror = () => {
    alert("Could not read the selected proforma file.");
    event.target.value = "";
  };
  reader.readAsText(file);
}

function isCsvFile(file) {
  return /\.csv$/i.test(file.name || "") || /csv/i.test(file.type || "");
}

function isPdfFile(file) {
  return /\.pdf$/i.test(file.name || "") || /pdf/i.test(file.type || "");
}

function loadProjectFromPdf(file) {
  if (!window.pdfjsLib) {
    return Promise.reject(new Error("PDF reader not loaded. Please refresh and try again."));
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  return file.arrayBuffer().then(buffer => {
    return pdfjsLib.getDocument({ data: buffer }).promise;
  }).then(pdfDoc => {
    return pdfDoc.getMetadata().then(meta => {
      const keywords = meta && meta.info && meta.info.Keywords;
      if (keywords && keywords.startsWith("KKDATA:")) {
        try {
          const json = decodeURIComponent(escape(atob(keywords.slice(7))));
          return JSON.parse(json);
        } catch (e) {}
      }
      return Promise.reject(new Error("This PDF was not generated by the Klever Kuche Proforma Generator, or was saved before this feature was added. Please use a JSON project file to reload editable data."));
    });
  });
}


function applyProjectPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("The file does not contain editable proforma data.");
  }

  const fields = payload.fields || payload.project || payload;
  els.projectId.value = textOrFallback(fields.projectId, "");
  els.clientName.value = textOrFallback(fields.clientName, "");
  els.clientPhone.value = textOrFallback(fields.clientPhone, "");
  els.clientLocation.value = textOrFallback(fields.clientLocation, "Addis Ababa");
  els.orderDate.value = toDateInputValue(fields.orderDate) || new Date().toISOString().slice(0, 10);
  const preparedByVal = textOrFallback(fields.preparedBy, "");
  const knownNames = ["", "Ephrata", "Tsega", "Bruktawit"];
  if (knownNames.includes(preparedByVal)) {
    els.preparedBy.value = preparedByVal;
    const otherInput = document.getElementById("preparedByOther");
    if (otherInput) { otherInput.value = ""; otherInput.style.display = "none"; }
  } else {
    els.preparedBy.value = "__other__";
    const otherInput = document.getElementById("preparedByOther");
    if (otherInput) { otherInput.value = preparedByVal; otherInput.style.display = ""; }
  }
  setSelectValue(els.docType, normalizeDocType(fields.docType), "Acknowledgement");
  setSelectValue(els.docStatus, normalizeDocStatus(fields.docStatus), "Active");
  setSelectValue(els.installationScope, normalizeInstallationScope(fields.installationScope), "With Installation");
  setSelectValue(els.accessoryScope, normalizeAccessoryScope(fields.accessoryScope), "Without Accessories");

  const loadedItems = Array.isArray(payload.items) ? payload.items.map(normalizeLoadedItem).filter(Boolean) : [];
  state.items = loadedItems.length ? loadedItems : [createDefaultItem()];
  renderItems();
  renderPreview();
}

function projectPayloadFromCsv(text) {
  const rows = parseCsv(text);
  const headerIndex = rows.findIndex(row => normalizeCsvLabel(row[0]) === "#" && row.some(cell => normalizeCsvLabel(cell) === "category"));
  if (headerIndex === -1) {
    throw new Error("No proforma item table was found.");
  }

  const fields = {};
  rows.slice(0, headerIndex).forEach(row => {
    const key = csvProjectFieldKey(row[0]);
    if (key) fields[key] = row[1] || "";
  });

  const headers = rows[headerIndex].map(normalizeCsvLabel);
  const col = label => headers.indexOf(normalizeCsvLabel(label));
  const valueAt = (row, label) => {
    const index = col(label);
    return index >= 0 ? row[index] : "";
  };

  const items = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const firstCell = normalizeCsvLabel(row[0]);
    if (!row.some(cell => String(cell || "").trim()) || firstCell === "total area" || firstCell === "price (etb)" || firstCell === "vat 15%" || firstCell === "total price (etb)") break;

    const categoryParts = splitCategory(valueAt(row, "Category"));
    const itemType = normalizeItemType(valueAt(row, "Type"));
    items.push({
      room: textOrFallback(valueAt(row, "Room"), categoryParts.room),
      nickname: textOrFallback(valueAt(row, "Nickname"), categoryParts.nickname),
      itemType,
      description: textOrFallback(valueAt(row, "Description"), defaultDescriptionForType(itemType)),
      insideMaterials: splitChoiceList(valueAt(row, "Inside Material")),
      outsideFinishes: splitChoiceList(valueAt(row, "Outside Finish")),
      quality: valueAt(row, "Quality"),
      qty: valueAt(row, "Qty"),
      area: valueAt(row, "Area m2"),
      price: valueAt(row, "ETB/m2")
    });
  }

  return { fields, items };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        cell += "\"";
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function csvProjectFieldKey(label) {
  switch (normalizeCsvLabel(label)) {
    case "document type": return "docType";
    case "document status": return "docStatus";
    case "installation": return "installationScope";
    case "accessories": return "accessoryScope";
    case "project id": return "projectId";
    case "client name": return "clientName";
    case "phone": return "clientPhone";
    case "location": return "clientLocation";
    case "order date": return "orderDate";
    case "prepared by": return "preparedBy";
    default: return "";
  }
}

function normalizeCsvLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeLoadedItem(item) {
  if (!item || typeof item !== "object") return null;

  const itemType = normalizeItemType(item.itemType || item.type);
  const hasPrice = item.price !== undefined && item.price !== null && item.price !== "";
  return {
    room: normalizeRoom(item.room),
    nickname: String(item.nickname || "").trim(),
    itemType,
    description: textOrFallback(item.description, defaultDescriptionForType(itemType)),
    insideMaterials: normalizeItemChoices("insideMaterials", choiceArray(item.insideMaterials || item.insideMaterial || item.materials)),
    outsideFinishes: normalizeItemChoices("outsideFinishes", choiceArray(item.outsideFinishes || item.outsideFinish || item.materials)),
    quality: normalizeQuality(item.quality),
    qty: item.qty === undefined || item.qty === null || item.qty === "" ? 1 : toNumber(item.qty),
    area: toNumber(item.area),
    price: hasPrice ? toNumber(item.price) : (state.prices[itemType] || DEFAULT_PRICES[itemType] || 0)
  };
}

function normalizeItemType(value) {
  const text = String(value || "").trim();
  if (ITEM_TYPES.includes(text)) return text;
  if (/aluminium/i.test(text)) return "Aluminium";
  if (/other|custom/i.test(text)) return "Other";
  return "Cabinet";
}

function normalizeRoom(value) {
  const text = String(value || "").trim();
  if (ROOMS.includes(text)) return text;
  return text ? "Other" : "Modern Kitchen";
}

function normalizeQuality(value) {
  const text = String(value || "").trim();
  if (/^high[-\s]?end$/i.test(text)) return "High-End";
  const match = QUALITY_LEVELS.find(level => level.toLowerCase() === text.toLowerCase());
  return match || "High-End";
}

function normalizeDocType(value) {
  const text = String(value || "");
  if (/amendment/i.test(text)) return "Amendment";
  if (/proforma/i.test(text)) return "Proforma";
  return "Acknowledgement";
}

function normalizeDocStatus(value) {
  return /^cancel/i.test(String(value || "")) ? "Cancelled" : "Active";
}

function normalizeInstallationScope(value) {
  return /without|no installation|not included/i.test(String(value || ""))
    ? "Without Installation"
    : "With Installation";
}

function normalizeAccessoryScope(value) {
  return /with accessories|included/i.test(String(value || "")) && !/without|not included/i.test(String(value || ""))
    ? "With Accessories"
    : "Without Accessories";
}

function choiceArray(value) {
  if (Array.isArray(value)) return value;
  return splitChoiceList(value);
}

function splitChoiceList(value) {
  return String(value || "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
}

function splitCategory(value) {
  const text = String(value || "").trim();
  const room = ROOMS.slice().sort((a, b) => b.length - a.length).find(option => text === option || text.startsWith(`${option} - `));
  if (!room) return { room: text ? "Other" : "Modern Kitchen", nickname: text };
  return {
    room,
    nickname: text === room ? "" : text.slice(room.length + 3).trim()
  };
}

function setSelectValue(select, value, fallback) {
  const target = value || fallback;
  const option = Array.from(select.options).find(item => item.value === target || item.textContent === target);
  select.value = option ? option.value : fallback;
}

function textOrFallback(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback || "";
}

function toDateInputValue(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const dateMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    return `${dateMatch[3]}-${month}-${day}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function findSafePageBreak(canvas, idealY, searchRange) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const limit = Math.max(0, idealY - searchRange);
  let bestY = idealY;
  let bestWhite = 0;
  for (let y = Math.min(idealY, canvas.height - 1); y > limit; y--) {
    const data = ctx.getImageData(0, y, width, 1).data;
    let white = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238) white++;
    }
    const ratio = white / width;
    if (ratio > 0.95) return y;
    if (ratio > bestWhite) { bestWhite = ratio; bestY = y; }
  }
  return bestWhite > 0.80 ? bestY : idealY;
}

function downloadPdf() {
  const data = getDocData();
  const filename = safeFileName(data.projectId) + "_proforma.pdf";
  const btn = document.getElementById("pdfBtn");
  const openInBrowser = shouldOpenPdfInBrowser();
  const pdfTarget = openInBrowser ? openPdfTargetWindow() : null;
  btn.disabled = true;
  btn.textContent = "Generating...";

  const element = document.getElementById("proformaPreview");

  // Snapshot the element at a fixed 794px width so html2canvas sees it correctly
  const saved = { width: element.style.width, transform: element.style.transform, boxShadow: element.style.boxShadow };
  element.style.width = "794px";
  element.style.transform = "none";
  element.style.boxShadow = "none";

  html2canvas(element, {
    scale: getPdfCanvasScale(),
    useCORS: true,
    allowTaint: true,
    logging: false,
    windowWidth: 794,
    scrollX: 0,
    scrollY: -window.scrollY
  }).then(canvas => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height / canvas.width) * imgW;

    // How many canvas pixels equal one PDF page height
    const pageHpx = Math.round((pageH / imgH) * canvas.height);

    // Find safe cut points (white rows between content) to avoid slicing through text
    const breaks = [0];
    let pos = pageHpx;
    while (pos < canvas.height) {
      breaks.push(findSafePageBreak(canvas, pos, 200));
      pos = breaks[breaks.length - 1] + pageHpx;
    }

    for (let i = 0; i < breaks.length; i++) {
      if (i > 0) pdf.addPage();
      const cutY = breaks[i];
      const nextCut = breaks[i + 1] !== undefined ? breaks[i + 1] : canvas.height;
      const sliceH = nextCut - cutY;
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      slice.getContext("2d").drawImage(canvas, 0, -cutY);
      const sliceImgH = (sliceH / canvas.width) * pageW;
      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, sliceImgH);
    }

    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(getProjectPayload()))));
      pdf.setProperties({ keywords: "KKDATA:" + encoded });
    } catch (e) {}
    finishPdfOutput(pdf, filename, pdfTarget, openInBrowser);
  }).catch(error => {
    if (pdfTarget && !pdfTarget.closed) pdfTarget.close();
    console.error(error);
    alert("Could not generate the PDF. Please try again.");
  }).finally(() => {
    element.style.width = saved.width;
    element.style.transform = saved.transform;
    element.style.boxShadow = saved.boxShadow;
    btn.disabled = false;
    btn.textContent = getPdfButtonLabel();
  });
}

function shouldOpenPdfInBrowser() {
  const nav = window.navigator || {};
  const userAgent = nav.userAgent || "";
  const platform = nav.platform || "";
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && nav.maxTouchPoints > 1);
}

function getPdfButtonLabel() {
  return shouldOpenPdfInBrowser() ? "Open PDF" : "Save PDF";
}

function getPdfCanvasScale() {
  return shouldOpenPdfInBrowser() ? 1.35 : 2;
}

function openPdfTargetWindow() {
  const target = window.open("", "_blank");
  if (!target) return null;
  target.document.write(`
    <!doctype html>
    <title>Generating PDF</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <body style="font-family: Arial, sans-serif; padding: 24px; color: #182033;">
      <strong>Generating PDF...</strong>
      <p style="margin-top: 8px;">The PDF will open here. Use Share to save or send it.</p>
    </body>
  `);
  target.document.close();
  return target;
}

function finishPdfOutput(pdf, filename, pdfTarget, openInBrowser) {
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);

  if (openInBrowser) {
    if (pdfTarget && !pdfTarget.closed) {
      pdfTarget.location.href = url;
    } else {
      // Pop-up was blocked — open PDF in the same tab; tap Back to return to the app
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return;
  }

  pdf.save(filename);
  URL.revokeObjectURL(url);
}

function downloadExcelCsv() {
  const data = getDocData();
  const rows = [
    ["Klever Kuche Proforma"],
    ["Document Type", data.docType],
    ["Document Status", data.docStatus],
    ["Installation", data.installationScope],
    ["Accessories", data.accessoryScope],
    ["Project ID", data.projectId],
    ["Client Name", data.clientName],
    ["Phone", data.clientPhone],
    ["Location", data.clientLocation],
    ["Order Date", data.orderDate],
    ["Prepared By", data.preparedBy],
    ["Delivery Days", data.deliveryDays],
    [],
    ["#", "Category", "Room", "Nickname", "Type", "Description", "Inside Material", "Outside Finish", "Quality", "Material Sentence", "Qty", "Area m2", "ETB/m2", "Total ETB"],
    ...state.items.map((item, index) => [
      index + 1,
      formatCategory(item),
      item.room || "",
      item.nickname || "",
      getItemType(item),
      formatItemDescription(item),
      isCabinetItem(item) ? formatChoiceList(item, "insideMaterials") : "",
      isCabinetItem(item) ? formatChoiceList(item, "outsideFinishes") : "",
      formatQualityPrefix(item.quality),
      formatMaterialTextForDoc(item, data.docType),
      formatQty(item),
      toNumber(item.area).toFixed(3),
      Math.round(toNumber(item.price)),
      rowTotal(item)
    ]),
    [],
    ["Total Area", data.area.toFixed(3)],
    ["Price (ETB)", data.subtotal],
    ["VAT 15%", data.vat],
    ["Total Price (ETB)", data.total]
  ];

  const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(data.projectId)}_proforma.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatChoiceList(item, field) {
  return getItemChoices(item, field).join(", ");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function getEmbeddedStyles() {
  let css = "";
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      Array.from(sheet.cssRules || []).forEach(rule => {
        css += `${rule.cssText}\n`;
      });
    } catch (e) {}
  });
  return css;
}

function safeFileName(value) {
  return String(value || "proforma").replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

init();
