"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Minus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CHANNEL_LABELS, type CatalogItem } from "@/lib/servicios/types";
import type { ClientRow } from "@/lib/clientes/types";
import type { Tecnico } from "@/lib/usuarios/queries";
import type { PedidoItemChannel, OrderListItem } from "@/lib/pedidos/types";
import { PAYMENT_METHODS } from "@/lib/pedidos/types";
import type { CreateOrderResult } from "@/lib/pedidos/create-order";
import type { ParkingRate, OpenMovement } from "@/lib/parqueadero/types";
import { useLocale } from "@/lib/locale/locale-context";
import { OrdersList } from "@/components/pedidos/orders-list";
import { ParqueaderoClient } from "@/components/parqueadero/parqueadero-client";

const WORK_ORDER_STATUSES = [
  { value: "abierta", label: "Abierta" },
  { value: "en_proceso", label: "En proceso" },
  { value: "finalizada", label: "Finalizada" },
];

type CartLine = {
  catalogItemId: string;
  channel: PedidoItemChannel;
  description: string;
  quantity: number;
  unitPrice: number;
  priceType: "fijo" | "variable";
};

export function TomaPedidosClient({
  enabledChannels,
  parqueaderoEnabled,
  catalogItems,
  clients,
  technicians,
  orders,
  canCreatePedido,
  pedidosBlocked,
  createPedidoAction,
  parkingRates,
  openMovements,
  graceMinutes,
}: {
  enabledChannels: PedidoItemChannel[];
  parqueaderoEnabled: boolean;
  catalogItems: CatalogItem[];
  clients: ClientRow[];
  technicians: Tecnico[];
  orders: OrderListItem[];
  canCreatePedido: boolean;
  pedidosBlocked: boolean;
  createPedidoAction: (input: unknown) => Promise<CreateOrderResult>;
  parkingRates: ParkingRate[];
  openMovements: OpenMovement[];
  graceMinutes: number;
}) {
  const router = useRouter();
  const { formatCurrency, countryCode } = useLocale();
  const tabs: string[] = [...enabledChannels, ...(parqueaderoEnabled ? ["parqueadero"] : [])];
  const [activeTab, setActiveTab] = useState<string>(tabs[0] ?? "");

  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [showClientFields, setShowClientFields] = useState(false);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [mileage, setMileage] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [workOrderStatus, setWorkOrderStatus] = useState("abierta");

  const total = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const hasTallerItem = cart.some((line) => line.channel === "taller");

  const handleSelectClient = (id: string) => {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client) {
      setClientName(client.name);
      setClientPhone(client.phone ?? "");
      setPlate(client.plate ?? "");
    }
  };

  // El carrito es único para Lavandería/Productos/Taller: agregar un item
  // desde cualquiera de esas pestañas acumula aquí, sin importar cuál esté
  // activa. Solo Productos permite acumular cantidad sobre la misma línea.
  const addItem = (item: CatalogItem) => {
    const existingIndex = cart.findIndex((line) => line.catalogItemId === item.id);

    if (existingIndex !== -1) {
      if (item.channel !== "productos") {
        toast.error("Ese servicio ya está en el pedido");
        return;
      }
      setCart((prev) =>
        prev.map((line, index) => (index === existingIndex ? { ...line, quantity: line.quantity + 1 } : line)),
      );
      toast.success(`${item.name} — cantidad actualizada`, { duration: 1500 });
      return;
    }

    let unitPrice = item.price;

    // Precio "Variable" (Taller): se pide el valor al facturar, igual que en
    // el sistema anterior. El price_type se guarda siempre con la línea
    // (nunca se pierde al llegar a la base de datos).
    if (item.price_type === "variable") {
      const entered = window.prompt(`Valor a cobrar por "${item.name}":`, String(item.price || ""));
      if (entered === null) return;

      const value = Number(entered);
      if (!Number.isFinite(value) || value < 0) {
        toast.error("Ingresa un valor válido");
        return;
      }
      unitPrice = value;
    }

    setCart((prev) => [
      ...prev,
      {
        catalogItemId: item.id,
        channel: item.channel,
        description: item.name,
        quantity: 1,
        unitPrice,
        priceType: item.price_type,
      },
    ]);
    toast.success(`${item.name} agregado al pedido`, { duration: 1500 });
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map((line, i) => (i === index ? { ...line, quantity } : line)));
  };

  const removeLine = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setClientId("");
    setClientName("");
    setClientPhone("");
    setPlate("");
    setTechnicianId("");
    setPaymentMethod("");
    setCart([]);
    setBrand("");
    setModel("");
    setDiagnosis("");
    setMileage("");
    setWorkPerformed("");
    setRecommendation("");
    setNextVisitDate("");
    setWorkOrderStatus("abierta");
    setShowClientFields(false);
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto o servicio");
      return;
    }
    if (!plate.trim()) {
      toast.error("Ingresa la placa");
      return;
    }
    if (!paymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }

    setSubmitting(true);
    const result = await createPedidoAction({
      clientId: clientId || undefined,
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
      plate,
      technicianId: technicianId || undefined,
      paymentMethod,
      items: cart.map(({ catalogItemId, channel, description, quantity, unitPrice, priceType }) => ({
        catalogItemId,
        channel,
        description,
        quantity,
        unitPrice,
        priceType,
      })),
      workshopDetails: hasTallerItem
        ? {
            brand: brand || undefined,
            model: model || undefined,
            diagnosis: diagnosis || undefined,
            mileage: mileage || undefined,
            workPerformed: workPerformed || undefined,
            recommendation: recommendation || undefined,
            nextVisitDate: nextVisitDate || undefined,
            workOrderStatus,
          }
        : undefined,
    });
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo crear el pedido", { description: result.message });
      return;
    }

    toast.success(`Pedido ${result.orderNumber} creado`);
    resetForm();
    setCartSheetOpen(false);
    router.refresh();
  };

  // Se llama dos veces (tarjeta fija de escritorio + hoja inferior de
  // celular) para no duplicar el markup; el prefijo evita ids de HTML
  // repetidos cuando ambas copias existen en el DOM al mismo tiempo.
  const renderCartCard = (idPrefix: string) => (
    <>
      {hasTallerItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orden de trabajo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}brand`}>Marca</Label>
              <Input id={`${idPrefix}brand`} value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}model`}>Modelo</Label>
              <Input id={`${idPrefix}model`} value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}mileage`}>Kilometraje</Label>
              <Input id={`${idPrefix}mileage`} value={mileage} onChange={(e) => setMileage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}workOrderStatus`}>Estado</Label>
              <select
                id={`${idPrefix}workOrderStatus`}
                className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                value={workOrderStatus}
                onChange={(e) => setWorkOrderStatus(e.target.value)}
              >
                {WORK_ORDER_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${idPrefix}diagnosis`}>Diagnóstico</Label>
              <Textarea id={`${idPrefix}diagnosis`} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${idPrefix}workPerformed`}>Trabajo realizado</Label>
              <Textarea
                id={`${idPrefix}workPerformed`}
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${idPrefix}recommendation`}>Recomendación</Label>
              <Textarea
                id={`${idPrefix}recommendation`}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}nextVisitDate`}>Próxima visita</Label>
              <Input
                id={`${idPrefix}nextVisitDate`}
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {showClientFields || clientId || clientName || clientPhone ? (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${idPrefix}clientId`}>Cliente</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => {
                      setShowClientFields(false);
                      setClientId("");
                      setClientName("");
                      setClientPhone("");
                    }}
                  >
                    Quitar
                  </button>
                </div>
                <select
                  id={`${idPrefix}clientId`}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                  value={clientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                >
                  <option value="">Cliente ocasional</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <button
                type="button"
                className="text-left text-sm text-blue-600 underline-offset-2 hover:underline sm:col-span-2 dark:text-blue-400"
                onClick={() => setShowClientFields(true)}
              >
                + Agregar cliente (opcional)
              </button>
            )}

            {(showClientFields || clientId || clientName || clientPhone) && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor={`${idPrefix}clientName`}>Nombre</Label>
                  <Input
                    id={`${idPrefix}clientName`}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${idPrefix}clientPhone`}>Celular</Label>
                  <Input
                    id={`${idPrefix}clientPhone`}
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}plate`}>Placa *</Label>
              <Input
                id={`${idPrefix}plate`}
                className="uppercase"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>

            {technicians.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}technicianId`}>Técnico</Label>
                <select
                  id={`${idPrefix}technicianId`}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}paymentMethod`}>Método de pago *</Label>
              <select
                id={`${idPrefix}paymentMethod`}
                className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Selecciona…</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Toca un servicio o producto para agregarlo al pedido.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((line, index) => (
                <div
                  key={line.catalogItemId}
                  className="flex items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-900 dark:bg-blue-950/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {CHANNEL_LABELS[line.channel]} ·{" "}
                      {line.priceType === "variable" ? "Variable" : `${formatCurrency(line.unitPrice)} c/u`}
                    </p>
                  </div>

                  {line.channel === "productos" && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQuantity(index, line.quantity - 1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm">{line.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQuantity(index, line.quantity + 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  )}

                  <span className="w-24 shrink-0 text-right text-sm font-medium">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-950/40"
                    onClick={() => removeLine(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <Button
            type="button"
            className={cn("w-full", !submitting && "bg-green-600 text-white hover:bg-green-700")}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Finalizar pedido
          </Button>
        </CardContent>
      </Card>
    </>
  );

  if (tabs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Activa al menos un módulo de negocio en Configuraciones para poder tomar pedidos.
      </p>
    );
  }

  const showCart = canCreatePedido && !pedidosBlocked && activeTab !== "parqueadero";
  const cartLabel = cart.length === 0 ? "Ver pedido" : `Ver pedido (${cart.length})`;

  return (
    <div className="space-y-4">
      <div className={cn("grid gap-4", showCart && "lg:grid-cols-2")}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {enabledChannels.map((channel) => (
              <TabsTrigger key={channel} value={channel}>
                {CHANNEL_LABELS[channel]}
              </TabsTrigger>
            ))}
            {parqueaderoEnabled && <TabsTrigger value="parqueadero">Parqueadero</TabsTrigger>}
          </TabsList>

          {enabledChannels.map((channel) => {
            const channelItems = catalogItems.filter((item) => item.channel === channel);
            return (
              <TabsContent key={channel} value={channel} className="pt-3">
                {!canCreatePedido ? (
                  <p className="text-sm text-muted-foreground">No tienes permiso para crear pedidos.</p>
                ) : pedidosBlocked ? (
                  <p className="text-sm text-red-600 dark:text-red-500">
                    Este canal está bloqueado por falta de pago. Ve a Planes para ponerte al día.
                  </p>
                ) : channelItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay servicios activos en este canal. Ve a Servicios para agregar al menos uno.
                  </p>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{CHANNEL_LABELS[channel]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {channelItems.map((item) => (
                          <Button
                            key={item.id}
                            type="button"
                            variant="outline"
                            className="h-auto flex-col items-start gap-1 whitespace-normal border-blue-200 bg-blue-50 p-3 text-left hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:hover:bg-blue-900/40"
                            onClick={() => addItem(item)}
                          >
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.price_type === "variable" ? "Variable" : formatCurrency(item.price)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}

          {parqueaderoEnabled && (
            <TabsContent value="parqueadero" className="pt-3">
              <ParqueaderoClient
                rates={parkingRates}
                openMovements={openMovements}
                clients={clients}
                graceMinutes={graceMinutes}
              />
            </TabsContent>
          )}
        </Tabs>

        {showCart && <div className="hidden space-y-4 lg:block">{renderCartCard("desktop-")}</div>}
      </div>

      {showCart && (
        <>
          <button
            type="button"
            onClick={() => setCartSheetOpen(true)}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t bg-blue-600 px-4 py-3 text-white shadow-lg lg:hidden"
          >
            <span className="text-sm font-medium">{cartLabel}</span>
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
          </button>

          {cartSheetOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Cerrar"
                className="absolute inset-0 bg-black/40"
                onClick={() => setCartSheetOpen(false)}
              />
              <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-lg border-t bg-background shadow-lg">
                <div className="flex items-center justify-between border-b p-4">
                  <h2 className="font-medium">Pedido</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Cerrar"
                    onClick={() => setCartSheetOpen(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="space-y-4 overflow-y-auto p-4">{renderCartCard("mobile-")}</div>
              </div>
            </div>
          )}
        </>
      )}

      <div className={cn("space-y-2", showCart && "pb-16 lg:pb-0")}>
        <h2 className="text-sm font-medium text-muted-foreground">Pedidos recientes (últimas 3 horas)</h2>
        <OrdersList orders={orders} countryCode={countryCode} />
      </div>
    </div>
  );
}
