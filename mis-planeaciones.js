(() => {
  function escapeHtml(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function render(){
    const list=document.querySelector('#mis .list');
    if(!list)return;
    list.querySelectorAll('.saved-plan').forEach(e=>e.remove());
    const plans=JSON.parse(localStorage.getItem('planeanem_planes')||'[]');
    plans.forEach(p=>{
      const a=document.createElement('article');
      a.className='saved-plan';
      a.style.cssText='display:flex!important;align-items:center!important;justify-content:space-between!important;width:100%!important;gap:20px!important;padding:18px!important;margin:0 0 12px!important;border:1px solid #e2e4eb!important;border-radius:12px!important;background:#fff!important;min-height:82px!important;';
      a.innerHTML=`<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0"><span style="font-size:28px">📚</span><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><b style="display:block!important;flex:none!important;overflow-wrap:anywhere">${escapeHtml(p.title)}</b><span style="color:#737b8d;font-size:11px">${escapeHtml(p.grade)} · ${escapeHtml(p.field)} · ${escapeHtml(p.scenario||'')}</span><small style="color:#999">${escapeHtml(p.created||'')}</small></div></div><div class="planeanem-actions" style="display:flex!important;visibility:visible!important;opacity:1!important;gap:8px!important;flex-shrink:0!important"><button type="button" data-action="edit" style="display:inline-flex!important;visibility:visible!important;opacity:1!important;border:0;border-radius:9px;padding:10px 14px;cursor:pointer;font-weight:800;background:#eef5ff;color:#2767a8">✏️ Editar</button><button type="button" data-action="delete" style="display:inline-flex!important;visibility:visible!important;opacity:1!important;border:0;border-radius:9px;padding:10px 14px;cursor:pointer;font-weight:800;background:#fff0f0;color:#c33">🗑️ Eliminar</button></div>`;
      a.querySelector('[data-action="edit"]').onclick=()=>{
        if(typeof window.fillForm==='function') window.fillForm(p); else {document.querySelector('[data-view="nueva"]')?.click();}
      };
      a.querySelector('[data-action="delete"]').onclick=()=>{
        if(confirm('¿Eliminar esta planeación?')){
          const next=plans.filter(x=>x.id!==p.id);localStorage.setItem('planeanem_planes',JSON.stringify(next));render();
        }
      };
      list.appendChild(a);
    });
  }
  window.renderPlaneaNEMSavedPlans=render;
  const mis=document.querySelector('[data-view="mis"]');
  mis?.addEventListener('click',()=>setTimeout(render,30));
  document.querySelectorAll('[data-view="mis"]').forEach(x=>x.addEventListener('click',()=>setTimeout(render,30)));
  render();
})();