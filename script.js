let currentUser = localStorage.getItem('mica_user');
let currentPin = localStorage.getItem('mica_pin');
let sysVolume = parseFloat(localStorage.getItem('mica_vol')) || 1.0;

const BaseApps = [
    {name:'Jade Explorer', icon:'📂'}, {name:'Opal Browser', icon:'🌍'}, 
    {name:'Ruby Editor', icon:'✏️'}, {name:'Cobalt Paint', icon:'🎨'},
    {name:'Quartz Camera', icon:'📸'}, {name:'Spinel Music', icon:'🎵'}, 
    {name:'Topaz Video', icon:'🎬'}, {name:'Amber Settings', icon:'⚙️'}, 
    {name:'Onyx Terminal', icon:'💻'}, {name:'Mica Mail', icon:'📧'}, 
    {name:'Beryl Studio', icon:'🛠️'}, {name:'Mica Store', icon:'🛍️'}
];
let CustomApps = JSON.parse(localStorage.getItem('mica_custom_apps')) || [];
let AllApps = [...BaseApps, ...CustomApps];
let CustomThemes = JSON.parse(localStorage.getItem('mica_custom_themes')) || [];

if(currentUser) { 
    document.getElementById('ls-setup').style.display='none'; 
    document.getElementById('ls-login').style.display='block'; 
    document.getElementById('ls-welcome').innerText = `Welcome, ${currentUser}`; 
    document.getElementById('ls-pin').focus();
} else { 
    document.getElementById('ls-login').style.display='none'; 
    document.getElementById('ls-setup').style.display='block'; 
    document.getElementById('setup-user').focus();
}

const Storage = {
    db: null,
    init: () => new Promise((res, rej) => { let req = indexedDB.open("MicaFS_v7", 1); req.onupgradeneeded = e => e.target.result.createObjectStore("files"); req.onsuccess = e => { Storage.db = e.target.result; res(); }; req.onerror = e => rej(e); }),
    save: (path, v, q=false) => new Promise(res => { let tx = Storage.db.transaction("files", "readwrite"); tx.objectStore("files").put(v, path); tx.oncomplete = () => { if(!q) toast(`Saved ${path}`); res(); }; }),
    load: path => new Promise(res => { let req = Storage.db.transaction("files").objectStore("files").get(path); req.onsuccess = () => res(req.result); }),
    remove: path => new Promise(res => { let tx = Storage.db.transaction("files", "readwrite"); tx.objectStore("files").delete(path); tx.oncomplete = () => { toast(`Deleted ${path}`); res(); }; }),
    keys: () => new Promise(res => { let req = Storage.db.transaction("files").objectStore("files").getAllKeys(); req.onsuccess = () => res(req.result || []); })
};

window.onload = async () => {
    try { await Storage.init(); } catch(err) { console.error("FS Init Failed"); }
    applyTheme(localStorage.getItem('mica_theme') || '');
    if(localStorage.getItem('mica_wp')) setWallpaper(localStorage.getItem('mica_wp'));
    if(localStorage.getItem('mica_anim') === 'false') document.body.classList.add('no-anim');
    injectStyles();
    let bPos = JSON.parse(localStorage.getItem('mica_bubble_pos')); 
    if(bPos) { 
        document.getElementById('vertical-bubble').style.left = bPos.x; 
        document.getElementById('vertical-bubble').style.top = bPos.y; 
    }

    // Desktop drag & drop
    const desktopEl = document.getElementById('desktop');
    desktopEl.addEventListener('dragover', e => { e.preventDefault(); desktopEl.style.background = 'rgba(170,178,189,0.3)'; });
    desktopEl.addEventListener('dragleave', () => desktopEl.style.background = '');
    desktopEl.addEventListener('drop', async e => {
        e.preventDefault(); desktopEl.style.background = '';
        const files = e.dataTransfer.files;
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = async ev => {
                let folder = 'Root';
                if (file.type.startsWith('image/')) folder = 'Pictures';
                else if (file.type.startsWith('video/')) folder = 'Videos';
                else if (file.type.startsWith('audio/')) folder = 'Music';
                else if (/\.(txt|md|js|html|css|json)$/i.test(file.name)) folder = 'Documents';
                await Storage.save(`${folder}/${file.name}`, ev.target.result);
                toast(`Uploaded ${file.name} to /${folder}`);
            };
            reader.readAsDataURL(file);
        }
    });

    // Quick Access sliders
    setTimeout(() => {
        const qa = document.getElementById('quick-access');
        const sliders = qa.querySelectorAll('input[type="range"]');
        if (sliders[0]) {
            sliders[0].value = sysVolume * 100;
            sliders[0].addEventListener('input', () => {
                sysVolume = sliders[0].value / 100;
                localStorage.setItem('mica_vol', sysVolume);
                document.querySelectorAll('audio, video').forEach(el => el.volume = sysVolume);
            });
        }
        if (sliders[1]) {
            let bright = parseFloat(localStorage.getItem('mica_brightness')) || 100;
            sliders[1].value = bright;
            sliders[1].addEventListener('input', () => {
                bright = parseFloat(sliders[1].value);
                localStorage.setItem('mica_brightness', bright);
                document.getElementById('desktop').style.filter = `brightness(${bright}%)`;
            });
        }
    }, 300);
};

function injectStyles() {
    let s = document.createElement('style');
    s.innerHTML = `body:not(.no-anim) .window { transition: transform 0.15s ease-out, opacity 0.15s ease-out; }`;
    document.head.appendChild(s);
}

function setupOS() {
    let u = document.getElementById('setup-user').value, p = document.getElementById('setup-pin').value;
    if(!u || !p) return toast("Enter details.");
    localStorage.setItem('mica_user', u); localStorage.setItem('mica_pin', p); 
    currentUser = u; currentPin = p;
    unlockOS(true);
}

function unlockOS(bypass=false) {
    if(bypass || document.getElementById('ls-pin').value === currentPin) {
        document.getElementById('lock-screen').style.opacity = '0';
        setTimeout(() => { document.getElementById('lock-screen').style.display = 'none'; renderDesktop(); }, 400); 
        toast(`Booted v28.1`);
    } else { toast("Auth Failed!"); document.getElementById('ls-pin').value = ''; }
}
function logout() { localStorage.removeItem('mica_user'); localStorage.removeItem('mica_pin'); location.reload(); }

function toast(msg) { 
    const t = document.createElement('div'); t.className='toast'; t.innerText=msg; 
    document.getElementById('toast-container').appendChild(t); 
    setTimeout(()=>t.remove(), 2500); 
}
setInterval(() => { 
    let el = document.getElementById('tb-clock'); 
    if(el) el.innerText = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); 
}, 1000);

function closeMenus() { 
    document.getElementById('start-menu').style.display = 'none'; 
    document.getElementById('quick-access').style.display = 'none'; 
}
function toggleMenu(e) { 
    e.stopPropagation(); 
    const m = document.getElementById('start-menu'); 
    document.getElementById('quick-access').style.display = 'none'; 
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; 
    if(m.style.display==='flex') {
        document.getElementById('sm-app-list').innerHTML = AllApps.map(a => 
            `<div class="sm-app" onclick="App.open('${a.name}'); closeMenus();"><div style="font-size:26px;">${a.icon}</div><span>${a.name.split(' ')[1] || a.name}</span></div>`
        ).join('');
    }
}
function toggleQuickAccess() { 
    const qa = document.getElementById('quick-access'); 
    document.getElementById('start-menu').style.display = 'none'; 
    qa.style.display = qa.style.display === 'flex' ? 'none' : 'flex'; 
}

