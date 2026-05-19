import "./style.css";

// 1. Inyección de librerías externas para leer PDF y Word mediante CDN script tags dinámicos
const loadExternalLibraries = () => {
  if (!window.pdfjsLib) {
    const pdfScript = document.createElement("script");
    pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    document.head.appendChild(pdfScript);
    pdfScript.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    };
  }
  
  if (!window.mammoth) {
    const wordScript = document.createElement("script");
    wordScript.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    document.head.appendChild(wordScript);
  }
};
loadExternalLibraries();

const app = document.querySelector("#app");

// 2. HTML Actualizado con el cargador de archivos
app.innerHTML = `
  <main class="container">
    <h1>AI CV Reviewer & Mail Assistant</h1>

    <div class="form-group">
      <label for="mode">Modo de la IA:</label>
      <select id="mode">
        <option value="cv">Analizar Hoja de Vida (CV)</option>
        <option value="mail">Asistente de Correos</option>
      </select>
    </div>

    <!-- Sección dinámica para subir CV -->
    <div id="cv-section" class="form-group">
      <label for="cv-file">Sube tu Hoja de Vida (PDF, DOCX, TXT):</label>
      <input type="file" id="cv-file" accept=".pdf,.docx,.txt" />
      <div id="file-status" style="margin-top: 5px; font-size: 0.9rem; color: #666;"></div>
    </div>

    <!-- Sección de correos (Se ocultará si estamos en modo CV) -->
    <div id="mail-section" style="display: none;">
      <div class="form-group">
        <label for="template">Plantillas Inteligentes:</label>
        <select id="template">
          <option value="libre">-- Redacción Libre --</option>
          <option value="feedback">Solicitud de Feedback</option>
          <option value="seguimiento">Seguimiento de Reunión</option>
          <option value="disculpa">Disculpa por Retraso</option>
        </select>
      </div>

      <div class="form-group">
        <label for="tone">Tono del Correo:</label>
        <select id="tone">
          <option value="profesional" selected>Profesional</option>
          <option value="formal">Formal</option>
          <option value="amigable">Amigable</option>
        </select>
      </div>
    </div>

    <textarea id="input" placeholder="Escribe comentarios adicionales o notas para la IA..."></textarea>

    <button id="generate">Analizar con IA</button>

    <section class="result-container">
      <h3>Resultado del Análisis:</h3>
      <div class="result" id="result" style="white-space: pre-wrap;">La respuesta aparecerá aquí...</div>
    </section>
  </main>
`;

// 3. Selectores de Elementos
const modeSelect = document.querySelector("#mode");
const cvSection = document.querySelector("#cv-section");
const mailSection = document.querySelector("#mail-section");
const cvFileInput = document.querySelector("#cv-file");
const fileStatus = document.querySelector("#file-status");
const templateSelect = document.querySelector("#template");
const toneSelect = document.querySelector("#tone");
const inputTextArea = document.querySelector("#input");
const generateButton = document.querySelector("#generate");
const resultDiv = document.querySelector("#result");

let extractedText = ""; // Aquí guardaremos el texto del CV

const TEMPLATES = {
  feedback: "Hola [Nombre],\n\nEspero que estés bien...",
  seguimiento: "Estimado [Nombre],\n\nEscribo para hacer seguimiento...",
  disculpa: "Hola [Nombre],\n\nLamento el retraso...",
  libre: ""
};

// 4. Alternar entre Modo CV y Modo Correo
modeSelect.addEventListener("change", (e) => {
  if (e.target.value === "cv") {
    cvSection.style.display = "block";
    mailSection.style.display = "none";
    generateButton.textContent = "Analizar CV con IA";
    inputTextArea.placeholder = "Escribe aquí si buscas un puesto específico (ej: Frontend Dev) o si quieres enfocar el feedback en algo...";
  } else {
    cvSection.style.display = "none";
    mailSection.style.display = "block";
    generateButton.textContent = "Generar Correo con IA";
    inputTextArea.placeholder = "Selecciona una plantilla o escribe las directrices...";
  }
});

