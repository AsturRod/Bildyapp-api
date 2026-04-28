import PDFDocument from 'pdfkit';
import fs from 'fs';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-ES');
};

const drawField = (doc, label, value) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .text(value ?? '-');
};

const drawSectionTitle = (doc, title) => {
  doc.moveDown().font('Helvetica-Bold').fontSize(14).text(title);
  doc.moveDown(0.4);
};

const safeText = (value) => (value == null || value === '' ? '-' : String(value));

export const generateDeliveryNotePdf = async (deliveryNote) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];

  return await new Promise(async (resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      doc.info.Title = `Albarán ${deliveryNote._id}`;
      doc.info.Author = 'BildyApp';

      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('Albarán', { align: 'center' });

      doc.moveDown();

      drawSectionTitle(doc, 'Datos generales');
      drawField(doc, 'ID', safeText(deliveryNote._id));
      drawField(doc, 'Formato', safeText(deliveryNote.format));
      drawField(doc, 'Fecha de trabajo', formatDate(deliveryNote.workDate));
      drawField(doc, 'Descripción', safeText(deliveryNote.description));
      drawField(doc, 'Firmado', deliveryNote.signed ? 'Sí' : 'No');
      drawField(doc, 'Fecha de firma', formatDate(deliveryNote.signedAt));

      drawSectionTitle(doc, 'Usuario');
      drawField(doc, 'Email', safeText(deliveryNote.user?.email));
      drawField(
        doc,
        'Nombre',
        safeText(deliveryNote.user?.name || deliveryNote.user?.fullName)
      );

      drawSectionTitle(doc, 'Cliente');
      drawField(doc, 'Nombre', safeText(deliveryNote.client?.name));
      drawField(doc, 'CIF', safeText(deliveryNote.client?.cif));
      drawField(doc, 'Email', safeText(deliveryNote.client?.email));
      drawField(doc, 'Teléfono', safeText(deliveryNote.client?.phone));

      drawSectionTitle(doc, 'Proyecto');
      drawField(doc, 'Nombre', safeText(deliveryNote.project?.name));
      drawField(doc, 'Código', safeText(deliveryNote.project?.projectCode));
      drawField(doc, 'Email', safeText(deliveryNote.project?.email));
      drawField(doc, 'Notas', safeText(deliveryNote.project?.notes));

      if (deliveryNote.format === 'hours') {
        drawSectionTitle(doc, 'Parte de horas');

        if (deliveryNote.hours != null) {
          drawField(doc, 'Horas totales', safeText(deliveryNote.hours));
        }

        if (Array.isArray(deliveryNote.workers) && deliveryNote.workers.length > 0) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').fontSize(11).text('Trabajadores');
          doc.moveDown(0.3);

          deliveryNote.workers.forEach((worker, index) => {
            doc
              .font('Helvetica')
              .fontSize(10)
              .text(
                `${index + 1}. ${safeText(worker.name)} - ${safeText(worker.hours)} horas`
              );
          });
        }
      }

      if (deliveryNote.format === 'material') {
        drawSectionTitle(doc, 'Parte de materiales');

        if (deliveryNote.material || deliveryNote.quantity != null || deliveryNote.unit) {
          drawField(doc, 'Material', safeText(deliveryNote.material));
          drawField(doc, 'Cantidad', safeText(deliveryNote.quantity));
          drawField(doc, 'Unidad', safeText(deliveryNote.unit));
        }

        if (Array.isArray(deliveryNote.materials) && deliveryNote.materials.length > 0) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').fontSize(11).text('Materiales');
          doc.moveDown(0.3);

          deliveryNote.materials.forEach((item, index) => {
            doc
              .font('Helvetica')
              .fontSize(10)
              .text(
                `${index + 1}. ${safeText(item.material)} - ${safeText(item.quantity)} ${safeText(item.unit)}`
              );
          });
        }
      }

      if (deliveryNote.signatureUrl) {
        drawSectionTitle(doc, 'Firma');

        try {
          if (
            typeof deliveryNote.signatureUrl === 'string' &&
            fs.existsSync(deliveryNote.signatureUrl)
          ) {
            doc.image(deliveryNote.signatureUrl, {
              fit: [220, 120],
              align: 'left',
            });
          } else if (
            typeof deliveryNote.signatureUrl === 'string' &&
            deliveryNote.signatureUrl.startsWith('http')
          ) {
            const response = await fetch(deliveryNote.signatureUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              doc.image(buffer, {
                fit: [220, 120],
                align: 'left',
              });
            } else {
              doc.font('Helvetica').fontSize(10).text('No se pudo cargar la firma.');
            }
          } else {
            doc.font('Helvetica').fontSize(10).text('Firma disponible pero no accesible.');
          }
        } catch (_error) {
          doc.font('Helvetica').fontSize(10).text('No se pudo renderizar la firma.');
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};