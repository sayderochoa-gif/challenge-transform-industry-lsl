# AI CV Reviewer & Mail Assistant


##  Descripción del Proyecto

*   **Industria:** Recursos Humanos (RRHH) / Optimización de Perfil Profesional.
*   **Modelo de IA:** `phi3` ejecutado de manera local mediante **Ollama**.

###  Problemática Identificada

En el competitivo mercado laboral actual, los profesionales suelen pasar por la frustrante tarea de diseñar la "hoja de vida perfecta". Sin embargo, la gran mayoría no cuenta con el **tiempo**, el **conocimiento técnico** o la **perspectiva de un reclutador** para analizar si la información que están incluyendo destaca sus verdaderas fortalezas o si está correctamente alineada con el puesto al que aplican.

###  Solución Propuesta

**AI CV Reviewer & Mail Assistant** es una aplicación web local diseñada para acortar esa brecha. Nuestra solución procesa archivos en múltiples formatos para que una Inteligencia Artificial actúe como un *Tech Recruiter Senior*. El sistema analiza el documento, identifica fortalezas, expone áreas de mejora y ofrece sugerencias de alto impacto de manera automática. 

Además, incluye un **Asistente de Correos** integrado con plantillas inteligentes para redactar comunicaciones profesionales (solicitudes de feedback, seguimientos, etc.) adaptando el tono según la necesidad del usuario.


##  Características Principales

*   **Procesamiento de Archivos Local:** Extracción de texto dinámica desde archivos `.pdf`, `.docx` y `.txt` directamente en el navegador mediante CDN externos (`pdf.js` y `mammoth.js`).
*   **Privacidad Absoluta:** Al procesar los datos localmente a través de Ollama, la información confidencial de las hojas de vida nunca sale de la máquina del usuario.
*   **Doble Modo de Operación:** Cambia fácilmente entre el analizador de CV y el asistente de redacción de correos corporativos.
*   **Interfaz Fluida:** Arquitectura SPA basada en JavaScript Vanilla estructurada dinámicamente sobre un contenedor principal.


##  Requisitos Previos
Para ejecutar este proyecto, necesitas tener instalado y configurado **Ollama** en tu entorno local.

1. Descarga e instala Ollama desde su sitio oficial.
2. Descarga el modelo `phi3` ejecutando el siguiente comando en tu terminal:
   ```bash
   ollama run phi3

##  Integrantes

*   **Luigui Garizado**
*   **Sayder Carreño**
*   **Luis David Gómez**
