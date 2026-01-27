import React from 'react';

export const TermsContent: React.FC = () => {
  return (
    <div className="space-y-6 text-sm text-slate-300 font-body leading-relaxed">
      <section className="space-y-2">
        <h3 className="text-white font-title text-lg">Términos y Condiciones</h3>
        <p>
          Estos términos regulan el uso de LUNARPUNK Ticketera y aplican tanto a Exploradores
          (compradores de tickets) como a Organizadores (creadores de eventos). Al registrarte y usar
          la plataforma, aceptas estas condiciones.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">1. Roles y alcance</h4>
        <p>
          Exploradores pueden explorar eventos, reservar y comprar tickets. Organizadores pueden crear,
          gestionar y publicar eventos. Cada rol asume las responsabilidades correspondientes a sus
          actividades dentro de la plataforma.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">2. Registro y cuentas</h4>
        <p>
          Eres responsable de la información que proporcionas y del uso de tus credenciales. No debes
          compartir tu acceso con terceros ni utilizar la plataforma para fines ilícitos.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">3. Eventos y tickets</h4>
        <p>
          Los Organizadores son responsables de la veracidad de la información del evento, políticas de
          acceso, horarios y cumplimiento de normativas locales. Los Exploradores deben verificar los
          detalles del evento antes de confirmar una compra.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">4. Pagos, reservas y reembolsos</h4>
        <p>
          Los pagos se procesan a través de MercadoPago u otros proveedores integrados. Las reservas
          pueden vencer si no se completa el pago en el plazo indicado. Las políticas de reembolso y
          cancelación pueden variar por evento y son definidas por el Organizador, salvo obligación
          legal en contrario.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">5. Conducta y contenidos</h4>
        <p>
          Queda prohibido publicar contenidos falsos, engañosos o que infrinjan derechos de terceros.
          Nos reservamos el derecho de suspender cuentas que incumplan estas reglas.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">6. Propiedad intelectual</h4>
        <p>
          Los contenidos publicados por Organizadores permanecen bajo su responsabilidad. LUNARPUNK
          conserva los derechos sobre la plataforma, marcas y elementos visuales propios.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">7. Limitación de responsabilidad</h4>
        <p>
          LUNARPUNK facilita la conexión entre Organizadores y Exploradores, pero no es responsable de
          la ejecución de los eventos, accesos, cambios de fecha o condiciones particulares.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">8. Protección de datos (Argentina)</h4>
        <p>
          LUNARPUNK cumple con la Ley 25.326 de Protección de Datos Personales. Los datos se utilizan
          para gestionar tu cuenta, procesar pagos, facilitar la operación de eventos y mejorar la
          experiencia de uso. No vendemos datos personales.
        </p>
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, actualización y supresión escribiendo a
          <span className="text-lp-accent"> booking@fedewsalas.com</span>. La Agencia de Acceso a la Información
          Pública (AAIP) tiene la facultad de atender denuncias por incumplimientos de la normativa.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">9. Seguridad</h4>
        <p>
          Implementamos medidas razonables de seguridad para proteger la información. Sin embargo,
          ningún sistema es completamente infalible; el uso de la plataforma es bajo tu responsabilidad.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">10. Modificaciones</h4>
        <p>
          Podemos actualizar estos términos para reflejar cambios legales o de servicio. Si los cambios
          son sustanciales, se notificará de forma visible dentro de la plataforma.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-white font-title">11. Contacto</h4>
        <p>
          Para consultas legales o de privacidad, contacta a
          <span className="text-lp-accent"> booking@fedewsalas.com</span>.
        </p>
      </section>
    </div>
  );
};
