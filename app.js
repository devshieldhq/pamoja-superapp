const businesses = [
  {id:1,name:"Mama Njeri's Kitchen",category:"Food",detail:"Homemade Kenyan meals · Kilimani",rating:"4.9",price:"From KSh 250",emoji:"🍲",theme:"food",items:["Pilau & kachumbari — KSh 350","Beef stew & rice — KSh 400","Chapati & beans — KSh 250"]},
  {id:2,name:"Green Basket Grocers",category:"Groceries",detail:"Fresh produce · Westlands",rating:"4.8",price:"From KSh 100",emoji:"🥑",theme:"grocery",items:["Avocado pack — KSh 180","Fresh tomatoes — KSh 100","Fruit basket — KSh 650"]},
  {id:3,name:"Soko Streetwear",category:"Fashion",detail:"Local fashion · CBD",rating:"4.7",price:"From KSh 800",emoji:"👟",theme:"fashion",items:["Graphic tee — KSh 800","Canvas tote — KSh 500","Everyday cap — KSh 650"]},
  {id:4,name:"The Fresh Cut",category:"Services",detail:"Barber & grooming · Lavington",rating:"4.9",price:"From KSh 300",emoji:"✂️",theme:"service",items:["Haircut — KSh 500","Beard trim — KSh 300","Cut & wash — KSh 750"]},
  {id:5,name:"Kahawa Corner",category:"Food",detail:"Coffee & bites · Ngara",rating:"4.6",price:"From KSh 150",emoji:"☕",theme:"food",items:["Kenyan coffee — KSh 180","Mandazi & tea — KSh 150","Iced latte — KSh 320"]},
  {id:6,name:"Maua Studio",category:"Services",detail:"Flowers & gifts · Parklands",rating:"4.8",price:"From KSh 600",emoji:"💐",theme:"grocery",items:["Mini bouquet — KSh 600","Birthday bunch — KSh 1,500","Desk plant — KSh 850"]}
];
let orders = [];
let activeCategory = "All";
let balance = 2450;
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600)}
function showView(name){$$(".view").forEach(v=>v.classList.toggle("active",v.id===name+"-view"));$$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));window.scrollTo({top:0,behavior:"smooth"});if(name==="orders")renderOrders()}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
function businessCard(b){return `<article class="business-card"><div class="business-visual ${b.theme}"><span class="business-tag">${b.category}</span><span>${b.emoji}</span></div><div class="business-info"><h3>${b.name}</h3><p>${b.detail}</p><div class="business-foot"><span>★ ${b.rating} · ${b.price}</span><button data-order="${b.id}">View menu →</button></div></div></article>`}
function renderBusinesses(){const filtered=businesses.filter(b=>(activeCategory==="All"||b.category===activeCategory)&&(`${b.name} ${b.category} ${b.detail}`.toLowerCase().includes(($("#business-search")?.value||"").toLowerCase())));$("#discover-businesses").innerHTML=filtered.length?filtered.map(businessCard).join(""):'<div class="empty-state"><div>🔎</div><h2>No matches yet</h2><p>Try another search or category.</p></div>';$("#home-businesses").innerHTML=businesses.slice(0,3).map(businessCard).join("");}
function openModal(title,copy,icon,content){$("#modal-title").textContent=title;$("#modal-copy").textContent=copy;$("#modal-icon").textContent=icon;$("#modal-content").innerHTML=content;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modal-close").addEventListener("click",closeModal);$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
document.addEventListener("click",e=>{const btn=e.target.closest("[data-order]");if(!btn)return;const b=businesses.find(x=>x.id===Number(btn.dataset.order));openModal(b.name,"Choose an item to create a demo order request.",b.emoji,`<form id="order-form"><label>Choose an item<select name="item">${b.items.map((it,i)=>`<option value="${i}">${it}</option>`).join("")}</select></label><label>Your name<input name="customer" placeholder="e.g. Amina" required></label><label>Phone number<input name="phone" placeholder="07XX XXX XXX" required></label><button class="button button-dark">Send order request →</button></form>`);$("#order-form").addEventListener("submit",ev=>{ev.preventDefault();const fd=new FormData(ev.target);orders.unshift({business:b.name,item:b.items[Number(fd.get("item"))],customer:fd.get("customer"),date:new Date().toLocaleString()});closeModal();toast("Demo order request saved!");showView("orders")})});
$("#category-filters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;$$(".filter-chip").forEach(x=>x.classList.toggle("selected",x===b));renderBusinesses()});
$("#business-search").addEventListener("input",renderBusinesses);
function renderOrders(){$("#orders-empty").classList.toggle("hidden",orders.length>0);$("#order-list").innerHTML=orders.map(o=>`<div class="order-item"><div><b>${o.item} · ${o.business}</b><small>Requested by ${o.customer} · ${o.date}</small></div><span class="status-pill">Demo request</span></div>`).join("")}
$("#ride-form").addEventListener("submit",e=>{e.preventDefault();const pickup=$("#pickup").value.trim(),destination=$("#destination").value.trim(),type=$('input[name="ride-type"]:checked').value;$("#ride-result").classList.remove("hidden");$("#ride-result").innerHTML=`<b>Ride request preview</b><br>${type}: ${pickup} → ${destination}<br><small>This is a demo preview only. No driver has been contacted.</small>`;toast("Ride preview created")});
function moneyLabel(amount){return window.PamojaMarket?.format?window.PamojaMarket.format(amount):"KSh "+Number(amount).toLocaleString("en-KE",{minimumFractionDigits:2,maximumFractionDigits:2})}
function currentBalance(){return window.PamojaMarket?.balance?window.PamojaMarket.balance():balance}
function adjustBalance(amount){if(window.PamojaMarket?.adjust)window.PamojaMarket.adjust(amount);else balance+=amount}
function updateWallet(){const h=$(".wallet-card h2");h.textContent=moneyLabel(currentBalance())}
function addTransaction(title,amount,positive){const row=document.createElement("div");row.className="transaction";row.innerHTML=`<span class="transaction-icon">${positive?"＋":"↗"}</span><span><b>${title}</b><small>Just now · Demo transaction</small></span><strong class="${positive?"positive":""}">${positive?"+":"−"} ${moneyLabel(amount)}</strong>` ;$("#transaction-list").prepend(row)}
$("#add-money").addEventListener("click",()=>{adjustBalance(window.PamojaMarket?.current?.().increment||500);updateWallet();addTransaction("Demo wallet top-up",window.PamojaMarket?.current?.().increment||500,true);toast(moneyLabel(window.PamojaMarket?.current?.().increment||500)+" demo funds added")});
$("#send-money").addEventListener("click",()=>openModal("Send demo funds","This simulates a wallet transfer. No real money moves.","↗",'<form id="send-form"><label>Recipient phone<input required placeholder="07XX XXX XXX" pattern="[0-9+ ]{9,15}"></label><label>Amount (KSh)<input required type="number" min="1" max="500" value="100"></label><button class="button button-dark">Confirm demo transfer</button></form>'));
$("#send-money").addEventListener("click",()=>{const form=$("#send-form");form.addEventListener("submit",e=>{e.preventDefault();const amount=Number(new FormData(form).get("amount"));if(amount>currentBalance()){toast("Not enough demo balance");return}adjustBalance(-amount);updateWallet();addTransaction("Demo wallet transfer",amount,false);closeModal();toast("Demo transfer complete")})});
$("#mpesa-button").addEventListener("click",()=>openModal("M-Pesa integration","The next build phase can connect Pamoja to Safaricom Daraja. A real integration needs a registered Daraja app, backend credentials, payment callbacks and user consent.","📱",'<p>For safety, payment credentials must live on a secure server, never in browser code. This prototype does not initiate STK Push or accept payments.</p><button class="button button-dark" id="mpesa-ok">Got it</button>'));
$("#modal-content").addEventListener("click",e=>{if(e.target.id==="mpesa-ok")closeModal()});
$("#whatsapp-share").addEventListener("click",()=>{const text=encodeURIComponent("Check out Pamoja — a local-first way to discover businesses, plan rides and stay connected. Explore the demo: "+location.href);window.open("https://wa.me/?text="+text,"_blank","noopener,noreferrer")});
renderBusinesses();

// Consent-first location sharing for the web preview. WhatsApp users share location
// through WhatsApp's own attachment/location flow after the bot asks for it.
const locationStatus = document.querySelector("#location-status");
const locationButton = document.querySelector("#share-location");
const manualArea = document.querySelector("#manual-location");
function setLocationStatus(message, state="") { if (!locationStatus) return; locationStatus.textContent = message; locationStatus.className = "location-status " + state; }
if (locationButton) locationButton.addEventListener("click", () => {
  if (!("geolocation" in navigator)) { setLocationStatus("Location sharing is unavailable in this browser. Enter your area instead.", "error"); return; }
  setLocationStatus("Waiting for your permission…");
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    setLocationStatus("Location permission granted for this demo session. Coordinates are not sent to a server or saved. In WhatsApp, use Attach → Location → Send your current location.", "success");
    locationButton.textContent = "✓ Location permission granted";
    locationButton.dataset.latitude = latitude.toFixed(5);
    locationButton.dataset.longitude = longitude.toFixed(5);
  }, error => {
    const message = error.code === 1 ? "You declined location access. That's okay — enter your area manually or continue without location." : "We couldn't get your location. Enter your area manually or try again.";
    setLocationStatus(message, "error");
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
});
const saveAreaButton = document.querySelector("#save-area");
if (saveAreaButton) saveAreaButton.addEventListener("click", () => {
  const area = (manualArea?.value || "").trim();
  if (!area) { setLocationStatus("Enter an area first, or continue without sharing location.", "error"); return; }
  setLocationStatus("Area selected for this demo: " + area + ". It has not been sent to a server.", "success");
  const areaLabel = document.querySelector(".location-pill b"); if (areaLabel) areaLabel.textContent = area;
});
const waStart = document.querySelector("#whatsapp-start");
if (waStart) waStart.addEventListener("click", () => {
  const message = encodeURIComponent("Hi! I'd like to try Pamoja. Please show me how to discover local businesses, order, request a ride and share my location when needed.");
  window.open("https://wa.me/?text=" + message, "_blank", "noopener,noreferrer");
  toast("WhatsApp opened with a Pamoja introduction. The official Pamoja bot number will be connected in the backend phase.");
});
