(() => {
  const markets = {
    KE: { name: "Kenya", currency: "KES", locale: "en-KE", symbol: "KSh", demo: 2450, increment: 500 },
    US: { name: "United States", currency: "USD", locale: "en-US", symbol: "$", demo: 24.50, increment: 5 },
    GB: { name: "United Kingdom", currency: "GBP", locale: "en-GB", symbol: "£", demo: 24.50, increment: 5 },
    NG: { name: "Nigeria", currency: "NGN", locale: "en-NG", symbol: "₦", demo: 24500, increment: 5000 },
    ZA: { name: "South Africa", currency: "ZAR", locale: "en-ZA", symbol: "R", demo: 245, increment: 50 },
    AE: { name: "United Arab Emirates", currency: "AED", locale: "en-AE", symbol: "د.إ", demo: 90, increment: 20 },
    IN: { name: "India", currency: "INR", locale: "en-IN", symbol: "₹", demo: 2450, increment: 500 },
    FR: { name: "France", currency: "EUR", locale: "fr-FR", symbol: "€", demo: 24.50, increment: 5 }
  };
  const stored = (() => { try { return localStorage.getItem("pamoja-market") || "KE"; } catch { return "KE"; } })();
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const control = document.createElement("label");
  control.className = "market-switch";
  control.innerHTML = '<span>MARKET</span><select id="market-select" aria-label="Choose your country or market"></select>';
  const locationPill = topbar.querySelector(".location-pill");
  if (locationPill) locationPill.after(control); else topbar.prepend(control);
  const select = control.querySelector("select");
  Object.entries(markets).forEach(([code, market]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = market.name + " · " + market.currency;
    select.append(option);
  });
  select.value = markets[stored] ? stored : "KE";
  const walletTitle = document.querySelector(".wallet-card h2");
  const walletCountry = document.querySelector(".wallet-bottom span:last-child");
  const walletLabel = document.querySelector(".wallet-card>p");
  const moneyInputLabel = () => {
    const label = document.querySelector("#send-form label:nth-child(2)");
    if (label) label.firstChild.textContent = "Amount (" + markets[select.value].currency + ")";
  };
  window.PamojaMarket = { current: () => markets[select.value], balance: () => markets[select.value].demo, adjust: amount => { markets[select.value].demo = Math.max(0, markets[select.value].demo + amount); }, format: amount => markets[select.value].symbol + " " + Number(amount).toLocaleString(markets[select.value].locale, {minimumFractionDigits:2, maximumFractionDigits:2}) };
  function applyMarket(code) {
    const market = markets[code] || markets.KE;
    document.documentElement.dataset.market = code;
    document.documentElement.lang = code === "FR" ? "fr" : "en";
    if (walletTitle) walletTitle.innerHTML = market.symbol + " " + market.demo.toLocaleString(market.locale, {minimumFractionDigits:2, maximumFractionDigits:2});
    if (walletCountry) walletCountry.textContent = market.name.toUpperCase();
    if (walletLabel) walletLabel.textContent = "ILLUSTRATIVE DEMO BALANCE · " + market.currency;
    const area = document.querySelector("#manual-location");
    if (area) area.placeholder = code === "KE" ? "e.g. Mlolongo, Nairobi" : "Enter your city or area";
    const mapCaption = document.querySelector(".map-caption");
    if (mapCaption) mapCaption.textContent = market.name.toUpperCase() + " · SAMPLE MAP";
    const phone = document.querySelector('input[name="phone"]');
    if (phone) { phone.type = "tel"; phone.autocomplete = "tel"; phone.placeholder = "+ country code and number"; }
    moneyInputLabel();
    try { localStorage.setItem("pamoja-market", code); } catch {}
  }
  select.addEventListener("change", () => {
    applyMarket(select.value);
    const toast = document.querySelector("#toast");
    if (toast) { toast.textContent = "Market set to " + markets[select.value].name + ". Demo values are illustrative, not converted exchange rates."; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3200); }
  });
  applyMarket(select.value);
  document.addEventListener("click", () => setTimeout(moneyInputLabel, 0));
  document.addEventListener("submit", event => {
    const phone = event.target.querySelector('input[name="phone"]');
    if (phone) { phone.type = "tel"; phone.autocomplete = "tel"; phone.placeholder = "+ country code and number"; }
  }, true);
})();