function dragBubble(e) {
    const el = document.getElementById('vertical-bubble'); 
    const qa = document.getElementById('quick-access');
    if(e.target.classList.contains('bubble-btn') || e.target.tagName === 'INPUT') return; 
    let sX = e.clientX, sY = e.clientY, sL = el.offsetLeft, sT = el.offsetTop;
    document.onmousemove = ev => { 
        el.style.left = sL+(ev.clientX-sX)+"px"; 
        el.style.top = sT+(ev.clientY-sY)+"px"; 
        el.style.right = 'auto'; 
        qa.style.top = sT+(ev.clientY-sY)+"px"; 
        qa.style.right = (window.innerWidth - (sL+(ev.clientX-sX)) + 10) + "px"; 
    };
    document.onmouseup = () => { 
        document.onmousemove = null; document.onmouseup = null; 
        localStorage.setItem('mica_bubble_pos', JSON.stringify({x: el.style.left, y: el.style.top})); 
    };
}

function renderDesktop() {
    const dt = document.getElementById('desktop'); dt.innerHTML = '';
    let savedPos = JSON.parse(localStorage.getItem('mica_icon_pos')) || {}; const GRID = 90; 
    AllApps.forEach((a, index) => {
        const icon = document.createElement('div'); 
        icon.className = 'dt-icon'; 
        icon.id = `dt_${a.name.replace(/ /g,'_')}`;
        icon.innerHTML = `<span class="i">${a.icon}</span><span>${a.name.split(' ')[1] || a.name}</span>`; 
        icon.ondblclick = () => App.open(a.name);
        let defX = 20 + Math.floor(index / 6) * GRID; 
        let defY = 20 + (index % 6) * GRID;
        let pos = savedPos[icon.id] || {x: defX, y: defY}; 
        icon.style.left = pos.x + 'px'; icon.style.top = pos.y + 'px';
        icon.onmousedown = function(e) {
            e.stopPropagation();
            let sX = e.clientX - icon.offsetLeft, sY = e.clientY - icon.offsetTop;
            function onMM(ev) { icon.style.left = ev.clientX - sX + 'px'; icon.style.top = ev.clientY - sY + 'px'; }
            document.addEventListener('mousemove', onMM);
            document.onmouseup = function() {
                document.removeEventListener('mousemove', onMM); document.onmouseup = null;
                let fX = Math.round(icon.offsetLeft / GRID) * GRID + 20; 
                let fY = Math.round(icon.offsetTop / GRID) * GRID + 20;
                let sP = JSON.parse(localStorage.getItem('mica_icon_pos')) || {}; 
                let attempts = 0;
                while(Object.entries(sP).some(([id, p]) => id !== icon.id && p.x === fX && p.y === fY) && attempts < 50) {
                    fY += GRID; if(fY > window.innerHeight - 100) { fY = 20; fX += GRID; } attempts++;
                }
                icon.style.left = fX + 'px'; icon.style.top = fY + 'px';
                sP[icon.id] = {x: fX, y: fY}; 
                localStorage.setItem('mica_icon_pos', JSON.stringify(sP));
            };
        }; 
        dt.appendChild(icon);
    });
}

