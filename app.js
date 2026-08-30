/* PlaneaNEM - navegación y asistente | interfaz Mis planeaciones v46 */
(function(){
'use strict';
function init(){
  const views=[...document.querySelectorAll('.view')];
  const items=[...document.querySelectorAll('[data-view]')];
  const steps=[...document.querySelectorAll('.step')];
  const form=document.getElementById('form');
  const grade=document.getElementById('grade');
  const phase=document.getElementById('phase');
  const field=document.getElementById('field');
  const content=document.getElementById('content');
  const pda=document.getElementById('pda');
  const duration=document.getElementById('duration');
const scenario=document.getElementById('scenario');
const methodology=document.getElementById('methodology');
const projectName=document.getElementById('projectName');
const context=document.getElementById('context');
  const bapOther=document.getElementById('bapOther');
  const phaseByGrade={1:3,2:3,3:4,4:4,5:5,6:5};

  function show(id){
    views.forEach(v=>v.classList.toggle('active',v.id===id));
    items.forEach(x=>x.classList.toggle('active',x.dataset.view===id));
    if(id==='nueva') setTimeout(refresh,50);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  items.forEach(x=>x.addEventListener('click',function(e){
  e.preventDefault();

  const view = this.dataset.view;

  show(view);

  if(view === 'inicio'){
    updateHomeStats();
renderHomeRecentPlannings();
  }
  if(view === 'mis'){
    renderSavedPlannings();
  }
  if(view === 'favoritos'){
  renderFavoritePlannings();
}
}));

  function clean(s){
    return String(s??'')
      .replace(/[\u00ad\u200b\u200c\u200d]/g,'')
      .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s*(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g,'$1')
      .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])\s*[-–—]\s*(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g,'$1')
      .replace(/\r?\n+/g,' ').replace(/\s+/g,' ').trim();
  }
  function normalizeCurriculum(obj){
    if(!obj||typeof obj!=='object')return obj;
    Object.keys(obj).forEach(key=>{const value=obj[key];if(typeof value==='string')obj[key]=clean(value);else if(value&&typeof value==='object')normalizeCurriculum(value);});
    return obj;
  }
  function dataFor(ph){
    const data=window['PLANEAnEM_FASE_'+ph];
    const base=data&&data['FASE '+ph];
    return base?normalizeCurriculum(base):null;
  }
  function loadPhase(ph){
    if(dataFor(ph))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='curriculum/fase'+ph+'.js?v=30';
      s.onload=()=>dataFor(ph)?resolve():reject(new Error('Base vacía'));
      s.onerror=()=>reject(new Error('No se pudo cargar fase '+ph));
      document.head.appendChild(s);
    });
  }
  function gradeNum(){return Number((grade?.value.match(/\d+/)||['1'])[0]);}
  function itemsFor(){const g=gradeNum(),ph=phaseByGrade[g]||3;return dataFor(ph)?.[field.value]?.grades?.[g]||[];}
  async function refresh(){
    if(!grade||!phase||!field||!content)return;
    const ph=phaseByGrade[gradeNum()]||3;
    phase.value='Fase '+ph; phase.disabled=true;
    const arr=itemsFor();
    if(arr.length){fill(arr);return;}
    content.innerHTML='<option value="">Cargando contenidos...</option>';
    try{await loadPhase(ph);fill(itemsFor());}
    catch(e){console.error(e);content.innerHTML='<option value="">No se pudo cargar la base curricular</option>';}
  }
  function fill(arr){
    content.innerHTML='';
    if(!arr.length){content.innerHTML='<option value="">No hay contenidos disponibles</option>';renderPdas(null);return;}
    arr.forEach((it,i)=>{const o=document.createElement('option');o.value=i;o.textContent=clean(it.content);content.appendChild(o);});
    content.selectedIndex=0;renderPdas(arr[0]);
  }
  function splitPdas(raw){
    if (!raw) return [];

    let text = String(raw);

    // Eliminar caracteres invisibles.
    text = text.replace(/[\u00ad\u200b\u200c\u200d]/g, '');

    // Unir palabras que fueron partidas por salto de línea.
    text = text.replace(
        /([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s+/g,
        '$1'
    );

    // Convertir saltos de línea en espacios.
    text = text.replace(/\r?\n/g, ' ');

    // Normalizar espacios.
    text = text.replace(/\s+/g, ' ').trim();

    if (!text) return [];

    /*
     * Cada oración terminada en punto, interrogación
     * o exclamación será un PDA independiente.
     */
    const resultado = [];

    let inicio = 0;

    for (let i = 0; i < text.length; i++) {

        const caracter = text[i];

        if (
            caracter === '.' ||
            caracter === '!' ||
            caracter === '?'
        ) {

            const oracion = text
                .slice(inicio, i + 1)
                .trim();

            if (oracion) {
                resultado.push(oracion);
            }

            inicio = i + 1;
        }
    }

    // Agregar cualquier texto que haya quedado después
    // del último signo de puntuación.
    const restante = text
        .slice(inicio)
        .trim();

    if (restante) {
        resultado.push(restante);
    }

    // Limpiar numeraciones al inicio.
    return resultado
        .map((pda, index) => {

            return pda
                .replace(
                    /^\s*\d+[\.)]?\s*/,
                    ''
                )
                .trim();

        })
        .filter(Boolean);
}
  function renderPdas(item){
    if(!pda)return;pda.innerHTML='';
    const texts=splitPdas(item?.pda);
    if(!texts.length){pda.innerHTML='<div class="pda-empty">Selecciona un contenido para consultar sus PDA.</div>';return;}
    texts.forEach((text,i)=>{
      const label=document.createElement('label');label.className='pda-choice';
      const input=document.createElement('input');input.type='checkbox';input.name='pdas';input.value=text;input.checked=true;
      const n=document.createElement('span');n.className='pda-number';n.textContent=i+1;
      const body=document.createElement('span');body.className='pda-text';body.textContent=text;
      label.append(input,n,body);pda.appendChild(label);
    });
  }
  function showStep(n){document.querySelectorAll('.wizard-panel').forEach((p,i)=>p.classList.toggle('active',i===n));steps.forEach((s,i)=>s.classList.toggle('active',i===n));}
  steps.forEach((s,i)=>{
  s.addEventListener('click',()=>{
    showStep(i);

    if(i===4 && typeof window.updatePlanningReview==='function'){
      window.updatePlanningReview();
    }
  });
});

document.querySelectorAll('.wizard-next').forEach(b=>{
  b.addEventListener('click',()=>{
    const panel = b.closest('.wizard-panel');
    const index = [...document.querySelectorAll('.wizard-panel')].indexOf(panel);
    const next = Math.min(4,index+1);

    showStep(next);

    if(next===4 && typeof window.updatePlanningReview==='function'){
      window.updatePlanningReview();
    }
  });
});

document.querySelectorAll('.wizard-prev').forEach(b=>{
  b.addEventListener('click',()=>{
    const panel = b.closest('.wizard-panel');
    const index = [...document.querySelectorAll('.wizard-panel')].indexOf(panel);
    const previous = Math.max(0,index-1);

    showStep(previous);

    if(previous===4 && typeof window.updatePlanningReview==='function'){
      window.updatePlanningReview();
    }
  });
});
const bapInputs = [...document.querySelectorAll('input[name="bap"]')];
  const noBap = bapInputs.find(input =>
    input.value === 'No se identifican barreras para el aprendizaje y la comunicación'
  );

  bapInputs.forEach(input => {
    input.addEventListener('change', () => {
      if(input === noBap && input.checked){
        bapInputs.forEach(other => {
          if(other !== noBap) other.checked = false;
        });
      }else if(input !== noBap && input.checked && noBap){
        noBap.checked = false;
      }
    });
  });

  grade?.addEventListener('change',refresh);field?.addEventListener('change',refresh);
  content?.addEventListener('change',()=>{const arr=itemsFor();renderPdas(arr[Number(content.value)]);});
  function getSelectedPdas(){
  return [...document.querySelectorAll('#pda input[name="pdas"]:checked')]
    .map(input => input.value.trim())
    .filter(Boolean);
}

function getSelectedAxes(){
  return [...document.querySelectorAll('.axes-box input[type="checkbox"]:checked')]
    .map(input => input.parentElement.textContent.trim())
    .filter(Boolean);
}

function getSelectedBap(){
  return [...document.querySelectorAll('input[name="bap"]:checked')]
    .map(input => input.value.trim())
    .filter(Boolean);
}
function getBapOther(){
  return document.getElementById('bapOther')?.value.trim() || '';
}

function collectPlanningData(){
  const arr = itemsFor();
  const selectedIndex = Number(content?.value);
  const selectedContent = arr[selectedIndex];

  return {
    schoolName: document.getElementById('schoolName')?.value.trim() || '',
    schoolCct: document.getElementById('schoolCct')?.value.trim() || '',
    schoolLocality: document.getElementById('schoolLocality')?.value.trim() || '',
    schoolZone: document.getElementById('schoolZone')?.value.trim() || '',
    startDate: document.getElementById('startDate')?.value || '',

    grade: grade?.value || '',
    phase: phase?.value || '',
    field: field?.value || '',
    duration: document.getElementById('duration')?.value || '',

    scenario: document.getElementById('scenario')?.value || '',
    methodology: document.getElementById('methodology')?.value || '',
    projectName: document.getElementById('projectName')?.value.trim() || '',

    axes: getSelectedAxes(),

    content: selectedContent?.content || '',
    pdas: getSelectedPdas(),

    context: document.getElementById('context')?.value.trim() || '',
    bap: getSelectedBap(),
    bapOther: getBapOther()
  };
}

function renderPlanningReview(data){
  const review = document.getElementById('planning-review');
  if(!review) return;

  const esc = value => String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  const list = (items, empty='No se seleccionó información.') => {
    if(!items || !items.length){
      return `<div class="review-empty">${empty}</div>`;
    }

    return `
      <ul class="review-list">
        ${items.map(item => `<li>${esc(item)}</li>`).join('')}
      </ul>
    `;
  };

  review.innerHTML = `
    <div class="review-section">
      <div class="review-title">🏫 Datos generales</div>
      <div class="review-grid">
        <div><strong>Escuela</strong><span>${esc(data.schoolName) || 'No indicado'}</span></div>
        <div><strong>CCT</strong><span>${esc(data.schoolCct) || 'No indicado'}</span></div>
        <div><strong>Localidad</strong><span>${esc(data.schoolLocality) || 'No indicada'}</span></div>
        <div><strong>Zona escolar</strong><span>${esc(data.schoolZone) || 'No indicada'}</span></div>
        <div><strong>Fecha de inicio</strong><span>${esc(data.startDate) || 'No indicada'}</span></div>
      </div>
    </div>

    <div class="review-section">
      <div class="review-title">📚 Datos curriculares</div>
      <div class="review-grid">
        <div><strong>Grado</strong><span>${esc(data.grade)}</span></div>
        <div><strong>Fase</strong><span>${esc(data.phase)}</span></div>
        <div><strong>Campo formativo</strong><span>${esc(data.field)}</span></div>
        <div><strong>Duración</strong><span>${esc(data.duration)}</span></div>
      </div>

      <div class="review-content">
        <strong>Contenido</strong>
        <p>${esc(data.content) || 'No seleccionado'}</p>
      </div>

      <div class="review-content">
        <strong>PDA seleccionados (${data.pdas.length})</strong>
        ${list(data.pdas, 'No se seleccionaron PDA.')}
      </div>
    </div>

    <div class="review-section">
      <div class="review-title">🎯 Proyecto</div>
      <div class="review-grid">
        <div><strong>Escenario</strong><span>${esc(data.scenario)}</span></div>
        <div><strong>Metodología</strong><span>${esc(data.methodology)}</span></div>
        <div><strong>Nombre del proyecto</strong><span>${esc(data.projectName) || 'No indicado'}</span></div>
      </div>

      <div class="review-content">
        <strong>Ejes articuladores</strong>
        ${list(data.axes, 'No se seleccionaron ejes articuladores.')}
      </div>
    </div>

    <div class="review-section">
      <div class="review-title">♿ Barreras para el aprendizaje y la comunicación (BAP)</div>
      ${list(data.bap, 'No se identificaron BAP.')}
      ${data.bapOther ? `<div class="review-content"><strong>Precisiones</strong><p>${esc(data.bapOther)}</p></div>` : ''}
    </div>

    <div class="review-section">
      <div class="review-title">📝 Contexto</div>
      <div class="review-context">
        ${esc(data.context) || 'No se escribió contexto.'}
      </div>
    </div>
  `;
}
function updatePlanningReview(){
  const planning = collectPlanningData();

  window.currentPlanning = planning;

  renderPlanningReview(planning);

  return planning;
}

window.updatePlanningReview = updatePlanningReview;
function savePlanning(planning){
  const key = 'planeanem_planeaciones';

  let saved = [];

  try{
    saved = JSON.parse(
      localStorage.getItem(key) || '[]'
    );
  }catch(error){
    console.error('Error leyendo planeaciones:', error);
    saved = [];
  }

  // Si existe una planeación abierta, actualizarla.
  if(window.currentPlanningId){

    const index = saved.findIndex(
      item => Number(item.id) === Number(window.currentPlanningId)
    );

    if(index >= 0){

      const updated = {
        ...saved[index],
        ...planning,
        id: saved[index].id,
        createdAt: saved[index].createdAt,
        updatedAt: new Date().toISOString(),
        status: 'borrador'
      };

      saved[index] = updated;

      localStorage.setItem(
        key,
        JSON.stringify(saved)
      );

      return updated;
    }
  }

  // Si no existe una planeación abierta, crear una nueva.
  const record = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    status: 'borrador',
    ...planning
  };

  saved.unshift(record);

  localStorage.setItem(
    key,
    JSON.stringify(saved)
  );

  return record;
}
function updateMisStats(saved){
  const stats = document.querySelector('#misStats');
  if(!stats) return;

  const total = saved.length;
  const favorites = saved.filter(item => item.favorite === true).length;
  const complete = saved.filter(item => {
    const status = String(item.status || '').toLowerCase();
    return status === 'completada' || status === 'completa' || status === 'completo';
  }).length;
  const editing = Math.max(0, total - complete);

  const values = stats.querySelectorAll('.mis-stat b');
  if(values[0]) values[0].textContent = total;
  if(values[1]) values[1].textContent = complete;
  if(values[2]) values[2].textContent = editing;
  if(values[3]) values[3].textContent = favorites;
}