// 5. Procesamiento de Archivos (Extraer Texto)
cvFileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  fileStatus.textContent = "Procesando archivo...";
  extractedText = "";

  try {
    if (file.type === "application/pdf") {
      extractedText = await parsePDF(file);
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      extractedText = await parseDocx(file);
    } else {
      // Archivos .txt planos
      extractedText = await file.text();
    }
    fileStatus.textContent = `✅ Archivo cargado exitosamente (${file.name})`;
  } catch (error) {
    console.error(error);
    fileStatus.textContent = "❌ Error al leer el archivo. Intenta con otro formato.";
  }
});

// Helper: Extraer texto de PDF
async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(" ") + "\n";
  }
  return text;
}

// Helper: Extraer texto de Word (.docx)
async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
  return result.value;
}

// 6. Lógica de las Plantillas Inteligentes (Modo Correo)
templateSelect.addEventListener("change", (e) => {
  inputTextArea.value = TEMPLATES[e.target.value] || "";
  if (e.target.value !== "libre") inputTextArea.focus();
});

// 7. Lógica de Generación con IA (Ollama)
generateButton.addEventListener("click", async () => {
  const mode = modeSelect.value;
  const userInput = inputTextArea.value.trim();
  
  let prompt = "";

  if (mode === "cv") {
    if (!extractedText) {
      resultDiv.textContent = "Por favor, sube primero un archivo de Hoja de Vida (CV).";
      return;
    }
    resultDiv.textContent = "Analizando Hoja de Vida con phi3...";

    // Prompt optimizado para revisión de CV
    prompt = `
Actúa como un reclutador técnico (Tech Recruiter) senior y experto en optimización de Hojas de Vida (CV).
Tu tarea es evaluar la hoja de vida provista y dar un feedback constructivo, honesto y de alto impacto.

Contexto o directrices adicionales del usuario: ${userInput || "Ninguna especificada."}

Estructura tu respuesta estrictamente de la siguiente forma utilizando formato limpio:
1. RESUMEN GENERAL: Breve opinión del perfil.
2. PUNTOS FUERTES: Qué está muy bien hecho.
3. ÁREAS DE MEJORA: Errores, falta de claridad o debilidades encontradas.
4. SUGERENCIAS DE IMPACTO: Consejos clave (ej: usar verbos de acción, métricas) para mejorar el CV.

HOJA DE VIDA A EVALUAR:
${extractedText}
    `;
  } else {
    // Modo Correo tradicional
    if (!userInput) {
      resultDiv.textContent = "Debes escribir contenido o seleccionar una plantilla.";
      return;
    }
    resultDiv.textContent = "Generando respuesta con phi3...";
    const tone = toneSelect.value;
    prompt = `
Actúa como un asistente experto en comunicación empresarial.
Tono: ${tone}
Asegúrate de quitar corchetes vacíos. Devuelve únicamente el cuerpo del correo.

TEXTO BASE:
${userInput}
    `;
  }

  // Petición a Ollama
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3",
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Error en el servidor: ${response.status}`);

    const data = await response.json();
    resultDiv.textContent = data.response;
    
  } catch (error) {
    resultDiv.textContent = "Error conectando con Ollama. Asegúrate de tener el servicio activo en localhost:11434.";
    console.error("Error de Ollama:", error);
  }
});






























































// import "./style.css";

// const TEMPLATES = {
//   feedback: "Hola [Nombre],\n\nEspero que estés bien. Quería solicitar tu feedback sobre el proyecto [Nombre del Proyecto]. ¿Podrías indicarme qué aspectos crees que podemos mejorar?\n\nSaludos,",
//   seguimiento: "Estimado [Nombre],\n\nEscribo para hacer seguimiento a nuestra reunión del día [Fecha] sobre [Tema]. Quedo atento a tus comentarios para proceder con los siguientes pasos.\n\nAtentamente,",
//   disculpa: "Hola [Nombre],\n\nLamento el retraso en la entrega de [Entregable]. Tuvimos un inconveniente técnico, pero ya está solucionado. Adjunto lo prometido.\n\nMuchas gracias por tu paciencia,",
//   libre: "" // Opción por defecto para escribir libremente
// };

// const app = document.querySelector("#app");

// app.innerHTML = `
//   <main class="container">
//     <h1>AI Mail Assistant</h1>

//     <div class="form-group">
//       <label for="template">Plantillas Inteligentes:</label>
//       <select id="template">
//         <option value="libre">-- Redacción Libre --</option>
//         <option value="feedback">Solicitud de Feedback</option>
//         <option value="seguimiento">Seguimiento de Reunión</option>
//         <option value="disculpa">Disculpa por Retraso</option>
//       </select>
//     </div>

//     <div class="form-group">
//       <label for="tone">Tono del Correo:</label>
//       <select id="tone">
//         <option value="profesional" selected>Profesional</option>
//         <option value="formal">Formal</option>
//         <option value="amigable">Amigable</option>
//       </select>
//     </div>

//     <textarea id="input" placeholder="Selecciona una plantilla o escribe las directrices para el cliente..."></textarea>

//     <button id="generate">Generar con IA</button>

//     <section class="result-container">
//       <h3>Resultado:</h3>
//       <div class="result" id="result">La respuesta aparecerá aquí...</div>
//     </section>
//   </main>
// `;

// // 3. Selectores de Elementos
// const templateSelect = document.querySelector("#template");
// const toneSelect = document.querySelector("#tone");
// const inputTextArea = document.querySelector("#input");
// const generateButton = document.querySelector("#generate");
// const resultDiv = document.querySelector("#result");

// // 4. Lógica de las Plantillas Inteligentes
// templateSelect.addEventListener("change", (e) => {
//   const selectedTemplate = e.target.value;
//   // Insertamos el texto predefinido en el textarea
//   inputTextArea.value = TEMPLATES[selectedTemplate];
  
//   // Foco automático para que el usuario empiece a rellenar los datos entre corchetes
//   if (selectedTemplate !== "libre") {
//     inputTextArea.focus();
//   }
// });

// // 5. Lógica de Generación con IA (Ollama)
// generateButton.addEventListener("click", async () => {
//   const input = inputTextArea.value.trim();
//   const tone = toneSelect.value;

//   if (!input) {
//     resultDiv.textContent = "Debes escribir contenido o seleccionar una plantilla.";
//     return;
//   }

//   resultDiv.textContent = "Generando respuesta con phi3...";

//   // Optimizamos el prompt para que la IA entienda que debe rellenar o mejorar la plantilla
//   const prompt = `
// Actúa como un asistente experto en comunicación empresarial.
// Tu tarea es redactar o perfeccionar un correo electrónico profesional.

// REQUISITOS:
// 1. Tono: ${tone}
// 2. Asegúrate de que no queden corchetes vacíos (como [Nombre] o [Fecha]) si el usuario olvidó llenarlos; reemplázalos con datos genéricos coherentes o elimínalos elegantemente.
// 3. Devuelve únicamente el cuerpo del correo, sin introducciones ni explicaciones adicionales.

// TEXTO BASE / INSTRUCCIONES:
// ${input}
//   `;

//   try {
//     const response = await fetch("http://localhost:11434/api/generate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "phi3",
//         prompt: prompt,
//         stream: false,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`Error en el servidor: ${response.status}`);
//     }

//     const data = await response.json();
    
//     // Asignamos la respuesta de la IA al contenedor
//     resultDiv.textContent = data.response;
    
//   } catch (error) {
//     resultDiv.textContent = "Error conectando con Ollama. Asegúrate de tener el servicio activo en localhost:11434.";
//     console.error("Error de Ollama:", error);
//   }
// });
