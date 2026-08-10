import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Section = { id: string; title: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    id: "primeros-pasos",
    title: "Primeros pasos",
    body: (
      <>
        <p>
          Al crear tu cuenta pasas por un asistente de bienvenida donde activas los módulos de negocio que usas
          (Lavandería, Productos, Taller, Parqueadero) y cargas tus primeros servicios y precios. Puedes activar o
          desactivar módulos en cualquier momento desde <strong>Configuraciones → Módulos y preferencias</strong>.
        </p>
        <p>
          Los módulos que actives determinan qué pestañas ves en Toma de Pedidos y qué opciones aparecen en
          Servicios.
        </p>
      </>
    ),
  },
  {
    id: "toma-pedidos",
    title: "Toma de Pedidos",
    body: (
      <>
        <p>
          Es la pantalla donde registras un pedido nuevo. Según los módulos activos verás las pestañas de
          Lavandería, Productos, Taller y/o Parqueadero.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Lavandería/Productos</strong>: eliges los servicios o productos del catálogo, cantidad, forma de
            pago y cliente (opcional).
          </li>
          <li>
            <strong>Taller</strong>: además de los servicios, registras marca, modelo, kilometraje, diagnóstico,
            trabajo realizado y recomendación — y opcionalmente una fecha de próxima visita, que luego aparece en
            &quot;Seguimiento Taller&quot; dentro de Pedidos Históricos.
          </li>
          <li>
            <strong>Parqueadero</strong>: registras la entrada de un vehículo; el cobro se calcula automáticamente
            al momento de la salida, según la tarifa (hora/día/mes) y la tolerancia configurada.
          </li>
        </ul>
        <p>
          Un pedido recién creado se queda visible en Toma de Pedidos por unas horas; después de eso solo se puede
          consultar en Pedidos Históricos (el registro completo, sin límite de tiempo).
        </p>
      </>
    ),
  },
  {
    id: "pedidos-historicos",
    title: "Pedidos Históricos",
    body: (
      <>
        <p>
          Registro completo de todos los pedidos de Lavandería, Productos y Taller. En la pestaña{" "}
          <strong>Todos</strong> puedes filtrar por rango de fechas (por defecto muestra solo el día de hoy) y ves
          totalizadores: total vendido, cantidad de pedidos, y cuánto se cobró en Efectivo, Transferencia y
          Datáfono. El botón &quot;Exportar a Excel&quot; descarga exactamente el rango de fechas que tengas
          seleccionado.
        </p>
        <p>
          En la pestaña <strong>Seguimiento Taller</strong> ves los pedidos de Taller finalizados que tienen una
          fecha de próxima visita recomendada, ordenados por esa fecha — útil para llamar o escribirle al cliente
          cuando se acerca o ya pasó la fecha esperada.
        </p>
        <p className="text-muted-foreground">
          El historial completo es un beneficio de los planes pagos (H07 y Premium); en el plan Free solo se ve un
          recorte reciente.
        </p>
      </>
    ),
  },
  {
    id: "servicios",
    title: "Servicios",
    body: (
      <>
        <p>
          Aquí administras tu catálogo: los servicios/productos que ofreces en cada canal (Lavandería, Productos,
          Taller) y, si tienes Parqueadero activo, las tarifas por hora/día/mes.
        </p>
        <p>
          Cada servicio o tarifa se puede activar/inactivar (te lo confirma antes de aplicarlo, para evitar
          desactivar algo por accidente). Uno inactivo deja de aparecer como opción en Toma de Pedidos, pero no se
          borra ni afecta el historial de pedidos ya tomados con él.
        </p>
      </>
    ),
  },
  {
    id: "clientes",
    title: "Clientes",
    body: (
      <p>
        Base de datos de tus clientes, con su historial de pedidos asociado. Se pueden crear manualmente o quedan
        registrados automáticamente la primera vez que tomas un pedido a nombre de alguien.
      </p>
    ),
  },
  {
    id: "inventario",
    title: "Inventario",
    body: (
      <>
        <p>
          Solo visible si el módulo Productos está activo. Registra <strong>compras</strong> (entradas de
          mercancía, con su costo — esto alimenta el cálculo de costos variables del negocio) y{" "}
          <strong>mermas</strong> (pérdidas, daños o vencimientos). El stock disponible de cada producto se calcula
          solo, cruzando compras, mermas y lo vendido en pedidos.
        </p>
      </>
    ),
  },
  {
    id: "gastos",
    title: "Gastos",
    body: (
      <>
        <p>
          Registra cada gasto del negocio marcándolo como <strong>Fijo</strong> (arriendo, nómina, servicios
          públicos — se repite todos los meses más o menos igual) o <strong>Variable</strong> (insumos, cosas que
          dependen de cuánto vendes). Esta clasificación es la que usa el Punto de equilibrio presupuestado para
          calcular tu margen de contribución.
        </p>
        <p>
          Tiene filtro por rango de fechas (por defecto, hoy) con totalizadores de cuánto llevas en costos fijos y
          cuánto en variables, y exportación a Excel del rango seleccionado.
        </p>
      </>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    body: (
      <>
        <p>El Dashboard tiene tres pestañas:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Ventas</strong>: ventas de hoy, del mes, gastos, utilidad y clientes atendidos, más una gráfica
            de tendencia diaria del mes en curso.
          </li>
          <li>
            <strong>Productividad</strong>: cuánto ha facturado cada técnico, con filtro por rango de fechas
            (por defecto, hoy) y exportable a Excel. Si activaste &quot;Trabajo por comisión&quot; en
            Configuraciones, también ves el % y el valor comisionado de cada pedido.
          </li>
          <li>
            <strong>Punto de equilibrio</strong>: ver la sección dedicada más abajo — tiene dos tarjetas,
            Presupuestado y Real.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "punto-equilibrio",
    title: "Punto de equilibrio (presupuestado y real)",
    body: (
      <>
        <p>
          El punto de equilibrio es cuánto necesitas facturar en el mes para cubrir tus costos, ni ganar ni perder.
          H07 lo calcula de dos formas distintas, cada una con su propio costo fijo que tú registras (con un botón
          &quot;Registrar costo fijo&quot; que te explica, con ejemplo, qué número escribir):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Presupuestado</strong>: usas el costo fijo que TÚ presupuestaste para el negocio (no
            necesariamente lo que gastas hoy). Se combina con tu margen de contribución{" "}
            <em>promedio de los últimos meses</em> (ventas menos costos variables, dividido entre ventas) para
            decirte cuánto deberías facturar para llegar a ese presupuesto.
          </li>
          <li>
            <strong>Real</strong>: usas el costo fijo que SABES que pagas hoy. Se combina con el margen de
            contribución <em>del mes en curso</em> (en tiempo real, no un promedio) para decirte cuánto llevas
            facturado este mes y cuánto te falta para cubrir tus costos reales.
          </li>
        </ul>
        <p>
          Ambos tienen su propia gráfica: barras verdes cuando ese mes alcanzó el punto de equilibrio, rojas cuando
          no, con una línea punteada marcando el umbral.
        </p>
      </>
    ),
  },
  {
    id: "usuarios-roles",
    title: "Usuarios y Roles",
    body: (
      <>
        <p>
          Invita usuarios de tu empresa (Administrador o Técnico) desde <strong>Usuarios</strong>. La persona
          invitada recibe un correo y, al aceptar, define su propia contraseña.
        </p>
        <p>
          En <strong>Roles y Permisos</strong> (dentro de Usuarios) el Propietario decide exactamente qué puede
          hacer cada rol — qué módulos ve, si puede crear/editar/eliminar en cada uno. El Propietario siempre tiene
          acceso completo y no se puede editar.
        </p>
        <p>
          Si activas &quot;Trabajo por comisión&quot; en Configuraciones, ahí mismo defines qué porcentaje se lleva
          el técnico de cada servicio que factura.
        </p>
      </>
    ),
  },
  {
    id: "configuraciones",
    title: "Configuraciones",
    body: (
      <>
        <p>Tiene tres secciones:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Módulos y preferencias</strong>: qué módulos de negocio usas, si pides técnico al facturar,
            teclado numérico en pantalla, tolerancia de parqueadero y la comisión por técnico.
          </li>
          <li>
            <strong>Categorías de gasto</strong> y <strong>Proveedores</strong>: catálogos compartidos que usas al
            registrar gastos y compras.
          </li>
        </ul>
        <p>
          Desde el menú lateral, al desplegar Configuración también encuentras <strong>Soporte</strong> (te lleva
          directo a un chat de WhatsApp con nuestro equipo) y esta misma <strong>Documentación</strong>.
        </p>
      </>
    ),
  },
  {
    id: "planes",
    title: "Planes y facturación",
    body: (
      <>
        <p>
          H07 tiene un plan Free (funciones básicas, historial recortado) y planes pagos (H07 y Premium) con
          historial completo, reportes y funciones adicionales. Puedes cambiar de plan y pagar directamente desde{" "}
          <strong>Planes</strong>.
        </p>
        <p>
          Ahí también ves tu cartera: cobros pendientes, pagados y vencidos, con recibo descargable en PDF para
          cada cobro pagado. Si un cobro queda vencido más de unos días, Toma de Pedidos se bloquea hasta que se
          regularice el pago (el resto de la app sigue funcionando).
        </p>
      </>
    ),
  },
  {
    id: "auditoria",
    title: "Auditoría",
    body: (
      <p>
        Registro de quién hizo qué y cuándo en tu empresa (creaciones, ediciones, eliminaciones). Tiene filtro por
        rango de fechas (por defecto, hoy), exportable a Excel, y un botón &quot;Ver detalles&quot; que muestra,
        campo por campo, qué cambió de antes a después.
      </p>
    ),
  },
  {
    id: "mi-perfil",
    title: "Mi perfil",
    body: (
      <p>
        Dando clic en tu nombre, arriba a la derecha, entras a tu perfil: puedes cambiar tu nombre, tu foto y tu
        contraseña.
      </p>
    ),
  },
];

export default function DocumentacionPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Documentación</h1>
        <p className="text-sm text-muted-foreground">Cómo funciona H07, de principio a fin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contenido</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid gap-1 sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-md px-2 py-1 text-sm text-primary hover:underline"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {SECTIONS.map((section) => (
        <Card key={section.id} id={section.id} className="scroll-mt-4">
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">{section.body}</CardContent>
        </Card>
      ))}
    </div>
  );
}