/* =========================================================
   INICIO — ESTADÍSTICAS CONECTADAS A LAS PLANEACIONES REALES
   ========================================================= */
function updateHomeStats(){
  const totalEl = document.getElementById('homeStatTotal');
  const favEl = document.getElementById('homeStatFavorites');
  const lastEl = document.getElementById('homeStatLast');
  const planEl = document.getElementById('homeStatPlan');

  if(!totalEl && !favEl && !lastEl && !planEl) return;

  let saved = [];
  try{
    saved = JSON.parse(
      localStorage.getItem('planeanem_planeaciones') || '[]'
    );
    if(!Array.isArray(saved)) saved = [];
  }catch(error){
    console.error('Error leyendo estadísticas de inicio:', error);
    saved = [];
  }

  const total = saved.length;
  const favorites = saved.filter(item => item.favorite === true).length;

  if(totalEl) totalEl.textContent = total;
  if(favEl) favEl.textContent = favorites;

  if(lastEl){
    if(!saved.length){
      lastEl.textContent = 'Sin planeaciones';
      lastEl.title = '';
    }else{
      const latest = [...saved].sort((a,b)=>{
        const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return db - da;
      })[0];

      const raw = latest.updatedAt || latest.createdAt;
      const date = new Date(raw);

      if(!Number.isNaN(date.getTime())){
        lastEl.textContent = date.toLocaleDateString('es-MX',{
          day:'numeric',
          month:'short',
          year:'numeric'
        }).replace(/\.$/,'');
        lastEl.title = date.toLocaleString('es-MX');
      }else{
        lastEl.textContent = 'Sin fecha';
        lastEl.title = '';
      }
    }
  }

  /*
    El sistema de suscripciones todavía no está conectado a cuentas.
    Si posteriormente existe una clave de plan, la tarjeta la toma;
    de lo contrario conserva GRATUITO.
  */
  if(planEl){
    const possiblePlanKeys = [
      'planeanem_plan',
      'planActual',
      'subscriptionPlan',
      'planeanem_subscription'
    ];

    let plan = null;
    for(const key of possiblePlanKeys){
      const value = localStorage.getItem(key);
      if(value){
        plan = value;
        break;
      }
    }

    if(typeof plan === 'string'){
      try{
        const parsed = JSON.parse(plan);
        if(parsed && typeof parsed === 'object'){
          plan = parsed.name || parsed.plan || parsed.type || plan;
        }
      }catch(_){}
    }

    planEl.textContent = String(plan || 'GRATUITO').toUpperCase();
  }
}

