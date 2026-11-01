## 4ndr0m3d4 - un templo en las nubes el algoritmo

Ejercicio de mística post-digital que utiliza un sintetizador generativo creado dentro del navegador para crear un espacio de recogimiento audiovisual a partir de datos de navegación como latencia de red, estado de carga de batería, aceleración del cursor y hora.

4ndr0m3d4 busca una religiosidad apofática desde la condición ciborg, holográfica y basada en datos Aquí la mediación resulta en plasticidad digital que se traduce en un espacio de escucha y visualización orientado a un encuentro ciber-místico. Una forma de mantener vivo el sacro silencio dentro del robot.

La versión disponible en Bandcamp reúne diferentes horas, momentos y confguraciones del algoritmo en la misma computadora. Puede escucharse en un barrido continuo de 20 minutos en el que van mutando diferentes capas de la mutantextura que el templo genera. Igualmente está disponible una versión generativa que puede funcionar en cualquier navegador: templo.alephhchixi.xyz

En Bandcamp: https://alephchixi.bandcamp.com/album/un-templo-en-las-nubes-del-algoritmo

## Instalación y verificación

La aplicación se verifica en CI con Node.js 22.23.4. Usa `npm ci` para instalar el árbol exacto de `package-lock.json` y `npm run build` para generar `dist/`. Las carpetas `node_modules/` y `dist/` son resultados de instalación y compilación, no fuentes que deban mantenerse en Git; las versiones anteriores permanecen en el historial.

`npx playwright install chromium` prepara el navegador para `npm run test:e2e`. Las pruebas ejercitan la compilación local en Chromium de escritorio y móvil: WebGL, activación del grafo de audio y controles. Bloquean las solicitudes externas y no usan cuentas, micrófono ni grabaciones. Estas comprobaciones no sustituyen una escucha humana ni la verificación de dispositivos físicos.

CI conserva por siete días un artefacto limitado a los archivos estáticos públicos y un recibo de hashes para comparar la compilación base con la candidata. No publica el sitio. Una actualización del despliegue necesita revisar ese artefacto, el destino y la versión de restauración antes de usar el comando de publicación existente.