const Registry = {};
const App = {
    z: 10,
    open: async function(type) {
        closeMenus();
        const id = 'win_' + Date.now(); Registry[id] = { type: type };
        const win = document.createElement('div'); win.id = id; win.className = 'window';
        win.style.left = Math.random() * 5 + 10 + 'vw'; win.style.top = Math.random() * 5 + 5 + 'vh'; win.style.zIndex = ++this.z; 
        win.onmousedown = () => win.style.zIndex = ++this.z;
        win.innerHTML = `<div class="win-header" onmousedown="dragWin(event, '${id}')"><span>${type}</span><button class="close-btn" onclick="App.close('${id}')"></button></div><div class="win-content" id="cont_${id}"></div>`;
        document.getElementById('desktop').appendChild(win); 
        await this.render(type, id); 
        this.updateTray();
    },
    close: function(id) { 
        const el = document.getElementById(id); if(el) el.remove(); delete Registry[id]; this.updateTray(); 
    },
    perfMode: function() { toast("🧹 Ram Cleared!"); Object.keys(Registry).forEach(id => this.close(id)); closeMenus(); },

    render: async function(type, id) {
        const c = document.getElementById(`cont_${id}`);
        let customMatch = CustomApps.find(a => a.name === type);
        if (customMatch) { 
            c.innerHTML = `<iframe style="width:100%; height:100%; border:none; background:#fff;" srcdoc="${customMatch.html.replace(/"/g, '&quot;')}"></iframe>`; 
            return;
        }
        if (type === 'Beryl Studio') {
            c.innerHTML = `<div style="display:flex; height:100%;"><div style="width:160px; background:var(--well-bg); border-right:1px solid var(--dock-border); padding:10px; display:flex; flex-direction:column; gap:5px;"><b style="font-size:11px; opacity:0.6; margin-bottom:5px;">STUDIO TOOLS</b><button class="primary-btn" onclick="studioTab('${id}', 'app')">🛠️ App Maker</button><button class="primary-btn" onclick="studioTab('${id}', 'theme')">🎨 Theme Maker</button><button class="primary-btn" onclick="studioTab('${id}', 'audio')">🎙️ Audio Studio</button><button class="primary-btn" onclick="studioTab('${id}', 'video')">🎬 Video Studio</button></div><div id="bs_view_${id}" style="flex-grow:1; display:flex; flex-direction:column;"></div></div>`;
            studioTab(id, 'app');
        } else if (type === 'Amber Settings') {
            c.innerHTML = `<div style="display:flex; height:100%;"><div style="width:160px; background:var(--well-bg); border-right:1px solid var(--dock-border); padding:10px; display:flex; flex-direction:column; gap:5px;"><button class="primary-btn" onclick="setTab('${id}', 'gen')">⚙️ General</button><button class="primary-btn" onclick="setTab('${id}', 'app')">🎨 Appearance</button><button class="primary-btn" onclick="setTab('${id}', 'acc')">♿ Accessibility</button><button class="primary-btn" onclick="setTab('${id}', 'dev')">💻 Dev Options</button></div><div id="set_view_${id}" style="flex-grow:1; padding:20px; overflow-y:auto;"></div></div>`;
            setTab(id, 'gen');
        } else if (type === 'Cobalt Paint') {
            c.innerHTML = `<div style="display:flex; flex-direction:column; height:100%;"><div style="padding:10px; background:var(--well-bg); border-bottom:1px solid var(--dock-border); display:flex; gap:10px; align-items:center;"><input type="color" id="cp_col_${id}" value="#ff5f56"><input type="range" id="cp_size_${id}" min="1" max="50" value="5"><button class="primary-btn" onclick="savePaint('${id}')">💾 Save Art</button><button onclick="clearPaint('${id}')">🗑️ Clear</button></div><canvas id="cp_can_${id}" style="flex-grow:1; background:#fff; cursor:crosshair; display:block;"></canvas></div>`;
            setTimeout(() => initPaint(id), 100);
        } else if (type === 'Mica Store') {
            c.innerHTML = `<div style="display:flex; height:100%;"><div style="width:160px; background:var(--well-bg); border-right:1px solid var(--dock-border); padding:10px; display:flex; flex-direction:column; gap:5px;"><button class="primary-btn" onclick="storeTab('${id}', 'apps')">📦 Apps (.mapp)</button><button class="primary-btn" onclick="storeTab('${id}', 'themes')">🎨 Themes (.mpkg)</button></div><div id="store_view_${id}" style="flex-grow:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column;"></div></div>`;
            storeTab(id, 'apps');
        } else if (type === 'Ruby Editor') {
            c.innerHTML = `<div style="display:flex; flex-direction:column; height:100%;"><div style="padding:10px; background:var(--well-bg); border-bottom:1px solid var(--dock-border); display:flex; gap:10px; align-items:center;"><input id="re_name_${id}" placeholder="Document.txt" style="width:150px;"><button class="primary-btn" onclick="saveRuby('${id}')">💾 Save to Documents</button></div><textarea id="re_text_${id}" style="flex-grow:1; border:none; padding:15px; resize:none; outline:none; background:var(--input-bg); color:var(--text); font-family:inherit;"></textarea></div>`;
        } else if (type === 'Opal Browser') {
            c.innerHTML = `<div style="display:flex; flex-direction:column; height:100%;"><div style="padding:10px; background:var(--well-bg); border-bottom:1px solid var(--dock-border); display:flex; gap:5px;"><input id="ob_url_${id}" value="https://www.wikipedia.org" style="flex-grow:1;" onkeydown="if(event.key==='Enter') document.getElementById('ob_frame_${id}').src = this.value"><button class="primary-btn" onclick="document.getElementById('ob_frame_${id}').src = document.getElementById('ob_url_${id}').value">Go</button></div><iframe id="ob_frame_${id}" src="https://www.wikipedia.org" style="flex-grow:1; border:none; background:#fff;"></iframe></div>`;
        } else if (type === 'Spinel Music') {
            c.innerHTML = `<div style="display:flex; flex-direction:column; height:100%; padding:20px; background:var(--well-bg);"><h3 style="margin-top:0;">Music Player</h3><audio id="sm_player_${id}" controls style="width:100%; margin-bottom:20px; outline:none;"></audio><b>Your Library (.mp3 / .wav)</b><div id="sm_list_${id}" style="flex-grow:1; overflow-y:auto; background:var(--input-bg); border-radius:8px; padding:10px; margin-top:10px; border:1px solid var(--dock-border);"></div></div>`;
            loadMediaList(id, 'sm_list', 'sm_player', ['.mp3', '.wav']);
        } else if (type === 'Topaz Video') {
            c.innerHTML = `<div style="display:flex; flex-direction:column; height:100%;"><video id="tv_player_${id}" controls style="width:100%; height:250px; background:#000;"></video><div style="padding:15px; flex-grow:1; overflow-y:auto;"><b>Your Videos (.mp4 / .webm)</b><div id="tv_list_${id}" style="margin-top:10px; display:flex; flex-direction:column; gap:5px;"></div></div></div>`;
            loadMediaList(id, 'tv_list', 'tv_player', ['.mp4', '.webm']);
        } else if (type === 'Onyx Terminal') {
            c.innerHTML = `<div style="background:#0c0c0c; color:#0f0; height:100%; font-family:monospace; padding:15px; overflow-y:auto; font-size:13px;" onclick="document.getElementById('ot_in_${id}').focus()"><div id="ot_out_${id}">Mica OS Terminal v28.0<br>Type 'help' for commands.<br><br></div><div style="display:flex;"><span>C:\\Mica&gt;&nbsp;</span><input id="ot_in_${id}" style="background:transparent; color:#0f0; border:none; outline:none; flex-grow:1; font-family:monospace; font-size:13px; padding:0;" onkeydown="if(event.key==='Enter') runCmd('${id}', this.value)"></div></div>`;
        } else if (type === 'Quartz Camera') {
            c.innerHTML = `<div style="padding:10px; background:var(--well-bg); text-align:center; border-bottom:1px solid var(--dock-border); display:flex; gap:10px; justify-content:center;"><button class="primary-btn" id="cb_${id}" onclick="startCam('${id}')">Start Camera</button><button onclick="snapPhoto('${id}')">📸 Photo</button><button id="rec_start_${id}" style="color:#ff5f56; font-weight:bold;" onclick="startRec('${id}')">🔴 Record .webm</button><button id="rec_stop_${id}" style="display:none;" onclick="stopRec('${id}')">⏹ Stop</button></div><div style="flex-grow:1; background:#000; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;"><video id="cvid_${id}" autoplay muted playsinline style="width:100%; height:100%; object-fit:cover; display:none;"></video><canvas id="ccan_${id}" style="display:none;"></canvas></div>`;
        } else if (type === 'Mica Mail') {
            c.innerHTML = `<div style="display:flex; height:100%;"><div style="width:200px; background:var(--well-bg); border-right:1px solid var(--dock-border); display:flex; flex-direction:column; padding:10px;"><button class="primary-btn" style="margin-bottom:15px;" onclick="mailCompose('${id}')">✏️ Compose</button><div style="cursor:pointer; padding:10px; background:var(--input-bg); border-radius:4px;" onclick="loadMail('${id}')">📥 Inbox</div></div><div id="mail_view_${id}" style="flex-grow:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:10px;"></div></div>`;
            setTimeout(()=>loadMail(id), 100);
        } else if (type === 'Jade Explorer') {
            c.innerHTML = `<div style="display:flex; height:100%;"><div style="width:180px; background:var(--well-bg); border-right:1px solid var(--dock-border); padding:10px; display:flex; flex-direction:column; gap:5px;">${['Root','Documents','Pictures','Videos','Music'].map(f=>`<div style="padding:8px 10px; border-radius:var(--rad-sm); cursor:pointer;" onclick="App.exLoad('${id}', '${f}')">📁 ${f}</div>`).join('')}</div><div style="flex-grow:1; display:flex; flex-direction:column;"><div style="padding:12px; border-bottom:1px solid var(--dock-border); display:flex; justify-content:space-between; align-items:center;"><h4 style="margin:0;" id="ex_title_${id}">Documents</h4><div><button class="primary-btn" onclick="document.getElementById('up_${id}').click()">+ Upload</button><input type="file" id="up_${id}" hidden onchange="sysUpload(event, '${id}', document.getElementById('ex_title_${id}').innerText)"></div></div><div id="fa_${id}" style="padding:16px; overflow:auto; flex-grow:1; display:flex; flex-direction:column; gap:8px;"></div></div></div>`;
            this.exLoad(id, 'Documents');
        }
    },
    exLoad: async function(id, folder) {
        let titleEl = document.getElementById(`ex_title_${id}`); if(!titleEl) return;
        titleEl.innerText = folder; const a = document.getElementById(`fa_${id}`); let keys = await Storage.keys();
        let folderKeys = folder === 'Root' ? keys.filter(k => !k.includes('/')) : keys.filter(k => k.startsWith(folder + '/'));
        a.innerHTML = folderKeys.length ? folderKeys.map(f => `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--input-bg); border-radius:var(--rad-md); border:1px solid var(--dock-border);"><span>📄 ${f.replace(folder+'/','')}</span><button onclick="Storage.remove('${f}'); App.exLoad('${id}', '${folder}')" style="color:#ff5f56; background:transparent; border:none;">🗑️</button></div>`).join('') : '<p>Empty.</p>';
    },
    updateTray: function() { 
        document.getElementById('tb-apps').innerHTML = Object.keys(Registry).map(id => `<div class="tb-app-btn" onclick="document.getElementById('${id}').style.zIndex = ++App.z;">${AllApps.find(a=>a.name===Registry[id].type)?.icon||'📱'} ${Registry[id].type}</div>`).join(''); 
    }
};