function renderHomeRecentPlannings(){
  const container=document.querySelector('#inicio .recent-card');
  if(!container)return;

  let saved=[];
  try{saved=JSON.parse(localStorage.getItem('planeanem_planeaciones')||'[]');}
  catch(error){console.error('Error leyendo planeaciones recientes:',error);}

  const esc=value=>String(value??'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const fieldIcon=field=>{
    const f=String(field||'');
    if(f.includes('Lenguajes'))return '📖';
    if(f.includes('Saberes y Pensamiento'))return '🔬';
    if(f.includes('Naturaleza y Sociedades'))return '🌿';
    if(f.includes('Humano y lo Comunitario'))return '❤️';
    return '📚';
  };

  const recent=[...saved].sort((a,b)=>{
    const da=new Date(a.updatedAt||a.createdAt||0).getTime();
    const db=new Date(b.updatedAt||b.createdAt||0).getTime();
    return db-da;
  }).slice(0,3);

  let html=`<div class="recent-head"><h2>📚 Planeaciones recientes</h2><a href="#" id="homeRecentAll">Ver todas</a></div>`;

  if(!recent.length){
    html+=`<div class="home-recent-empty"><div class="home-recent-empty-icon">📚</div><strong>Aún no tienes planeaciones</strong><p>Crea tu primera planeación para verla aquí.</p></div>`;
  }else{
    html+=recent.map(planning=>{
      const raw=planning.updatedAt||planning.createdAt;
      let date='Sin fecha';
      if(raw){const d=new Date(raw);if(!Number.isNaN(d.getTime()))date=d.toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});}
      return `<article class="home-recent-item" data-id="${esc(planning.id)}" tabindex="0" role="button">
        <span class="recent-icon">${fieldIcon(planning.field)}</span>
        <div class="home-recent-main">
          <b>${esc(planning.projectName||'Planeación sin nombre')}</b>
          <p>${esc(planning.grade||'Grado no indicado')}${planning.field?' · '+esc(planning.field):''}</p>
          <small>${esc(planning.phase||'Fase no indicada')} · ${esc(date)}</small>
        </div>
        <i class="home-recent-arrow">›</i>
      </article>`;
    }).join('');
    html+=`<button type="button" class="all-btn" id="homeRecentAllBtn">📚 Ver todas mis planeaciones</button>`;
  }

  container.innerHTML=html;

  const goAll=()=>document.querySelector('[data-view="mis"]')?.click();
  container.querySelector('#homeRecentAll')?.addEventListener('click',e=>{e.preventDefault();goAll();});
  container.querySelector('#homeRecentAllBtn')?.addEventListener('click',goAll);

  container.querySelectorAll('.home-recent-item').forEach(item=>{
    const open=()=>{
      const id=Number(item.dataset.id);
      if(typeof window.openSavedPlanning==='function')window.openSavedPlanning(id);
      else{document.querySelector('[data-view="mis"]')?.click();}
    };
    item.addEventListener('click',open);
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
}

function renderSavedPlannings(){

  const list = document.querySelector('#mis .list');

  if(!list) return;

  let saved = [];

  try{
    saved = JSON.parse(
      localStorage.getItem('planeanem_planeaciones') || '[]'
    );
  }catch(error){
    console.error('Error al cargar las planeaciones:', error);
    saved = [];
  }

  updateMisStats(saved);

  if(!saved.length){

    list.innerHTML = `
      <div class="saved-empty">
        <div class="saved-empty-icon">📚</div>
        <h3>Aún no tienes planeaciones</h3>
        <p>Las planeaciones que guardes aparecerán aquí.</p>
      </div>
    `;

    return;
  }

  const esc = value => String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  list.innerHTML = saved.map(planning => {

    const title =
      planning.projectName ||
      'Nombre del proyecto';

const fieldIcon =
  planning.field === 'Lenguajes' ? '📖' :
  planning.field === 'Saberes y Pensamiento Científico' ? '🔬' :
  planning.field === 'Ética, Naturaleza y Sociedades' ? '🌿' :
  planning.field === 'De lo Humano y lo Comunitario' ? '❤️' :
  '📚';
    const date = planning.updatedAt || planning.createdAt
      ? new Date(
          planning.updatedAt || planning.createdAt
        ).toLocaleDateString('es-MX',{
          day:'numeric',
          month:'long',
          year:'numeric'
        })
      : 'Sin fecha';

    const pdaCount =
      Array.isArray(planning.pdas)
        ? planning.pdas.length
        : 0;

    const axesCount =
      Array.isArray(planning.axes)
        ? planning.axes.length
        : 0;

    return `
  <article
    class="saved-planning"
    data-id="${planning.id}">

    <div class="saved-planning-icon">
      ${fieldIcon}
    </div>

    <div class="saved-planning-main">

      <div class="saved-planning-title-row">

        <div>
          <h3>${esc(title)}</h3>

          <p class="saved-planning-subtitle">
            ${esc(planning.grade || 'Grado no indicado')}
            ${planning.field ? ' · ' + esc(planning.field) : ''}
            ${planning.phase ? ' · ' + esc(planning.phase) : ''}
          </p>
        </div>

        <span class="planning-status">
          ${planning.favorite ? '⭐ Favorita' : '📄 Planeación'}
        </span>

      </div>

      <div class="saved-planning-content">

        <strong>📖 Contenido</strong>

        <p>
          ${esc(
            planning.content ||
            'Contenido no indicado'
          )}
        </p>

      </div>

      <div class="saved-planning-meta">

        <span>☑️ ${pdaCount} PDA</span>

        <span>🎯 ${axesCount} ejes</span>

        <span>📅 ${esc(date)}</span>

      </div>

    </div>

    <div class="saved-planning-actions">

      <button
        type="button"
        class="favorite-planning"
        data-id="${planning.id}">
        ${planning.favorite
          ? '⭐ En favoritos'
          : '☆ Agregar a favoritos'}
      </button>

      <button
        type="button"
        class="open-planning"
        data-id="${planning.id}">
        ✏️ Abrir / Editar
      </button>

      <button
        type="button"
        class="delete-planning"
        data-id="${planning.id}">
        🗑️ Eliminar
      </button>

    </div>

  </article>
`;

  }).join('');

  list.querySelectorAll('.delete-planning').forEach(button => {

    button.addEventListener('click', () => {

      const id = Number(button.dataset.id);

      if(!confirm('¿Deseas eliminar esta planeación?')){
        return;
      }

      const current = JSON.parse(
        localStorage.getItem('planeanem_planeaciones') || '[]'
      );

      const updated = current.filter(
        planning => planning.id !== id
      );

      localStorage.setItem(
        'planeanem_planeaciones',
        JSON.stringify(updated)
      );

      updateHomeStats();
      renderSavedPlannings();

    });

  });

  list.querySelectorAll('.open-planning').forEach(button => {

    button.addEventListener('click', () => {

      openSavedPlanning(
        Number(button.dataset.id)
      );

    });

  });
    list.querySelectorAll('.favorite-planning').forEach(button => {

  button.addEventListener('click', function () {

    const id = Number(this.dataset.id);

    console.log('Favorito pulsado. ID:', id);

    let saved;

    try {

      saved = JSON.parse(
        localStorage.getItem('planeanem_planeaciones') || '[]'
      );

    } catch (error) {

      console.error('No se pudieron leer las planeaciones:', error);
      return;

    }

    const planning = saved.find(
      item => Number(item.id) === id
    );

    if (!planning) {

      console.error(
        'No se encontró la planeación con ID:',
        id
      );

      return;
    }

    planning.favorite = planning.favorite !== true;

    console.log(
      'Estado favorito:',
      planning.favorite
    );

    localStorage.setItem(
      'planeanem_planeaciones',
      JSON.stringify(saved)
    );

    updateHomeStats();

    this.innerHTML = planning.favorite
      ? '⭐ En favoritos'
      : '⭐ Agregar a favoritos';

    // Actualizar inmediatamente ambas vistas para que el favorito
    // aparezca en Favoritos sin necesidad de recargar la página.
    renderSavedPlannings();
    if(document.querySelector('#favoritos.active')){
      renderFavoritePlannings();
    }

  });

});

}
window.openSavedPlanning = function(id){
  let saved = [];

  try{
    saved = JSON.parse(
      localStorage.getItem('planeanem_planeaciones') || '[]'
    );
  }catch(error){
    console.error('Error al leer las planeaciones:', error);
    return;
  }

  const planning = saved.find(
  item => Number(item.id) === Number(id)
);

  if(!planning){
    alert('No se encontró la planeación.');
    return;
  }

  window.currentPlanning = planning;
  window.currentPlanningId = planning.id;

  // Ir a Nueva planeación
  show('nueva');

  // Datos generales
  document.getElementById('schoolName').value =
    planning.schoolName || '';

  document.getElementById('schoolCct').value =
    planning.schoolCct || '';

  document.getElementById('schoolLocality').value =
    planning.schoolLocality || '';

  document.getElementById('schoolZone').value =
    planning.schoolZone || '';

  document.getElementById('startDate').value =
    planning.startDate || '';

  // Datos curriculares
  if(grade){
    grade.value = planning.grade || grade.value;
  }

  if(field){
    field.value = planning.field || field.value;
  }

  if(duration){
    duration.value = planning.duration || duration.value;
  }

  // Proyecto
  if(scenario){
    scenario.value = planning.scenario || scenario.value;
  }

  if(methodology){
    methodology.value = planning.methodology || methodology.value;
  }

  if(projectName){
    projectName.value = planning.projectName || '';
  }

  // Contexto
  if(context){
    context.value = planning.context || '';
  }

  const selectedBap = new Set(
    (planning.bap || []).map(bap => clean(bap))
  );

  document.querySelectorAll('input[name="bap"]').forEach(input => {
    input.checked = selectedBap.has(clean(input.value));
  });

  if(bapOther){
    bapOther.value = planning.bapOther || '';
  }

  // Actualizar contenidos de acuerdo con grado/campo
  refresh();

  setTimeout(()=>{
    const arr = itemsFor();

    const index = arr.findIndex(
      item => clean(item.content) === clean(planning.content)
    );

    if(index >= 0){

      content.value = String(index);

      renderPdas(arr[index]);

      setTimeout(()=>{

        // Restaurar PDA
        const selectedPdas = new Set(
          (planning.pdas || []).map(pda => clean(pda))
        );

        document
          .querySelectorAll('#pda input[type="checkbox"]')
          .forEach(input => {
            input.checked = selectedPdas.has(
              clean(input.value)
            );
          });

        // Restaurar ejes
        const selectedAxes = new Set(
          (planning.axes || []).map(axis => clean(axis))
        );

        document
          .querySelectorAll('.axes-box label')
          .forEach(label => {

            const input =
              label.querySelector('input[type="checkbox"]');

            if(!input) return;

            const text =
              [...label.childNodes]
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent)
                .join('')
                .trim();

            input.checked =
              selectedAxes.has(clean(text));
          });

        // Actualizar revisión
        renderPlanningReview(planning);

        // Ir al paso 5 (Generar)
        showStep(4);

      },150);
    }

  },250);
}
function handleSavePlanning(){

  const planning = collectPlanningData();

  if(!planning.content){
    alert('Selecciona un contenido antes de guardar la planeación.');
    return;
  }

  if(!planning.pdas.length){
    alert('Selecciona al menos un PDA antes de guardar la planeación.');
    return;
  }

  window.currentPlanning = planning;

  const wasEditing = !!window.currentPlanningId;

  const saved = savePlanning(planning);

  window.currentPlanningId = saved.id;

  renderPlanningReview(saved);

  updateHomeStats();
  renderHomeRecentPlannings();

  renderSavedPlannings();

  if(wasEditing){
    alert('Cambios guardados correctamente.');
  }else{
    alert('Planeación guardada correctamente.');
  }
}
  document.getElementById('savePlanningBtn')
  ?.addEventListener('click', handleSavePlanning);  document.getElementById('gradeBtn')?.addEventListener('click',()=>{show('nueva');grade?.focus();});
  document.getElementById('fieldBtn')?.addEventListener('click',()=>{show('nueva');field?.focus();});
  const st=document.createElement('style');st.textContent='.pda-list,.pda-choice{box-sizing:border-box}.pda-choice{display:flex!important;align-items:flex-start;gap:11px;padding:13px!important;margin:0 0 8px!important;background:#fff!important;border:2px solid #e6e0f2!important;border-radius:12px!important;cursor:pointer!important;font-size:13px!important;line-height:1.45}.pda-choice input{width:18px!important;height:18px!important;margin:2px 0 0!important;flex:none;accent-color:#743bd0}.pda-number{font-weight:900;color:#7147c5;min-width:18px}.pda-text{flex:1}.pda-choice:has(input:checked){border-color:#b99be9!important;background:#f8f3ff!important}.pda-empty{padding:12px;border-radius:10px;background:#f7f5fa;color:#777}';document.head.appendChild(st);
  refresh();
  renderHomeRecentPlannings();
  show('inicio');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
