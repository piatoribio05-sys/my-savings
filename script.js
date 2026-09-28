const STORAGE_KEY = "mySavingsTracker_v1";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  transactions: [],
  goal: 0
};

let calendarDate = new Date();
let selectedDate = formatDate(new Date());

const $ = id => document.getElementById(id);
const peso = n => "₱" + Number(n).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});

function formatDate(d){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); render(); }

function render(){
  const income = data.transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const savings = data.transactions.filter(t=>t.type==="savings").reduce((s,t)=>s+t.amount,0);
  const expenses = data.transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance = income + savings - expenses;

  $("income").textContent=peso(income);
  $("savings").textContent=peso(savings);
  $("expenses").textContent=peso(expenses);
  $("balance").textContent=peso(balance);
  $("goalDisplay").textContent=peso(data.goal);

  const pct=data.goal ? Math.min(100,(savings/data.goal)*100) : 0;
  $("goalProgress").style.width=pct+"%";
  $("goalPercent").textContent=Math.round(pct)+"% saved";

  renderCalendar();
  renderSelectedDay();
  renderTransactions();
  renderUpcoming();
}

function renderCalendar(){
  const year=calendarDate.getFullYear(), month=calendarDate.getMonth();
  $("monthTitle").textContent=calendarDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const first=new Date(year,month,1).getDay();
  const days=new Date(year,month+1,0).getDate();
  const today=formatDate(new Date());
  let html="";
  for(let i=0;i<first;i++) html+='<div class="day empty"></div>';

  for(let d=1;d<=days;d++){
    const date=formatDate(new Date(year,month,d));
    const tx=data.transactions.filter(t=>t.date===date);
    const ex=tx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    const inc=tx.filter(t=>t.type!=="expense").reduce((s,t)=>s+t.amount,0);
    html+=`<div class="day ${date===today?"today":""}" onclick="selectDate('${date}')">
      <div class="day-num">${d}</div>
      ${ex?`<div class="day-total">- ${peso(ex)}</div>`:""}
      ${inc?`<div class="day-income">+ ${peso(inc)}</div>`:""}
    </div>`;
  }
  $("calendar").innerHTML=html;
}

window.selectDate=function(date){
  selectedDate=date;
  renderSelectedDay();
};

function renderSelectedDay(){
  const tx=data.transactions.filter(t=>t.date===selectedDate);
  const dateObj=new Date(selectedDate+"T00:00:00");
  const title=dateObj.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  let html=`<h3>📅 ${title}</h3>`;
  if(!tx.length){
    html+='<p class="muted">No transactions recorded for this date.</p>';
  }else{
    tx.forEach(t=>{
      const icon=t.type==="expense"?"💸":t.type==="savings"?"🐷":"💵";
      const sign=t.type==="expense"?"-":"+";
      html+=`<div class="detail-row"><span>${icon} ${escapeHtml(t.note||t.category||t.type)}</span><strong>${sign}${peso(t.amount)}</strong></div>`;
    });
  }
  $("selectedDay").innerHTML=html;
}

function renderUpcoming(){
  const tomorrow=new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  const date=formatDate(tomorrow);
  $("tomorrowDate").textContent=tomorrow.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const items=data.transactions.filter(t=>t.type==="expense" && t.date===date);
  if(!items.length){
    $("upcomingExpenses").innerHTML='<div class="upcoming-empty">✨ No planned expenses for tomorrow.</div>';
    return;
  }
  const total=items.reduce((s,t)=>s+t.amount,0);
  let html=items.map(t=>`<div class="upcoming-item"><span>💸 ${escapeHtml(t.category)}${t.note?" — "+escapeHtml(t.note):""}</span><strong>${peso(t.amount)}</strong></div>`).join("");
  html+=`<div class="upcoming-item"><strong>Total</strong><strong>${peso(total)}</strong></div>`;
  $("upcomingExpenses").innerHTML=html;
}

function renderTransactions(){
  const filter=$("filterType").value, search=$("searchInput").value.toLowerCase();
  let list=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  list=list.filter(t=>(filter==="all"||t.type===filter) && JSON.stringify(t).toLowerCase().includes(search));
  if(!list.length){$("transactions").innerHTML='<div class="empty">No transactions found.</div>';return;}
  $("transactions").innerHTML=list.map(t=>{
    const icon=t.type==="expense"?"💸":t.type==="savings"?"🐷":"💵";
    const sign=t.type==="expense"?"-":"+";
    const title=t.type==="expense" ? (t.category||"Expense") : (t.note||"Income");
    return `<div class="transaction">
      <div class="transaction-main">
        <div class="transaction-icon">${icon}</div>
        <div><div class="transaction-title">${escapeHtml(title)}</div><div class="transaction-date">${t.date}${t.note&&t.type==="expense"?" • "+escapeHtml(t.note):""}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px"><span class="amount ${t.type==="expense"?"minus":"plus"}">${sign}${peso(t.amount)}</span><button class="delete-btn" onclick="deleteTransaction('${t.id}')">Delete</button></div>
    </div>`;
  }).join("");
}

window.deleteTransaction=function(id){
  if(confirm("Delete this transaction?")){
    data.transactions=data.transactions.filter(t=>t.id!==id);
    save();
  }
};

$("incomeForm").addEventListener("submit",e=>{
  e.preventDefault();
  const amount=Number($("incomeAmount").value);
  data.transactions.push({id:crypto.randomUUID(),type:$("incomeType").value,amount,date:$("incomeDate").value,note:$("incomeNote").value.trim()});
  e.target.reset(); $("incomeDate").value=formatDate(new Date()); save();
});

$("expenseForm").addEventListener("submit",e=>{
  e.preventDefault();
  const amount=Number($("expenseAmount").value);
  data.transactions.push({id:crypto.randomUUID(),type:"expense",amount,date:$("expenseDate").value,category:$("expenseCategory").value,note:$("expenseNote").value.trim()});
  e.target.reset(); $("expenseDate").value=formatDate(new Date()); save();
});

$("goalForm").addEventListener("submit",e=>{
  e.preventDefault(); data.goal=Number($("goalAmount").value); e.target.reset(); save();
});

$("prevMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar();};
$("nextMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar();};
$("filterType").onchange=renderTransactions;
$("searchInput").oninput=renderTransactions;

$("clearDataBtn").onclick=()=>{
  if(confirm("This will delete all savings, income, expenses, and your goal. Continue?")){
    data={transactions:[],goal:0}; save();
  }
};

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

$("incomeDate").value=formatDate(new Date());
$("expenseDate").value=formatDate(new Date());
render();
