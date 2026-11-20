const businesses = [
  {id:1,name:"Mama Njeri's Kitchen",category:"Food",detail:"Homemade Kenyan meals · Kilimani",rating:"4.9",price:"From KSh 250",emoji:"🍲",theme:"food",items:["Pilau & kachumbari — KSh 350","Beef stew & rice — KSh 400","Chapati & beans — KSh 250"]},
  {id:2,name:"Green Basket Grocers",category:"Groceries",detail:"Fresh produce · Westlands",rating:"4.8",price:"From KSh 100",emoji:"🥑",theme:"grocery",items:["Avocado pack — KSh 180","Fresh tomatoes — KSh 100","Fruit basket — KSh 650"]},
  {id:3,name:"Soko Streetwear",category:"Fashion",detail:"Local fashion · CBD",rating:"4.7",price:"From KSh 800",emoji:"👟",theme:"fashion",items:["Graphic tee — KSh 800","Canvas tote — KSh 500","Everyday cap — KSh 650"]},
  {id:4,name:"The Fresh Cut",category:"Services",detail:"Barber & grooming · Lavington",rating:"4.9",price:"From KSh 300",emoji:"✂️",theme:"service",items:["Haircut — KSh 500","Beard trim — KSh 300","Cut & wash — KSh 750"]},
  {id:5,name:"Kahawa Corner",category:"Food",detail:"Coffee & bites · Ngara",rating:"4.6",price:"From KSh 150",emoji:"☕",theme:"food",items:["Kenyan coffee — KSh 180","Mandazi & tea — KSh 150","Iced latte — KSh 320"]},
  {id:6,name:"Maua Studio",category:"Services",detail:"Flowers & gifts · Parklands",rating:"4.8",price:"From KSh 600",emoji:"💐",theme:"grocery",items:["Mini bouquet — KSh 600","Birthday bunch — KSh 1,500","Desk plant — KSh 850"]}
];
const STORE_KEY = "pamoja-demo-v2";
const defaults = {orders:[],rides:[],balance:2450,transactions:[
  {title:"Market shopping",amount:850,positive:false,when:"Yesterday · Demo purchase"},
  {title:"Wallet top-up",amount:1500,positive:true,when:"Monday · Demo credit"}
]};
function loadState(){
  try { return {...defaults,...JSON.parse(localStorage.getItem(STORE_KEY)||"{}")}; }
  catch { return {...defaults}; }
}
let state = loadState();
let activeCategory = "All";
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function persist(){ try { localStorage.setItem(STORE_KEY,JSON.stringify(state)); } catch { toast("Browser storage is full. Your latest changes may not persist."); } }
function toast(message){const el=$("#toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600)}
function showView(name){$$(".view").forEach(v=>v.classList.toggle("active",v.id===name+"-view"));$$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));window.scrollTo({top:0,behavior:"smooth"});if(name==="orders")renderOrders();if(name==="rides")renderRides();if(name==="wallet")renderWallet()}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
function businessCard(b){return `<article class="business-card"><div class="business-visual ${b.theme}"><span class="business-tag">${esc(b.category)}</span><span>${b.emoji}</span></div><div class="business-info"><h3>${esc(b.name)}</h3><p>${esc(b.detail)}</p><div class="business-foot"><span>★ ${esc(b.rating)} · ${esc(b.price)}</span><button data-order="${b.id}">View menu →</button></div></div></article>`}
function renderBusinesses(){
 const query=($("#business-search")?.value||"").toLowerCase();
 const filtered=businesses.filter(b=>(activeCategory==="All"||b.category===activeCategory)&&(`${b.name} ${b.category} ${b.detail}`.toLowerCase().includes(query)));
 $("#discover-businesses").innerHTML=filtered.length?filtered.map(businessCard).join():'<div class="empty-state"><div>🔎</div><h2>No matches yet</h2><p>Try another search or category.</p></div>';
 $("#home-businesses").innerHTML=businesses.slice(0,3).map(businessCard).join("");
}
function openModal(title,copy,icon,content){$("#modal-title").textContent=title;$("#modal-copy").textContent=copy;$("#modal-icon").textContent=icon;$("#modal-content").innerHTML=content;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modal-close").addEventListener("click",closeModal);
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
document.addEventListener("click",e=>{
 const btn=e.target.closest("[data-order]");if(!btn)return;
 const b=businesses.find(x=>x.id===Number(btn.dataset.order));if(!b)return;
 openModal(b.name,"Choose an item to create a demo order request.",b.emoji,
  `<form id="order-form"><label>Choose an item<select name="item">${b.items.map((it,i)=>`<option value="${i}">${esc(it)}</option>`).join("")}</select></label><label>Your name<input name="customer" maxlength="70" placeholder="e.g. Amina" required></label><label>Phone number<input name="phone" maxlength="20" placeholder="07XX XXX XXX" required pattern="[0-9+ ]{9,15}"></label><label>Delivery area (optional)<input name="area" maxlength="100" placeholder="e.g. Mlolongo"></label><button class="button button-dark">Save demo order →</button></form>`);
 $("#order-form").addEventListener("submit",ev=>{
  ev.preventDefault();const fd=new FormData(ev.target);const order={id:Date.now(),business:b.name,item:b.items[Number(fd.get("item"))],customer:String(fd.get("customer")).trim(),phone:String(fd.get("phone")).trim(),area:String(fd.get("area")).trim(),date:new Date().toLocaleString(),status:"Demo request"};
  state.orders.unshift(order);persist();closeModal();toast("Order request saved on this device.");showView("orders");
 });
});
$("#category-filters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;$$(".filter-chip").forEach(x=>x.classList.toggle("selected",x===b));renderBusinesses()});
$("#business-search").addEventListener("input",renderBusinesses);
function renderOrders(){
 $("#orders-empty").classList.toggle("hidden",state.orders.length>0);
 $("#order-list").innerHTML=state.orders.map(o=>`<div class="order-item"><div><b>${esc(o.item)} · ${esc(o.business)}</b><small>Requested by ${esc(o.customer)} · ${esc(o.date)}${o.area?" · "+esc(o.area):""}</small></div><span class="status-pill">${esc(o.status||"Demo request")}</span></div>`).join("");
}
$("#ride-form").addEventListener("submit",e=>{
 e.preventDefault();const pickup=$("#pickup").value.trim(),destination=$("#destination").value.trim(),type=$('input[name="ride-type"]:checked').value;
 const ride={id:Date.now(),pickup,destination,type,date:new Date().toLocaleString(),status:"Preview only"};
 state.rides.unshift(ride);persist();renderRides();toast("Ride request saved on this device.");
});
function renderRides(){
 const result=$("#ride-result");if(!result)return;
 if(!state.rides.length){result.classList.add("hidden");return;}
 result.classList.remove("hidden");
 result.innerHTML=state.rides.map(r=>`<div class="ride-saved"><b>Ride request preview · ${esc(r.type)}</b><br>${esc(r.pickup)} → ${esc(r.destination)}<br><small>${esc(r.date)} · No driver contacted; no booking made.</small></div>`).join("<hr>");
}
function moneyLabel(amount){return window.PamojaMarket?.format?window.PamojaMarket.format(amount):"KSh "+Number(amount).toLocaleString("en-KE",{minimumFractionDigits:2,maximumFractionDigits:2})}
function currentBalance(){return Number(state.balance)||0}
function adjustBalance(amount){state.balance=currentBalance()+amount;persist()}
function renderWallet(){
 const h=$(".wallet-card h2");if(h)h.textContent=moneyLabel(currentBalance());
 const list=$("#transaction-list");if(list)list.innerHTML=state.transactions.map(t=>`<div class="transaction"><span class="transaction-icon">${t.positive?"＋":"↗"}</span><span><b>${esc(t.title)}</b><small>${esc(t.when)}</small></span><strong class="${t.positive?"positive":""}">${t.positive?"+":"−"} ${moneyLabel(t.amount)}</strong></div>`).join("");
}
function addTransaction(title,amount,positive){state.transactions.unshift({title,amount,positive,when:"Just now · Demo transaction"});persist();renderWallet()}
$("#add-money").addEventListener("click",()=>{const amount=500;adjustBalance(amount);addTransaction("Demo wallet top-up",amount,true);toast(moneyLabel(amount)+" demo funds added")});
$("#send-money").addEventListener("click",()=>openModal("Send demo funds","This simulates a wallet transfer. No real money moves.","↗",'<form id="send-form"><label>Recipient phone<input name="recipient" required placeholder="07XX XXX XXX" pattern="[0-9+ ]{9,15}"></label><label>Amount (KSh)<input name="amount" required type="number" min="1" max="500" value="100"></label><button class="button button-dark">Confirm demo transfer</button></form>'));
$("#modal-content").addEventListener("submit",e=>{
 if(e.target.id!=="send-form")return;e.preventDefault();const fd=new FormData(e.target),amount=Number(fd.get("amount"));
 if(amount>currentBalance()){toast("Not enough demo balance");return;}
 adjustBalance(-amount);addTransaction("Demo wallet transfer",amount,false);closeModal();toast("Demo transfer complete");
});
$("#mpesa-button").addEventListener("click",()=>openModal("M-Pesa integration","The real payment connection is not active.","📱",'<p>This prototype does not initiate STK Push or accept payments. A real integration requires approved Daraja credentials and verified payment callbacks. Never share your M-Pesa PIN.</p><button class="button button-dark" id="mpesa-ok">Got it</button>'));
$("#modal-content").addEventListener("click",e=>{if(e.target.id==="mpesa-ok")closeModal()});
function shareOnWhatsApp(message){window.open("https://wa.me/?text="+encodeURIComponent(message)," _blank".trim(),"noopener,noreferrer")}
$("#whatsapp-share").addEventListener("click",()=>shareOnWhatsApp("Check out Pamoja — discover local businesses, preview orders and plan rides. Explore the prototype: "+location.href));
const locationStatus=$("#location-status"),locationButton=$("#share-location"),manualArea=$("#manual-location");
function setLocationStatus(message,stateName=""){if(!locationStatus)return;locationStatus.textContent=message;locationStatus.className="location-status "+stateName}
if(locationButton)locationButton.addEventListener("click",()=>{
 if(!navigator.geolocation){setLocationStatus("Location is unavailable in this browser. Enter your area instead.","error");return}
 setLocationStatus("Waiting for your permission…");
 navigator.geolocation.getCurrentPosition(position=>{
  setLocationStatus("Location permission granted for this session. Coordinates stay in your browser and are not sent to a server.","success");
  locationButton.textContent="✓ Location permission granted";
 },error=>{
  setLocationStatus(error.code===1?"You declined location access. That's okay — enter your area or continue without location.":"We couldn't get your location. Enter your area or try again.","error");
 },{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
});
const saveAreaButton=$("#save-area");
if(saveAreaButton)saveAreaButton.addEventListener("click",()=>{
 const area=(manualArea?.value||"").trim();if(!area){setLocationStatus("Enter an area first, or continue without sharing location.","error");return}
 state.area=area;persist();setLocationStatus("Area selected: "+area+". It is saved only in this browser.","success");
 const label=$(".location-pill b");if(label)label.textContent=area;
});
const waStart=$("#whatsapp-start");
if(waStart)waStart.addEventListener("click",()=>shareOnWhatsApp("Hi! I'd like to try the Pamoja prototype. Please show me how to discover local businesses, preview an order, request a ride and share my location when needed."));
if(state.area){const label=$(".location-pill b");if(label)label.textContent=state.area}
renderBusinesses();renderOrders();renderRides();renderWallet();