function renderFavoritePlannings() {
  updateHomeStats();

  const panel = document.querySelector('#favoritos .favorites-panel');

  if (!panel) return;

  let saved = [];

  try {

    saved = JSON.parse(
      localStorage.getItem('planeanem_planeaciones') || '[]'
    );

  } catch (error) {

    console.error('Error leyendo planeaciones:', error);
    return;

  }

  const favorites = saved.filter(
    planning => planning.favorite === true
  );

  if (favorites.length === 0) {

    panel.innerHTML = `

      <div class="favorites-header">

        <div>
          <h2>⭐ Mis favoritos</h2>
          <p>Guarda aquí las planeaciones que quieras consultar rápidamente.</p>
        </div>

        <span class="favorites-count">
          0 favoritos
        </span>

      </div>

      <div class="favorites-empty">

        <div class="favorites-empty-icon">⭐</div>

        <h3>Aún no tienes favoritos</h3>

        <p>
          Cuando marques una planeación como favorita,
          aparecerá aquí para que puedas acceder a ella rápidamente.
        </p>

        <button
  type="button"
  class="favorites-go"
  onclick="document.querySelector('[data-view=mis]').click()">
  📚 Ver mis planeaciones
</button>

      </div>

    `;

    return;
  }

  panel.innerHTML = `

    <div class="favorites-header">

      <div>
        <h2>⭐ Mis favoritos</h2>
        <p>Tus planeaciones favoritas.</p>
      </div>

      <span class="favorites-count">
        ${favorites.length}
        ${favorites.length === 1 ? 'favorito' : 'favoritos'}
      </span>

    </div>

    <div class="favorites-list">

      ${favorites.map(planning => {

    const fieldText = String(planning.field || '').trim();
    const fieldIcon =
      fieldText.includes('Lenguajes') ? '📖' :
      fieldText.includes('Saberes y Pensamiento') ? '🔬' :
      fieldText.includes('Naturaleza y Sociedades') ? '🌿' :
      fieldText.includes('Humano y lo Comunitario') ? '❤️' :
      '📚';

    return `

        <article class="saved-planning favorite-card">

          <div class="saved-planning-icon">
            ${fieldIcon}
          </div>

          <div class="saved-planning-main">

            <h3>
              ${planning.projectName || 'Planeación sin nombre'}
            </h3>

            <p>
              ${planning.grade || ''}
              ${planning.field ? ' · ' + planning.field : ''}
              ${planning.phase ? ' · ' + planning.phase : ''}
            </p>

            <div class="saved-planning-meta">

              <span>
                ⭐ Favorito
              </span>

            </div>

          </div>

          <div class="saved-planning-actions">

            <button
              type="button"
              class="open-favorite"
              data-id="${planning.id}">
              ✏️ Abrir / Editar
            </button>

            <button
              type="button"
              class="remove-favorite"
              data-id="${planning.id}">
              ⭐ Quitar
            </button>

          </div>

        </article>

      `;
  }).join('')}

    </div>

  `;


  panel.querySelectorAll('.open-favorite').forEach(button => {

  button.addEventListener('click', function () {

    const id = Number(this.dataset.id);

    console.log('Editando favorito:', id);

    if (typeof window.openSavedPlanning !== 'function') {
      console.error('openSavedPlanning no está disponible');
      return;
    }

    window.openSavedPlanning(id);

  });

});

  panel.querySelectorAll('.remove-favorite').forEach(button => {

    button.addEventListener('click', () => {

      const id = Number(button.dataset.id);

      let saved = [];

      try {

        saved = JSON.parse(
          localStorage.getItem('planeanem_planeaciones') || '[]'
        );

      } catch (error) {

        console.error('Error leyendo planeaciones:', error);
        return;

      }

      const planning = saved.find(
        item => Number(item.id) === id
      );

      if (!planning) return;

      planning.favorite = false;

      localStorage.setItem(
        'planeanem_planeaciones',
        JSON.stringify(saved)
      );

      renderFavoritePlannings();
      renderSavedPlannings();

    });

  });

}
/* ==========================================================
   PLAN CON IA — CONTROL DEL MENÚ MÓVIL
   ========================================================== */
