(() => {
"use strict";

const $ = id => document.getElementById(id);
const grade = $("grade");
const phase = $("phase");
const field = $("field");
const contents = $("contents");
const pdas = $("pdas");

let curriculum = {};
let records = [];

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u00ad\u200b\u200c\u200d]/g, "")
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s*(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, "$1")
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])\s*[-–—]\s*(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, "$1")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esc(value) {
  return cleanText(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

/*
 * MISMA LÓGICA DE PLANEANEM:
 * Divide el campo PDA en oraciones independientes.
 * No altera el texto curricular; solamente lo presenta separado.
 */
function splitPdas(raw) {
  if (!raw) return [];

  let text = String(raw);

  text = text.replace(/[\u00ad\u200b\u200c\u200d]/g, "");

  text = text.replace(
    /([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s+/g,
    "$1"
  );

  text = text.replace(/\r?\n/g, " ");
  text = text.replace(/\s+/g, " ").trim();

  if (!text) return [];

  const resultado = [];
  let inicio = 0;

  for (let i = 0; i < text.length; i++) {
    const caracter = text[i];

    if (
      caracter === "." ||
      caracter === "!" ||
      caracter === "?"
    ) {
      const oracion = text
        .slice(inicio, i + 1)
        .trim();

      if (oracion) resultado.push(oracion);

      inicio = i + 1;
    }
  }

  const restante = text.slice(inicio).trim();
  if (restante) resultado.push(restante);

  return resultado
    .map(pda => pda.replace(/^\s*\d+[.)]?\s*/, "").trim())
    .filter(Boolean);
}

function phaseForGrade() {
  const g = Number(grade.value);
  if (g === 1 || g === 2) return "3";
  if (g === 3 || g === 4) return "4";
  if (g === 5 || g === 6) return "5";
  return "3";
}

function loadCurriculum() {
  const mappedPhase = phaseForGrade();

  // La fase se determina automáticamente según el grado.
  phase.value = mappedPhase;
  phase.disabled = true;

  const phaseKey = `FASE ${mappedPhase}`;

  if (mappedPhase === "3") curriculum = window.PLANEAnEM_FASE_3 || {};
  else if (mappedPhase === "4") curriculum = window.PLANEAnEM_FASE_4 || {};
  else if (mappedPhase === "5") curriculum = window.PLANEAnEM_FASE_5 || {};
  else curriculum = {};

  records =
    curriculum[phaseKey]?.[field.value]?.grades?.[grade.value] || [];

  renderContents();
  renderPDAs();
}

function renderContents() {
  if (!records.length) {
    contents.innerHTML =
      "<p>No hay contenidos disponibles para esta selección.</p>";
    return;
  }

  contents.innerHTML = records.map((item, index) => `
    <label class="choice">
      <input type="checkbox" data-content-index="${index}">
      <span>
        <strong>${esc(item.content)}</strong>
        <small>Contenido curricular</small>
      </span>
    </label>
  `).join("");

  contents.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", renderPDAs);
  });
}

function renderPDAs() {
  const selected = [
    ...contents.querySelectorAll("input[data-content-index]:checked")
  ].map(input => Number(input.dataset.contentIndex));

  if (!selected.length) {
    pdas.innerHTML =
      "<p>Selecciona uno o más contenidos para consultar sus PDA.</p>";
    return;
  }

  pdas.innerHTML = selected.map(index => {
    const item = records[index];
    const pdaList = splitPdas(item?.pda);

    return `
      <div class="pda-group">
        <div class="pda-group-title">
          📚 ${esc(item.content)}
        </div>

        <div class="pda-group-label">
          🎯 PDA correspondientes
        </div>

        ${
          pdaList.length
            ? pdaList.map((pdaText, pdaIndex) => `
                <label class="choice pda-choice">
                  <input
                    type="checkbox"
                    data-content-index="${index}"
                    data-pda-index="${pdaIndex}"
                    data-pda-text="${esc(pdaText)}"
                    checked
                  >
                  <span>
                    <strong>PDA ${pdaIndex + 1}</strong>
                    <small>${esc(pdaText)}</small>
                  </span>
                </label>
              `).join("")
            : "<p>No hay PDA disponible para este contenido.</p>"
        }
      </div>
    `;
  }).join("");
}

function getSelectedPdas() {
  const result = [];

  pdas.querySelectorAll("input[data-pda-index]:checked").forEach(input => {
    const contentIndex = Number(input.dataset.contentIndex);
    const pdaIndex = Number(input.dataset.pdaIndex);
    const item = records[contentIndex];
    const list = splitPdas(item?.pda);

    if (item && list[pdaIndex]) {
      result.push({
        content: item.content,
        pda: list[pdaIndex]
      });
    }
  });

  return result;
}

function makeQuestion(item, number, type) {
  const content = cleanText(item.content);
  const pda = cleanText(item.pda);

  if (type === "open") {
    return `
      <div class="question">
        <h3>${number}. Responde con tus propias palabras.</h3>
        <div class="meta">Contenido: ${esc(content)}</div>
        <p>Explica lo que aprendiste relacionado con:</p>
        <p><strong>${esc(pda)}</strong></p>
        <p>Respuesta: ________________________________________________</p>
      </div>`;
  }

  if (type === "problem") {
    return `
      <div class="question">
        <h3>${number}. Situación para resolver</h3>
        <div class="meta">Contenido: ${esc(content)}</div>
        <p>Resuelve una situación en la que puedas aplicar:</p>
        <p><strong>${esc(pda)}</strong></p>
        <p>Procedimiento y respuesta: __________________________________</p>
      </div>`;
  }

  return `
    <div class="question">
      <h3>${number}. Selecciona la opción que mejor corresponde.</h3>
      <div class="meta">Contenido: ${esc(content)}</div>
      <p>${esc(pda)}</p>
      <div class="answers">
        A) Lo demuestra completamente.<br>
        B) Lo demuestra parcialmente.<br>
        C) No corresponde al aprendizaje.<br>
        D) Necesito más información.
      </div>
    </div>`;
}

$("generate").addEventListener("click", () => {
  const items = getSelectedPdas();

  if (!items.length) {
    alert("Selecciona al menos un PDA.");
    return;
  }

  const count = Number($("count").value);
  const configuredType = $("type").value;
  const types = ["multiple", "open", "problem"];

  let questions = "";

  for (let i = 0; i < count; i++) {
    const type = configuredType === "mixed"
      ? types[i % types.length]
      : configuredType;

    questions += makeQuestion(
      items[i % items.length],
      i + 1,
      type
    );
  }

  const result = $("result");
  result.classList.remove("hidden");

  result.innerHTML = `
    <div class="exam-title">
      <h2>📝 ${esc($("examName").value || "Evaluación de aprendizaje")}</h2>
      <p>
        ${esc(grade.options[grade.selectedIndex].text)}
        · ${esc(field.value)}
        · Fase ${phase.value}
      </p>
    </div>

    ${questions}

    <div class="key">
      <strong>📌 Matriz de correspondencia</strong>
      <p>
        Cada pregunta conserva el contenido y el PDA individual
        que seleccionaste.
      </p>
      <button class="primary" onclick="window.print()">
        🖨️ Imprimir / Guardar PDF
      </button>
    </div>
  `;

  result.scrollIntoView({ behavior: "smooth" });
});

grade.addEventListener("change", loadCurriculum);
field.addEventListener("change", loadCurriculum);

loadCurriculum();
})();