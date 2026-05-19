const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  console.log('Lanzando Chrome headless…');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files',
    ],
  });

  const page = await browser.newPage();

  // Viewport equivalente a A3 landscape a 96 DPI (1587 × 1123 px)
  await page.setViewport({ width: 1587, height: 1123, deviceScaleFactor: 1 });

  const filePath = path.resolve(__dirname, 'ciaf-brochure-pdf.html');
  const fileUrl  = pathToFileURL(filePath).href;
  console.log('Cargando:', fileUrl);

  await page.goto(fileUrl, {
    waitUntil: 'networkidle0',   // espera CDN (fuentes, Tailwind, Lucide, Chart.js)
    timeout: 90_000,
  });

  // Esperar que las fuentes web estén disponibles para el motor de layout
  await page.evaluateHandle('document.fonts.ready');

  // El brochure tiene un setTimeout de 2 s para revelar animaciones; esperamos 3 s
  await new Promise(r => setTimeout(r, 3000));

  // Asegurar que todo el contenido dinámico esté renderizado y visible
  await page.evaluate(() => {
    // Forzar visibilidad de animaciones de entrada
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));

    // Pain-point panel: mostrar el primero
    if (typeof renderPain === 'function') renderPain('cierre');

    // Timeline: iniciar en fase 0 (setPhase ya se llama al cargar, pero por las dudas)
    if (typeof setPhase === 'function') setPhase(0);

    // Clientes: mostrar todos
    if (typeof renderClients === 'function') renderClients('all');

    // Freq tabs: asegurarse que "mensual" sea el grupo visible
    const mensualGroup = document.querySelector('[data-freq-group="mensual"]');
    if (mensualGroup) {
      mensualGroup.classList.remove('hidden');
      mensualGroup.classList.add('grid');
    }
    const diarioGroup = document.querySelector('[data-freq-group="diario"]');
    if (diarioGroup) {
      diarioGroup.classList.add('hidden');
      diarioGroup.classList.remove('grid');
    }
  });

  const outputPath = path.resolve(__dirname, 'ciaf-brochure.pdf');
  console.log('Generando PDF…');

  await page.pdf({
    path: outputPath,
    printBackground: true,    // imprescindible para los fondos oscuros
    preferCSSPageSize: true,  // toma el size del @page { size: 420mm 297mm } del CSS
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  console.log('PDF generado en:', outputPath);
})().catch(err => {
  console.error('Error al generar el PDF:', err.message);
  process.exit(1);
});