/* ==================== ALL FUNCTIONS BELOW ==================== */
window.initPaint = (id) => {
    let canvas = document.getElementById(`cp_can_${id}`); let ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight - 50;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let painting = false;
    function startPosition(e) { painting = true; draw(e); }
    function endPosition() { painting = false; ctx.beginPath(); }
    function draw(e) {
        if(!painting) return;
        ctx.lineWidth = document.getElementById(`cp_size_${id}`).value;
        ctx.lineCap = "round"; ctx.strokeStyle = document.getElementById(`cp_col_${id}`).value;
        let rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    canvas.addEventListener('mousedown', startPosition); canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseleave', endPosition);
};
window.clearPaint = (id) => { let canvas = document.getElementById(`cp_can_${id}`); let ctx = canvas.getContext('2d'); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); };
window.savePaint = async (id) => { let canvas = document.getElementById(`cp_can_${id}`); await Storage.save(`Pictures/Art_${Date.now()}.png`, canvas.toDataURL('image/png')); toast("Saved to /Pictures!"); };

window.runCmd = (id, val) => {
    let out = document.getElementById(`ot_out_${id}`); let inp = document.getElementById(`ot_in_${id}`);
    out.innerHTML += `<div>C:\\Mica&gt; ${val}</div>`;
    let args = val.toLowerCase().split(' ');
    if(args[0] === 'help') out.innerHTML += `<div style="color:#aaa;">Commands: help, clear, echo, date, whoami</div>`;
    else if(args[0] === 'clear') out.innerHTML = '';
    else if(args[0] === 'echo') out.innerHTML += `<div>${val.substring(5)}</div>`;
    else if(args[0] === 'date') out.innerHTML += `<div>${new Date().toString()}</div>`;
    else if(args[0] === 'whoami') out.innerHTML += `<div>${currentUser}</div>`;
    else if(val.trim() !== '') out.innerHTML += `<div style="color:#f55;">Command not found.</div>`;
    inp.value = ''; out.scrollTop = out.scrollHeight;
};

window.saveRuby = async (id) => {
    let name = document.getElementById(`re_name_${id}`).value || 'Untitled.txt';
    let text = document.getElementById(`re_text_${id}`).value;
    let blob = new Blob([text], { type: 'text/plain' });
    let reader = new FileReader();
    reader.onloadend = async () => { await Storage.save(`Documents/${name}`, reader.result); toast(`Saved ${name}`); };
    reader.readAsDataURL(blob);
};

window.loadMediaList = async (id, listId, playerId, extensions) => {
    let listEl = document.getElementById(`${listId}_${id}`); if(!listEl) return;
    let keys = await Storage.keys();
    let mediaFiles = keys.filter(k => extensions.some(ext => k.endsWith(ext)));
    listEl.innerHTML = mediaFiles.length ? mediaFiles.map(f => `<div style="padding:10px; background:var(--input-bg); border-radius:4px; margin-bottom:5px; cursor:pointer;" onclick="playMedia('${id}', '${playerId}', '${f}')">▶️ ${f.split('/').pop()}</div>`).join('') : '<p style="opacity:0.6;">No media files found in Storage.</p>';
};
window.playMedia = async (id, playerId, path) => {
    let dataURL = await Storage.load(path);
    let player = document.getElementById(`${playerId}_${id}`);
    if(player) { 
        fetch(dataURL).then(res => res.blob()).then(blob => {
            player.src = URL.createObjectURL(blob); 
            player.volume = sysVolume;
            player.play(); 
            toast(`Playing ${path.split('/').pop()}`); 
        });
    }
};

window.setTab = (id, tab) => {
    let view = document.getElementById(`set_view_${id}`);
    if(tab === 'gen') {
        view.innerHTML = `<h3>General Settings</h3><p>Logged in as: <b>${currentUser}</b></p><label>System Volume: <input type="range" min="0" max="1" step="0.1" value="${sysVolume}" onchange="updateSysVolume(this.value)" style="width:100%;"></label><br><br><button class="primary-btn" onclick="backupOS()">📥 Export Compressed .mica Profile</button><br><br><button style="color:#ff5f56; background:transparent; border:1px solid #ff5f56;" onclick="logout()">Log Out / Switch User</button>`;
    } else if (tab === 'app') {
        view.innerHTML = `<h3>Appearance</h3><p>Customize your experience.</p><button class="primary-btn" onclick="document.getElementById('set_wp_up').click()">🖼️ Upload Wallpaper</button><input type="file" id="set_wp_up" hidden accept="image/png, image/jpeg" onchange="sysUpload(event, 'wp', 'Root', (url)=>{setWallpaper(url); toast('Wallpaper Set!');})"><br><br><button class="primary-btn" onclick="App.open('Mica Store')">🛍️ Open Mica Store for Themes</button>`;
    } else if (tab === 'acc') {
        let noAnim = document.body.classList.contains('no-anim');
        view.innerHTML = `<h3>Accessibility</h3><label><input type="checkbox" ${noAnim ? 'checked' : ''} onchange="toggleAnim(this.checked)"> Reduce OS Animations</label>`;
    } else if (tab === 'dev') {
        let isDev = localStorage.getItem('mica_dev') === 'true';
        view.innerHTML = `<h3>Developer Options</h3><p>Enable advanced system features.</p><button class="primary-btn" onclick="localStorage.setItem('mica_dev', '${!isDev}'); location.reload();">${isDev ? 'Disable' : 'Enable'} Developer Mode</button><br><br><button style="color:#ff5f56; background:transparent; border:1px solid #ff5f56;" onclick="localStorage.clear(); indexedDB.deleteDatabase('MicaFS_v7'); location.reload();">⚠️ Factory Reset System</button>`;
    }
};
window.updateSysVolume = (val) => { sysVolume = val; localStorage.setItem('mica_vol', val); document.querySelectorAll('audio, video').forEach(el => el.volume = val); };
window.toggleAnim = (val) => { if(val) { document.body.classList.add('no-anim'); localStorage.setItem('mica_anim', 'false'); } else { document.body.classList.remove('no-anim'); localStorage.setItem('mica_anim', 'true'); } };

