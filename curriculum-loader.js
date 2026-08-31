(() => {
  const grade = document.getElementById('grade');
  const phase = document.getElementById('phase');
  const field = document.getElementById('field');
  const content = document.getElementById('content');
  const pda = document.getElementById('pda');
  if (!grade || !phase || !field || !content || !pda) return;

  const phaseByGrade = { '1':'3', '2':'3', '3':'4', '4':'4', '5':'5', '6':'5' };
  const files = {
    '3': () => window.PLANEAnEM_FASE_3,
    '4': () => window.PLANEAnEM_FASE_4,
    '5': () => window.PLANEAnEM_FASE_5
  };

  function normalizeText(text) {
    if (!text) return '';
    return String(text)
      .replace(/[\u00AD\u200B\u200C\u200D]/g, '')
      .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, '$1$2')
      .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])\s*[-–—]\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, '$1$2')
      .replace(/\r?\n+/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  function gradeNumber() { return (grade.value.match(/\d+/) || ['1'])[0]; }
  function currentPhase() { return phaseByGrade[gradeNumber()] || '3'; }
  function curriculum() {
    const obj = files[currentPhase()]?.();
    return obj?.[`FASE ${currentPhase()}`] || null;
  }

  function setPhase() {
    const p = currentPhase();
    phase.value = `Fase ${p}`;
    phase.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function updateFields() {
    const data = curriculum();
    if (!data) return;
    const available = Object.keys(data);
    const selected = field.value;
    if (!available.includes(selected)) field.value = available[0] || '';
    updateContents();
  }

  function updateContents() {
    const data = curriculum();
    const f = data?.[field.value];
    const g = gradeNumber();
    const items = f?.grades?.[g] || [];
    content.innerHTML = '';
    if (!items.length) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = 'No hay contenidos disponibles';
      content.appendChild(o);
      pda.innerHTML = '<div class="pda-empty">Selecciona un contenido para consultar sus PDA.</div>';
      return;
    }
    items.forEach((item, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = normalizeText(item.content);
      content.appendChild(o);
    });
    updatePda();
  }

  function updatePda() {
    const data = curriculum();
    const items = data?.[field.value]?.grades?.[gradeNumber()] || [];
    const item = items[Number(content.value)] || items[0];
    pda.value = normalizeText(item?.pda || '');
  }

  grade.addEventListener('change', () => { setPhase(); updateFields(); });
  field.addEventListener('change', updateContents);
  content.addEventListener('change', updatePda);
  window.addEventListener('load', () => { setPhase(); updateFields(); });
  setPhase();
  updateFields();

  // Integra Exámenes al menú existente sin alterar los demás apartados.
  function addExamMenuLink() {
    const add = (selector, className) => {
      const nav = document.querySelector(selector);
      if (!nav || nav.querySelector('a[data-examenes-link]')) return;
      const a = document.createElement('a');
      a.href = 'examenes.html';
      a.className = className;
      a.dataset.examenesLink = 'true';
      a.innerHTML = '<span>📝</span>Exámenes';
      const favoritos = [...nav.children].find(x => x.dataset?.view === 'favoritos');
      if (favoritos) favoritos.insertAdjacentElement('afterend', a);
      else nav.appendChild(a);
    };
    add('.menu', 'menu-item');
    add('.mobile-menu-nav', 'mobile-menu-item');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addExamMenuLink);
  else addExamMenuLink();
})();