(function(){
  function initMobileMenu(){
    const btn=document.getElementById('mobileMenuBtn');
    const menu=document.getElementById('mobileMenu');
    const close=document.getElementById('mobileMenuClose');
    const overlay=document.getElementById('mobileMenuOverlay');
    if(!btn || !menu) return;

    const closeMenu=()=>{
      document.body.classList.remove('mobile-menu-open');
      btn.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-hidden','true');
      if(overlay) overlay.setAttribute('aria-hidden','true');
    };
    const openMenu=()=>{
      if(window.innerWidth>800) return;
      document.body.classList.add('mobile-menu-open');
      btn.setAttribute('aria-expanded','true');
      menu.setAttribute('aria-hidden','false');
      if(overlay) overlay.setAttribute('aria-hidden','false');
    };

    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.contains('mobile-menu-open') ? closeMenu() : openMenu();
    });
    close?.addEventListener('click',e=>{e.preventDefault();closeMenu();});
    overlay?.addEventListener('click',closeMenu);
    menu.querySelectorAll('[data-view]').forEach(item=>item.addEventListener('click',closeMenu));
    document.addEventListener('keydown',e=>{if(e.key==='Escape') closeMenu();});
    window.addEventListener('resize',()=>{if(window.innerWidth>800) closeMenu();});
    closeMenu();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initMobileMenu,{once:true});
  else initMobileMenu();
})();