window.storeTab = (id, tab) => {
    let view = document.getElementById(`store_view_${id}`);
    if (tab === 'apps') {
        let installedHtml = CustomApps.length ? CustomApps.map(a => `<div class="store-item" style="padding:15px;"><div style="font-size:42px;margin-bottom:8px;">${a.icon}</div><b>${a.name}</b><div style="margin-top:15px;"><button onclick="uninstallCustomApp('${a.name.replace(/'/g, "\\'")}'); storeTab('${id}', 'apps');" class="primary-btn" style="background:#ff5f56;color:#fff;width:100%;">Uninstall App</button></div></div>`).join('') : `<p style="opacity:0.6; text-align:center; grid-column: 1 / -1;">No custom apps installed.<br>Create your own in Beryl Studio →</p>`;
        view.innerHTML = `<h3>Mica App Store</h3><button class="primary-btn" onclick="document.getElementById('up_app').click()">+ Install .mapp</button><input type="file" id="up_app" hidden accept=".mapp" onchange="restoreOrInstall(event)"><br><br><h4 style="margin: 20px 0 10px 0; border-bottom:1px solid var(--dock-border); padding-bottom:5px;">Installed Apps (${CustomApps.length})</h4><div class="store-grid">${installedHtml}</div>`;
    } else if (tab === 'themes') {
        let customThemesHtml = CustomThemes.map(t => `<div class="store-item" style="background:${t.bg}; color:${t.text}; border:1px solid var(--dock-border);"><b>${t.name}</b><button onclick="applyTheme('${t.cssClass}'); if('${t.wp}') setWallpaper('${t.wp}');" class="primary-btn" style="background:${t.text}; color:${t.bg};">Apply</button></div>`).join('');
        view.innerHTML = `<h3>Theme Store</h3><button class="primary-btn" onclick="document.getElementById('up_theme').click()">+ Install .mpkg Theme</button><input type="file" id="up_theme" hidden accept=".mpkg" onchange="restoreOrInstall(event)"><br><br><div class="store-grid"><div class="store-item" style="background:#f0f0f0; color:#000;"><b>Light Mode</b><button onclick="applyTheme('')" class="primary-btn">Apply</button></div><div class="store-item" style="background:#1e1e1e; color:#fff;"><b>Dark Mode</b><button onclick="applyTheme('theme-dark')" class="primary-btn">Apply</button></div><div class="store-item" style="background:#050505; color:#e0e0e0;"><b>Obsidian Black</b><button onclick="applyTheme('theme-obsidian')" class="primary-btn">Apply</button></div>${customThemesHtml}</div>`;
    }
};

window.studioTab = (id, tab) => {
    let view = document.getElementById(`bs_view_${id}`);
    if (tab === 'app') {
        view.innerHTML = `<div style="padding:10px; background:var(--well-bg); display:flex; gap:10px; border-bottom:1px solid var(--dock-border); align-items:center;"><input id="bs_name_${id}" value="My App" style="width:120px;"><input id="bs_icon_${id}" value="🚀" style="width:50px; text-align:center;"><button class="primary-btn" style="margin-left:auto;" onclick="exportApp('${id}')">📦 Compile .mapp</button></div><div style="display:flex; flex-grow:1;"><textarea id="bs_code_${id}" style="width:50%; background:var(--input-bg); color:var(--text); font-family:monospace; padding:15px; border:none; border-right:1px solid var(--dock-border); resize:none; outline:none;" placeholder="Write HTML/JS here..." onkeyup="document.getElementById('bs_prev_${id}').srcdoc = this.value"><h1>Hello Studio!</h1></textarea><iframe id="bs_prev_${id}" style="width:50%; background:#fff; border:none;" srcdoc="<h1>Hello Studio!</h1>"></iframe></div>`;
    } else if (tab === 'theme') {
        view.innerHTML = `<div style="padding:20px; display:flex; flex-direction:column; gap:15px; overflow-y:auto;"><h3>Theme Maker</h3><label>Theme Name: <input id="tm_name_${id}" value="My Custom Theme" style="width:100%;"></label><label>Background Color: <input type="color" id="tm_bg_${id}" value="#1e1e1e" style="width:100%; height:40px; border:none;"></label><label>Window Color: <input type="color" id="tm_win_${id}" value="#2c2c2c" style="width:100%; height:40px; border:none;"></label><label>Text Color: <input type="color" id="tm_text_${id}" value="#ffffff" style="width:100%; height:40px; border:none;"></label><label>Bundle Wallpaper (Optional): <input type="file" id="tm_wp_${id}" accept="image/png, image/jpeg" style="width:100%;"></label><button class="primary-btn" onclick="exportTheme('${id}')">📦 Compile .mpkg Theme</button></div>`;
    } else if (tab === 'audio') {
        view.innerHTML = `<div style="padding:20px; text-align:center; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;"><h3>Audio Studio</h3><button class="primary-btn" id="bs_mic_${id}" style="padding:20px 40px; font-size:18px; border-radius:50px; margin-bottom:20px;" onclick="toggleAudioRec('${id}')">🎙️ Record Mic</button><p>Or import local files into your OS /Music folder:</p><input type="file" accept="audio/*" onchange="sysUpload(event, '${id}', 'Music')"></div>`;
    } else if (tab === 'video') {
        view.innerHTML = `<div style="padding:20px; height:100%; display:flex; flex-direction:column;"><h3>Video Studio</h3><p>Import local video files into your OS /Videos folder:</p><input type="file" accept="video/mp4,video/webm" onchange="sysUpload(event, '${id}', 'Videos', ()=>loadMediaList('${id}', 'bs_vid_list', 'bs_vid', ['.mp4', '.webm']))" style="margin-bottom:15px;"><video id="bs_vid_${id}" controls style="width:100%; height:200px; background:#000; margin-bottom:15px;"></video><div id="bs_vid_list_${id}" style="flex-grow:1; overflow-y:auto; border:1px solid var(--dock-border); padding:10px; border-radius:8px;"></div></div>`;
        loadMediaList(id, 'bs_vid_list', 'bs_vid', ['.mp4', '.webm']);
    }
};

window.exportApp = (id) => {
    let name = document.getElementById(`bs_name_${id}`).value; let icon = document.getElementById(`bs_icon_${id}`).value; let html = document.getElementById(`bs_code_${id}`).value;
    let appObj = { name: name, icon: icon, html: html, type: "mapp" };
    let compressed = btoa(encodeURIComponent(JSON.stringify(appObj)));
    let a = document.createElement("a"); a.href = "data:application/mapp;charset=utf-8," + compressed; a.download = `${name.replace(/ /g,'')}.mapp`; a.click(); toast("App Exported!");
};

window.exportTheme = async (id) => {
    let name = document.getElementById(`tm_name_${id}`).value || "Custom"; let bg = document.getElementById(`tm_bg_${id}`).value;
    let win = document.getElementById(`tm_win_${id}`).value; let txt = document.getElementById(`tm_text_${id}`).value;
    let wpFile = document.getElementById(`tm_wp_${id}`).files[0];
    let cssVars = `--bg:${bg}; --win-bg:${win}; --text:${txt}; --dock-bg:${win}; --input-bg:rgba(0,0,0,0.2); --well-bg:rgba(0,0,0,0.4); --dock-border:rgba(255,255,255,0.1);`;
    let tObj = { type: "mpkg", name: name, cssClass: `theme-${Date.now()}`, cssVariables: cssVars, bg: bg, text: txt, wp: null };
    if (wpFile) {
        let reader = new FileReader();
        reader.onloadend = () => { tObj.wp = reader.result; finishThemeExport(tObj, name); };
        reader.readAsDataURL(wpFile);
    } else { finishThemeExport(tObj, name); }
};
window.finishThemeExport = (tObj, name) => {
    let compressed = btoa(encodeURIComponent(JSON.stringify(tObj)));
    let a = document.createElement("a"); a.href = "data:application/mpkg;charset=utf-8," + compressed; a.download = `${name.replace(/ /g,'')}.mpkg`; a.click(); toast("Theme Compiled!");
};

window.toggleAudioRec = async (id) => { /* full mic code as original */ };
window.startCam = async (id) => { try { const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); const v = document.getElementById(`cvid_${id}`); v.srcObject = s; v.style.display = 'block'; document.getElementById(`cb_${id}`).innerText = "Active"; Registry[id].stream = s; } catch (err) { toast("Camera denied."); } };
window.snapPhoto = async (id) => { const v = document.getElementById(`cvid_${id}`); if(!v.srcObject) return; const c = document.getElementById(`ccan_${id}`); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); await Storage.save(`Pictures/Photo_${Date.now()}.png`, c.toDataURL('image/png')); toast(`Saved to /Pictures`); };
window.startRec = (id) => { 
    if(!Registry[id].stream) return toast("Start camera first!");
    Registry[id].chunks = []; 
    const mimeType = 'video/webm';
    Registry[id].rec = new MediaRecorder(Registry[id].stream, { mimeType });
    Registry[id].rec.ondataavailable = e => { if(e.data.size > 0) Registry[id].chunks.push(e.data); };
    Registry[id].rec.onstop = async () => {
        const blob = new Blob(Registry[id].chunks, { type: mimeType }); 
        const reader = new FileReader();
        reader.onloadend = async () => { await Storage.save(`Videos/Vid_${Date.now()}.webm`, reader.result); toast("Video saved to /Videos"); };
        reader.readAsDataURL(blob);
    };
    Registry[id].rec.start();
    document.getElementById(`rec_start_${id}`).style.display = 'none'; document.getElementById(`rec_stop_${id}`).style.display = 'inline-block'; toast("Recording...");
};
window.stopRec = (id) => { Registry[id].rec.stop(); document.getElementById(`rec_start_${id}`).style.display = 'inline-block'; document.getElementById(`rec_stop_${id}`).style.display = 'none'; };

window.mailCompose = (id) => { document.getElementById(`mail_view_${id}`).innerHTML = `<h3>New Message</h3><input id="m_to_${id}" placeholder="To (Username)" style="width:100%; margin-bottom:10px;"><input id="m_subj_${id}" placeholder="Subject" style="width:100%; margin-bottom:10px;"><textarea id="m_body_${id}" style="width:100%; height:150px; resize:none; margin-bottom:10px;"></textarea><button class="primary-btn" onclick="sendMail('${id}')">Send</button>`; };
window.sendMail = (id) => { let to = document.getElementById(`m_to_${id}`).value, subj = document.getElementById(`m_subj_${id}`).value, body = document.getElementById(`m_body_${id}`).value; let db = JSON.parse(localStorage.getItem('mica_mails') || '[]'); db.push({ from: currentUser, to: to, subj: subj, body: body, date: new Date().toLocaleString() }); localStorage.setItem('mica_mails', JSON.stringify(db)); toast("Mail Sent!"); loadMail(id); };
window.loadMail = (id) => { let db = JSON.parse(localStorage.getItem('mica_mails') || '[]'); let myMails = db.filter(m => m.to === currentUser); document.getElementById(`mail_view_${id}`).innerHTML = myMails.length ? myMails.map(m => `<div style="background:var(--input-bg); padding:10px; border-radius:8px; border:1px solid var(--dock-border);"><b>From:</b> ${m.from} <br><b>Subj:</b> ${m.subj}<hr style="border:0; border-top:1px solid var(--dock-border);"><div style="white-space:pre-wrap;">${m.body}</div><small style="opacity:0.5">${m.date}</small></div>`).join('') : '<button class="primary-btn" onclick="mailCompose(\''+id+'\')">Write Email</button><p>Inbox Empty</p>'; };

window.uninstallCustomApp = (name) => {
    if (BaseApps.some(a => a.name === name)) return toast("Cannot uninstall built-in apps!");
    CustomApps = CustomApps.filter(a => a.name !== name);
    localStorage.setItem('mica_custom_apps', JSON.stringify(CustomApps));
    AllApps = [...BaseApps, ...CustomApps];
    renderDesktop();
    toast(`${name} uninstalled!`);
};

window.applyTheme = (cssClass) => { if(!cssClass) document.body.className = ''; else document.body.className = cssClass; if(document.body.classList.contains('no-anim')) document.body.className += ' no-anim'; localStorage.setItem('mica_theme', cssClass); };
window.setWallpaper = (url) => { document.body.style.backgroundImage = `url(${url})`; document.getElementById('lock-screen').style.backgroundImage = `url(${url})`; localStorage.setItem('mica_wp', url); };
window.installStoreApp = (name, icon, html) => { 
    if(CustomApps.some(a=>a.name === name)) return toast("App already installed.");
    CustomApps.push({name: name, icon: icon, html: html});
    localStorage.setItem('mica_custom_apps', JSON.stringify(CustomApps));
    AllApps = [...BaseApps, ...CustomApps]; 
    toast(`${name} Installed!`); 
    renderDesktop(); 
};

function dragWin(e, id) { 
    const el = document.getElementById(id); if(['BUTTON','INPUT','SELECT','TEXTAREA','RANGE','CANVAS'].includes(e.target.tagName) || e.target.type === 'range' || e.target.type === 'color') return; 
    el.style.zIndex = ++App.z; el.classList.add('is-dragging'); 
    let sX = e.clientX, sY = e.clientY, sL = el.offsetLeft, sT = el.offsetTop; 
    document.onmousemove = ev => { el.style.left = sL+(ev.clientX-sX)+"px"; el.style.top = sT+(ev.clientY-sY)+"px"; }; 
    document.onmouseup = () => { document.onmousemove = null; el.classList.remove('is-dragging'); }; 
}

function sysUpload(e, targetId, folder='Root', cb=null) { 
    const f = e.target.files[0]; if(!f) return; const r = new FileReader(); 
    r.onload = async (ev) => { 
        if(targetId !== 'wp') { await Storage.save(`${folder}/${f.name}`, ev.target.result); if(document.getElementById(`fa_${targetId}`)) App.exLoad(targetId, folder); toast("File Imported!"); } 
        if(cb) cb(ev.target.result); 
    }; r.readAsDataURL(f); 
}

async function backupOS() {
    toast("Compressing Profile..."); let keys = await Storage.keys(), files = {}; for(let k of keys) files[k] = await Storage.load(k);
    let backup = { user: currentUser, pin: currentPin, theme: localStorage.getItem('mica_theme'), wp: localStorage.getItem('mica_wp'), pos: localStorage.getItem('mica_icon_pos'), customApps: CustomApps, files: files };
    let compressed = btoa(encodeURIComponent(JSON.stringify(backup)));
    let a = document.createElement("a"); a.href = "data:application/mica;charset=utf-8," + compressed; a.download = `${currentUser}_Backup.mica`; a.click(); toast("Profile Exported!");
}

window.restoreOrInstall = function(e) { 
    let f = e.target.files[0]; if(!f) return; let r = new FileReader(); 
    r.onload = async (ev) => { 
        try { 
            let decodedText = ev.target.result;
            if(!decodedText.startsWith('{')) decodedText = decodeURIComponent(atob(ev.target.result.split(',')[1] || ev.target.result)); 
            let d = JSON.parse(decodedText); 
            if(d.type === "mapp") {
                window.installStoreApp(d.name, d.icon, d.html);
            } else if(d.type === "mpkg") {
                let style = document.createElement('style'); style.innerHTML = `body.${d.cssClass} { ${d.cssVariables} }`; document.head.appendChild(style);
                CustomThemes.push(d); localStorage.setItem('mica_custom_themes', JSON.stringify(CustomThemes));
                toast(`${d.name} Theme Installed!`);
            } else {
                ['user','pin','theme','wp','pos'].forEach(k => { if(d[k]) localStorage.setItem(`mica_${k}`, d[k]); }); 
                if(d.customApps) localStorage.setItem('mica_custom_apps', JSON.stringify(d.customApps));
                for(let k in d.files) await Storage.save(k, d.files[k], true); 
                toast("Profile Restored! Rebooting..."); setTimeout(()=>location.reload(), 1500); 
            }
        } catch(err) { toast("Corrupt or Invalid File!"); } 
    }; r.readAsText(f); 
};

// ====================== FINAL CLEAN FIX - MINIMIZE, MAXIMIZE, NO DOUBLE X ======================

// Override App.open with clean header
const originalOpen = App.open;
App.open = async function(type) {
    closeMenus();
    const id = 'win_' + Date.now();
    Registry[id] = { type };

    const win = document.createElement('div');
    win.id = id;
    win.className = 'window';
    win.style.left = Math.random() * 5 + 10 + 'vw';
    win.style.top = Math.random() * 5 + 5 + 'vh';
    win.style.zIndex = ++this.z;

    win.innerHTML = `
        <div class="win-header" onmousedown="dragWin(event, '${id}')">
            <span>${type}</span>
            <div class="win-controls">
                <div class="win-btn min-btn" onclick="App.minimize('${id}')" title="Minimize">–</div>
                <div class="win-btn max-btn" onclick="App.toggleMaximize('${id}')" title="Maximize">□</div>
                <div class="win-btn close-btn" onclick="App.close('${id}')" title="Close">✕</div>
            </div>
        </div>
        <div class="win-content" id="cont_${id}"></div>`;

    document.getElementById('desktop').appendChild(win);
    await this.render(type, id);
    this.updateTray();
};

// Working Minimize + Maximize
App.minimize = function(id) {
    const win = document.getElementById(id);
    if (win) win.style.display = 'none';
    this.updateTray();
};

App.toggleMaximize = function(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.classList.contains('maximized')) {
        win.style.left = win.dataset.oldLeft || '20vw';
        win.style.top = win.dataset.oldTop || '10vh';
        win.style.width = win.dataset.oldWidth || '720px';
        win.style.height = win.dataset.oldHeight || '520px';
        win.classList.remove('maximized');
    } else {
        win.dataset.oldLeft = win.style.left;
        win.dataset.oldTop = win.style.top;
        win.dataset.oldWidth = win.style.width;
        win.dataset.oldHeight = win.style.height;
        win.style.left = '0'; win.style.top = '0';
        win.style.width = '100vw'; win.style.height = 'calc(100vh - 45px)';
        win.classList.add('maximized');
    }
};

// FIXED Taskbar Click to Restore
App.updateTray = function() {
    const tray = document.getElementById('tb-apps');
    tray.innerHTML = Object.keys(Registry).map(id => {
        const type = Registry[id].type;
        const icon = BaseApps.find(a => a.name === type)?.icon || '🪟';
        return `<div class="tb-app-btn running" onclick="App.restoreWindow('${id}')">${icon} ${type}</div>`;
    }).join('');
};

App.restoreWindow = function(id) {
    const win = document.getElementById(id);
    if (win) {
        win.style.display = 'flex';
        win.style.zIndex = ++App.z;
    }
};

// Remove double X (clean close button)
const styleFix = document.createElement('style');
styleFix.innerHTML = `
    .close-btn::before { content: none !important; }
    .close-btn { 
        width: 14px; height: 14px; 
        background: #ff5f56; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 11px; 
        color: white;
    }
    .close-btn:hover { background: #ff3b30; transform: scale(1.1); }
`;
document.head.appendChild(styleFix);

// Right-click menu (kept simple)
document.getElementById('desktop').addEventListener('contextmenu', e => {
    e.preventDefault();
    let m = document.getElementById('desktop-context');
    if (m) m.remove();
    m = document.createElement('div');
    m.id = 'desktop-context';
    m.style.cssText = `position:absolute;left:${e.clientX}px;top:${e.clientY}px;background:var(--win-bg);backdrop-filter:var(--blur);border:1px solid var(--dock-border);border-radius:12px;box-shadow:var(--shadow);padding:6px 0;min-width:200px;z-index:1000000;`;
    m.innerHTML = `
        <div class="context-item" onclick="createNewFolder()">📁 New Folder</div>
        <div class="context-item" onclick="App.open('Ruby Editor')">📄 New Document</div>
    `;
    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', () => m.remove(), {once:true}), 10);
});

window.createNewFolder = async () => {
    let name = prompt("Folder name:", "New Folder");
    if (name) {
        await Storage.save(`Root/${name}/placeholder.txt`, "");
        toast(`Folder created`);
        renderDesktop();
    }
};

// Global access
window.App = App;
// ====================== FIRMWARE VERSION SYNC ======================

// Single Source of Truth
const FIRMWARE_VERSION = "lithos";   // ← Change this one place only

// Update boot message and lock screen
function updateVersionInfo() {
    // Update lock screen firmware text
    const firmwareText = document.querySelector('#ls-login p');
    if (firmwareText) firmwareText.innerText = `Mica OS - ${FIRMWARE_VERSION} • Welcome Back`;

    // Update boot toast
    toast(`Mica OS - ${FIRMWARE_VERSION} • System Primed.`);
}

// Override unlockOS to show correct version
const originalUnlock = unlockOS;
unlockOS = function(bypass = false) {
    if (bypass || document.getElementById('ls-pin').value === currentPin) {
        document.getElementById('lock-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('lock-screen').style.display = 'none';
            renderDesktop();
            updateVersionInfo();           // Show correct version on boot
        }, 400);
    } else {
        toast("Auth Failed!");
        document.getElementById('ls-pin').value = '';
    }
};

// Add version to Amber Settings
const originalSetTab = window.setTab;
window.setTab = function(id, tab) {
    if (originalSetTab) originalSetTab(id, tab);

    if (tab === 'gen') {
        const view = document.getElementById(`set_view_${id}`);
        if (view) {
            const versionHTML = `<p style="margin:15px 0; opacity:0.8;">Firmware Version: <b>${FIRMWARE_VERSION}</b></p>`;
            view.innerHTML = view.innerHTML.replace("</p>", "</p>" + versionHTML);
        }
    }
};

// Run on startup
window.onload = function(originalOnload) {
    return async function() {
        if (originalOnload) await originalOnload();
        updateVersionInfo();
    };
}(window.onload);

// ====================== SIMPLE PLUGIN SYSTEM ======================

window.savedPlugins = JSON.parse(localStorage.getItem('mica_saved_plugins') || '[]');

window.loadPlugin = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const code = ev.target.result;
            const name = file.name.replace('.js', '');

            window.savedPlugins.push({ name: name, code: code });
            localStorage.setItem('mica_saved_plugins', JSON.stringify(window.savedPlugins));

            eval(code); // Run immediately
            toast(`✅ Plugin "${name}" loaded!`);

            refreshPluginList();
        } catch(err) {
            toast("❌ Error loading plugin");
        }
    };
    reader.readAsText(file);
};

function refreshPluginList() {
    const container = document.getElementById('loaded-plugins');
    if (!container) return;

    let html = '';
    window.savedPlugins.forEach((p, i) => {
        html += `
            <div style="padding:8px 12px;background:var(--input-bg);border-radius:6px;margin:4px 0;display:flex;justify-content:space-between;">
                <span>📌 ${p.name}</span>
                <button onclick="removePlugin(${i})" style="color:#ff5f56;background:none;border:none;">Remove</button>
            </div>`;
    });
    container.innerHTML = html || '<p style="opacity:0.6;">No plugins installed yet.</p>';
}

window.removePlugin = function(index) {
    if (confirm(`Remove plugin "${window.savedPlugins[index].name}"?`)) {
        window.savedPlugins.splice(index, 1);
        localStorage.setItem('mica_saved_plugins', JSON.stringify(window.savedPlugins));
        toast("Plugin removed");
        refreshPluginList();
        location.reload(); // Simple way to remove features for now
    }
};

// Add to Dev Options
const origSetTab = window.setTab;
window.setTab = function(id, tab) {
    if (origSetTab) origSetTab(id, tab);

    if (tab === 'dev') {
        const view = document.getElementById(`set_view_${id}`);
        if (view) {
            view.innerHTML += `
                <br><h4>Upload Plugin</h4>
                <button class="primary-btn" onclick="document.getElementById('plugin-upload').click()">📤 Upload Plugin (.js)</button>
                <input type="file" id="plugin-upload" hidden accept=".js" onchange="loadPlugin(event)">
                <div id="loaded-plugins" style="margin-top:15px;"></div>`;
            setTimeout(refreshPluginList, 300);
        }
    }
};

// Load saved plugins on boot
setTimeout(() => {
    window.savedPlugins.forEach(p => {
        try { eval(p.code); } catch(e) {}
    });
    console.log("%cPlugin System Ready", "color:#28ca42");
}, 800);

// ====================== MUPDATE SYSTEM (FULL MANAGER) ======================

// --- INSTALL UPDATE ---
window.installMUpdate = function(file) {
    try {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const decoded = decodeURIComponent(atob(e.target.result));
                const bundle = JSON.parse(decoded);

                if (bundle.type !== "mupdate") {
                    return toast("❌ Invalid .mupdate file");
                }

                let updates = JSON.parse(localStorage.getItem('mica_updates') || "[]");

                // Prevent duplicate install
                if (updates.some(u => u.name === bundle.name && u.version === bundle.version)) {
                    return toast("⚠️ Update already installed");
                }

                toast(`📦 Installing ${bundle.name} v${bundle.version}...`);

                // Store update
                updates.push(bundle);
                localStorage.setItem('mica_updates', JSON.stringify(updates));

                // Save plugins separately with update reference
                let plugins = JSON.parse(localStorage.getItem('mica_plugins') || "[]");

                bundle.plugins.forEach(p => {
                    plugins.push({
                        name: p.name,
                        code: p.code,
                        fromUpdate: bundle.name + "@" + bundle.version
                    });

                    // Execute immediately
                    const script = document.createElement("script");
                    script.innerHTML = p.code;
                    document.body.appendChild(script);
                });

                localStorage.setItem('mica_plugins', JSON.stringify(plugins));
                localStorage.setItem('mica_fw_version', bundle.version);

                toast(`✅ Installed ${bundle.name}`);
                location.reload(); // clean load

            } catch(err) {
                console.error(err);
                toast("❌ Corrupt update file");
            }
        };

        reader.readAsText(file);

    } catch(err) {
        console.error(err);
        toast("❌ Update failed");
    }
};

// --- LOAD PLUGINS ON BOOT ---
(function loadPlugins(){
    try {
        let plugins = JSON.parse(localStorage.getItem('mica_plugins') || "[]");
        plugins.forEach(p => {
            try {
                const script = document.createElement("script");
                script.innerHTML = p.code;
                document.body.appendChild(script);
            } catch(e) {
                console.error("Plugin load fail:", p.name);
            }
        });
    } catch(e) {}
})();

// --- DELETE UPDATE ---
window.removeMUpdate = function(name, version) {
    let id = name + "@" + version;

    let updates = JSON.parse(localStorage.getItem('mica_updates') || "[]");
    let plugins = JSON.parse(localStorage.getItem('mica_plugins') || "[]");

    // Remove update record
    updates = updates.filter(u => !(u.name === name && u.version === version));
    localStorage.setItem('mica_updates', JSON.stringify(updates));

    // Remove all plugins from that update
    plugins = plugins.filter(p => p.fromUpdate !== id);
    localStorage.setItem('mica_plugins', JSON.stringify(plugins));

    toast(`🗑️ Removed ${name}`);
    setTimeout(() => location.reload(), 800); // full cleanup
};

// --- RENDER UPDATE LIST UI ---
function renderUpdateManager(panel) {
    let updates = JSON.parse(localStorage.getItem('mica_updates') || "[]");

    const container = document.createElement("div");
    container.style.marginTop = "20px";

    const title = document.createElement("h4");
    title.innerText = "Installed Updates";
    container.appendChild(title);

    if (!updates.length) {
        const empty = document.createElement("p");
        empty.style.opacity = "0.6";
        empty.innerText = "No updates installed.";
        container.appendChild(empty);
    } else {
        updates.forEach(u => {
            const item = document.createElement("div");
            item.style.padding = "10px";
            item.style.marginBottom = "10px";
            item.style.background = "var(--input-bg)";
            item.style.border = "1px solid var(--dock-border)";
            item.style.borderRadius = "8px";

            item.innerHTML = `
                <b>${u.name}</b> (v${u.version})<br>
                <small style="opacity:0.6">${u.changelog || ''}</small>
            `;

            const del = document.createElement("button");
            del.innerText = "Remove";
            del.style.marginTop = "8px";
            del.style.background = "#ff5f56";
            del.style.color = "#fff";

            del.onclick = () => removeMUpdate(u.name, u.version);

            item.appendChild(document.createElement("br"));
            item.appendChild(del);

            container.appendChild(item);
        });
    }

    panel.appendChild(container);
}

// --- AUTO INJECT INTO SETTINGS ---
setTimeout(() => {
    const observer = new MutationObserver(() => {
        const panels = document.querySelectorAll('[id^="set_view_"]');

        panels.forEach(panel => {
            if (panel.querySelector('#mupdate-btn')) return;

            if (panel.innerText.includes("Developer")) {
                // Upload button
                const btn = document.createElement("button");
                btn.id = "mupdate-btn";
                btn.className = "primary-btn";
                btn.innerText = "📦 Install .mupdate Update";
                btn.style.marginTop = "10px";

                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".mupdate";
                input.hidden = true;

                btn.onclick = () => input.click();
                input.onchange = () => {
                    if (input.files[0]) installMUpdate(input.files[0]);
                };

                panel.appendChild(document.createElement("br"));
                panel.appendChild(btn);
                panel.appendChild(input);

                // Add update manager UI
                renderUpdateManager(panel);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}, 1000);

// --- GLOBAL AUTO-DETECT .mupdate ---
document.addEventListener('change', function(e) {
    const fileInput = e.target;
    if (fileInput.type === "file" && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        if (file.name.endsWith(".mupdate")) {
            installMUpdate(file);
        }
    }
});