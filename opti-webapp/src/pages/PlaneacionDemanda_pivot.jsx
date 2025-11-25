/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { format } from "date-fns";
import { useAuth } from "./../components/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";

import "./../styles/pages/PlaneacionDemanda_pivot_custom.css";

// === Config API (igual que en PlaneacionDemanda_planner) ===
const API_BASE = "http://localhost:3000";
const PLANNER_BASE = `${API_BASE}/planner`;

// Helper para ID único por celda (coincide con índice único del backend)
const buildCellId = (row) => {
  const fechaIso = row.Fecha
    ? new Date(row.Fecha).toISOString().slice(0, 10)
    : "";
  return `${row.session_id || row.sessionId || ""}|${row.Producto}|${
    row.Canal
  }|${row.Ubicacion}|${fechaIso}`;
};

const formatFecha = (value) => {
  if (!value) return "";
  try {
    return format(new Date(value), "yyyy-MM-dd");
  } catch {
    return String(value);
  }
};

// Asertividad agregada a nivel grupo:
// totalActual vs totalPlan (plan_fcst)
const computeGroupAsertividad = (totalActual, totalPlan) => {
  const a = Number(totalActual);
  const p = Number(totalPlan);
  if (!Number.isFinite(a) || !Number.isFinite(p) || p === 0) return null;
  // % de cumplimiento
  return a / p;
};

// Métricas que vamos a mostrar como filas en la columna "Values"
// eslint-disable-next-line react-refresh/only-export-components
const METRICS = [
  { key: "base_fcst", label: "Forecast Estadistico" },
  { key: "plan_fcst", label: "Forecast Planeado" }, // editable
  { key: "prev_year", label: "prev_year" },
  { key: "asertividad", label: "asertividad" },
  { key: "actual", label: "Demanda Real" },
];

const PAGE_SIZE_PIVOT = 500000; // tamaño alto para traer todo el set de la ventana

const PlaneacionDemanda_pivot_custom = () => {
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [freq, setFreq] = useState("W-MON");
  const [anchorDate, setAnchorDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const anchorYear = anchorDate ? Number(anchorDate.split("-")[0]) : null;
  const prevYearLabel = anchorYear
    ? `Demanda ${anchorYear - 1}`
    : "Demanda YoY";

  const [pastMonths, setPastMonths] = useState(2);
  const [futureMonths, setFutureMonths] = useState(4);
  const [yoyMode, setYoyMode] = useState("week");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  // Grupos colapsados
  const [collapsedProducts, setCollapsedProducts] = useState(() => new Set());
  const [collapsedChannels, setCollapsedChannels] = useState(() => new Set());
  const [collapsedLocations, setCollapsedLocations] = useState(() => new Set());

  const toggleProduct = (producto) => {
    setCollapsedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(producto)) next.delete(producto);
      else next.add(producto);
      return next;
    });
  };

  const toggleChannel = (producto, canal) => {
    const key = `${producto}|${canal}`;
    setCollapsedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleLocation = (producto, canal, ubicacion) => {
    const key = `${producto}|${canal}|${ubicacion}`;
    setCollapsedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [filters, setFilters] = useState({
    Producto: "",
    Canal: "",
    Ubicacion: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    productos: [],
    canales: [],
    ubicaciones: [],
  });

  const [socket, setSocket] = useState(null);

  // Estado local para lo que el usuario teclea en plan_fcst (antes de guardar)
  const [localPlans, setLocalPlans] = useState({});

  // === Cliente axios para planner (mismo patrón que tu componente actual) ===
  const plannerApi = useMemo(() => {
    if (!user) {
      return axios.create({ baseURL: PLANNER_BASE });
    }
    return axios.create({
      baseURL: PLANNER_BASE,
      headers: {
        "x-app-user": user.AppUser,
        "x-db-name": user.dbName,
      },
    });
  }, [user]);

  const handleChangeFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // === 1) Abrir sesión ===
  const openSession = useCallback(async () => {
    if (!user) return null;
    const body = {
      dbName: user.dbName,
      freq,
    };
    const { data } = await plannerApi.post("/session/open", body);
    setSession(data);
    return data;
  }, [plannerApi, user, freq]);

  // === 2) Bootstrap de la sesión ===
  const bootstrapSession = useCallback(
    async (sessionId) => {
      const body = {
        anchorDate,
        pastMonths: Number(pastMonths),
        futureMonths: Number(futureMonths),
        yoyMode,
      };
      const { data } = await plannerApi.post(`/${sessionId}/bootstrap`, body);
      console.log("bootstrap (pivot) ->", data);
      return data;
    },
    [plannerApi, anchorDate, pastMonths, futureMonths, yoyMode]
  );

  // === 3) Cargar matriz completa (sin paginación visible para pivot) ===
  const fetchMatrix = useCallback(
    async (sessionId, filtrosArg) => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("size", String(PAGE_SIZE_PIVOT));

        const f = filtrosArg || filters;
        if (f.Producto) params.set("Producto", f.Producto);
        if (f.Canal) params.set("Canal", f.Canal);
        if (f.Ubicacion) params.set("Ubicacion", f.Ubicacion);

        // 👇 Ya no enviamos anchorDate aquí

        const { data } = await plannerApi.get(
          `/${sessionId}/matrix?${params.toString()}`
        );

        const transformed = (data.rows || []).map((row) => {
          // Normalizamos Fecha a YYYY-MM-DD
          let fechaNorm = "";
          const raw = row.Fecha;

          if (raw) {
            if (typeof raw === "string") {
              fechaNorm = raw.includes("T") ? raw.split("T")[0] : raw;
            } else if (raw instanceof Date) {
              if (!Number.isNaN(raw.getTime())) {
                fechaNorm = raw.toISOString().slice(0, 10);
              }
            } else {
              const d = new Date(raw);
              if (!Number.isNaN(d.getTime())) {
                fechaNorm = d.toISOString().slice(0, 10);
              }
            }
          }

          return {
            ...row,
            FechaNorm: fechaNorm,
            id: buildCellId({ ...row, session_id: sessionId }),
            session_id: sessionId,
          };
        });

        console.log("Sample row (pivot matrix):", transformed[0]);
        setRows(transformed);
      } catch (err) {
        console.error(
          "Error al cargar matriz (pivot):",
          err.response?.data || err
        );
      } finally {
        setLoading(false);
      }
    },
    [plannerApi, filters]
  );

  // === 4) Cargar opciones de filtros ===
  const fetchFilterOptions = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      try {
        const { data } = await plannerApi.get(`/${sessionId}/filters`);
        setFilterOptions({
          productos: data.Producto || [],
          canales: data.Canal || [],
          ubicaciones: data.Ubicacion || [],
        });
      } catch (err) {
        console.error(
          "Error cargando opciones de filtro (pivot):",
          err.response?.data || err
        );
      }
    },
    [plannerApi]
  );

  // === 5) Flujo completo init ===
  const handleInitPlanner = async () => {
    try {
      const s = await openSession();
      if (!s) return;

      await plannerApi.post(`/${s.session_id}/participants/join`);
      await bootstrapSession(s.session_id);

      await fetchFilterOptions(s.session_id);
      await fetchMatrix(s.session_id, filters);
    } catch (err) {
      console.error("Error inicializando Planner Pivot:", err);
    }
  };

  const handleRebootstrap = async () => {
    if (!session) return;
    try {
      await plannerApi.post(`/${session.session_id}/participants/join`);
      await bootstrapSession(session.session_id);

      await fetchFilterOptions(session.session_id);
      await fetchMatrix(session.session_id, filters);
    } catch (err) {
      console.error("Error en rebootstrap (pivot):", err);
    }
  };

  // === 6) Guardar cambios de plan_fcst ===
  const handlePlanBlur = async (row, rawValue) => {
    if (!session || !user || !row) return;

    const str = rawValue == null ? "" : String(rawValue).trim();

    // Si no cambió vs row.plan_fcst, no pegamos
    if (str === "" && (row.plan_fcst === null || row.plan_fcst === undefined)) {
      return;
    }
    if (str !== "" && Number(str) === Number(row.plan_fcst)) {
      return;
    }

    let plan = null;

    if (str !== "") {
      // ⬇⬇⬇ PARSEO SEGURO (evita comas, espacios, etc.)
      const num = Number(str.replace(",", ""));

      if (!Number.isFinite(num) || num < 0) {
        console.warn("plan_fcst inválido, se ignora:", str);

        // reset local
        setLocalPlans((prev) => {
          const copy = { ...prev };
          delete copy[row._id];
          return copy;
        });
        return;
      }

      // ⬇⬇⬇ REDONDEO A 2 DECIMALES
      const rounded = Math.round(num * 100) / 100;

      // Guardamos así
      plan = rounded;
    }

    const payloadBase = {
      cellId: row._id,
      Producto: row.Producto,
      Canal: row.Canal,
      Ubicacion: row.Ubicacion,
      Fecha: row.FechaNorm || formatFecha(row.Fecha),
      user: user.AppUser,
    };

    setSaving(true);
    try {
      await plannerApi.put(`/${session.session_id}/cell`, {
        ...payloadBase,
        plan_fcst: plan,
      });

      // Actualizar rows en memoria
      setRows((prev) =>
        prev.map((r) => (r._id === row._id ? { ...r, plan_fcst: plan } : r))
      );
      setHasDraftChanges(true);

      // Limpiar buffer local
      setLocalPlans((prev) => {
        const copy = { ...prev };
        delete copy[row._id];
        return copy;
      });
    } catch (error) {
      console.error("Error guardando plan_fcst (pivot):", error);
    } finally {
      setSaving(false);
    }
  };

  // === 7) Publicar sesión -> demand_forecast_actual ===
  const handlePublish = async () => {
    if (!session || publishing) return;

    setPublishing(true);
    try {
      await plannerApi.post(`/${session.session_id}/publish`, {
        user: user.AppUser,
      });

      // 👉 El backend ya cerró la sesión y limpió planner_cells,
      //    así que reflejamos eso en el front:
      setHasDraftChanges(false);

      // Limpiamos la tabla y colapsos
      setRows([]);
      setLocalPlans({});
      setCollapsedProducts(new Set());
      setCollapsedChannels(new Set());

      // Marcamos que ya no hay sesión activa
      setSession(null);
    } catch (error) {
      console.error("Error publicando cambios:", error);
    } finally {
      setPublishing(false);
    }
  };

  // === 8) Cerrar sesión ===
  const handleLeaveSession = async () => {
    if (!session) return;
    setLeaving(true);
    try {
      await plannerApi.post(`/${session.session_id}/participants/leave`);
      setSession(null);
      setRows([]);
      setHasDraftChanges(false);
      setFilters({ Producto: "", Canal: "", Ubicacion: "" });
      setSocket((prev) => {
        try {
          prev?.disconnect();
        } catch (e) {
          console.error("Error al cerrar socket (pivot):", e);
        }
        return null;
      });
    } catch (err) {
      console.error("Error cerrando sesión Planner Pivot:", err);
    } finally {
      setLeaving(false);
    }
  };

  // === 9) Socket.io (colaboración tiempo real) ===
  useEffect(() => {
    if (!session || !user) return;

    const s = io(API_BASE, {
      transports: ["websocket"],
      auth: {
        appUser: user.AppUser,
        // opcional: si ya tienes el nombre de la base en el front:
        // dbName: currentDbName,
      },
    });

    s.emit("planner:join", { session_id: session.session_id });

    s.on("cellUpdated", (msg) => {
      if (!msg) return;
      const id = buildCellId({ ...msg, session_id: session.session_id });

      setRows((prev) => {
        const idx = prev.findIndex((r) => r.id === id);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], ...msg, id };
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      });
    });

    setSocket(s);

    return () => {
      try {
        s.emit("planner:leave", { session_id: session.session_id });
        s.disconnect();
      } catch (e) {
        console.error("Error cerrando socket planner (pivot):", e);
      }
    };
  }, [session, user]);

  // Ajustar automáticamente el YoY-mode según la frecuencia
  useEffect(() => {
    if (freq.startsWith("W-")) {
      setYoyMode("week");
    } else if (freq === "M") {
      setYoyMode("month");
    } else if (freq === "D") {
      setYoyMode("day");
    }
  }, [freq]);

  // Si cambian filtros y ya hay sesión, recargamos matriz
  useEffect(() => {
    if (!session) return;
    fetchMatrix(session.session_id, filters);
  }, [session, filters, fetchMatrix]);

  // === 10) Construir estructura pivote ===
  const allDates = useMemo(() => {
    const setDates = new Set();
    rows.forEach((r) => {
      if (r.FechaNorm) setDates.add(r.FechaNorm);
    });
    return Array.from(setDates).sort(); // YYYY-MM-DD ya ordena lexicográfico = cronológico
  }, [rows]);

  /**
   * Estructura:
   * groups = [
   *   {
   *     producto,
   *     rowSpanProducto,
   *     canales: [
   *       {
   *         canal,
   *         rowSpanCanal,
   *         ubicaciones: [
   *           {
   *             ubicacion,
   *             rowSpanUbic: METRICS.length,
   *             rowsByDate: { [fechaNorm]: rowOriginal }
   *           }
   *         ]
   *       }
   *     ]
   *   }
   * ]
   */
  const { pivotGroups, productTotals, channelTotals } = useMemo(() => {
    const byKey = {};
    rows.forEach((r) => {
      if (!r.Producto || !r.Canal || !r.Ubicacion || !r.FechaNorm) return;
      const key = `${r.Producto}|${r.Canal}|${r.Ubicacion}|${r.FechaNorm}`;
      byKey[key] = r;
    });

    const productosMap = {}; // Producto -> canales → ubicaciones → rows
    const productTotals = {}; // Producto -> metricKey -> fecha -> total
    const channelTotals = {}; // Producto|Canal -> metricKey -> fecha -> total

    rows.forEach((r) => {
      const { Producto, Canal, Ubicacion, FechaNorm } = r;
      if (!Producto || !Canal || !Ubicacion || !FechaNorm) return;

      // ===============================
      // 1) Construcción jerárquica
      // ===============================
      if (!productosMap[Producto]) {
        productosMap[Producto] = { canalesMap: {} };
      }
      const prod = productosMap[Producto];

      if (!prod.canalesMap[Canal]) {
        prod.canalesMap[Canal] = { ubicacionesMap: {} };
      }
      const canalObj = prod.canalesMap[Canal];

      if (!canalObj.ubicacionesMap[Ubicacion]) {
        canalObj.ubicacionesMap[Ubicacion] = { rowsByDate: {} };
      }
      const ubicObj = canalObj.ubicacionesMap[Ubicacion];

      ubicObj.rowsByDate[FechaNorm] =
        byKey[`${Producto}|${Canal}|${Ubicacion}|${FechaNorm}`];

      // ===============================
      // 2) Totales por Producto
      // ===============================
      if (!productTotals[Producto]) productTotals[Producto] = {};

      METRICS.forEach((m) => {
        const v = r[m.key];
        if (v == null || isNaN(Number(v))) return;
        const num = Number(v);
        if (!productTotals[Producto][m.key]) {
          productTotals[Producto][m.key] = {};
        }
        productTotals[Producto][m.key][FechaNorm] =
          (productTotals[Producto][m.key][FechaNorm] || 0) + num;
      });

      // ===============================
      // 3) Totales por Canal
      // ===============================
      const canalKey = `${Producto}|${Canal}`;
      if (!channelTotals[canalKey]) channelTotals[canalKey] = {};

      METRICS.forEach((m) => {
        const v = r[m.key];
        if (v == null || isNaN(Number(v))) return;
        const num = Number(v);
        if (!channelTotals[canalKey][m.key]) {
          channelTotals[canalKey][m.key] = {};
        }
        channelTotals[canalKey][m.key][FechaNorm] =
          (channelTotals[canalKey][m.key][FechaNorm] || 0) + num;
      });
    });

    // ===============================
    // 4) Convertimos maps → array como antes
    // ===============================
    const groups = [];

    Object.entries(productosMap).forEach(([producto, prodVal]) => {
      const canales = [];
      let totalRowsProducto = 0;

      Object.entries(prodVal.canalesMap).forEach(([canal, canalVal]) => {
        const ubicaciones = [];
        let totalRowsCanal = 0;

        Object.entries(canalVal.ubicacionesMap).forEach(
          ([ubicacion, ubicVal]) => {
            const rowSpanUbic = METRICS.length;
            totalRowsCanal += rowSpanUbic;
            ubicaciones.push({
              ubicacion,
              rowSpanUbic,
              rowsByDate: ubicVal.rowsByDate,
            });
          }
        );

        canales.push({
          canal,
          rowSpanCanal: totalRowsCanal,
          ubicaciones,
        });
        totalRowsProducto += totalRowsCanal;
      });

      groups.push({
        producto,
        rowSpanProducto: totalRowsProducto,
        canales,
      });
    });

    return { pivotGroups: groups, productTotals, channelTotals };
  }, [rows]);

  if (!user) {
    return (
      <Box p={3}>
        <Typography variant="body1">Cargando usuario...</Typography>
      </Box>
    );
  }

  return (
    <div className="pivot-layout">
      <Box
        p={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Planner de Demanda
        </Typography>

        {/* Panel superior: sesión + ventana temporal + estado */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Sesión */}
          <Card className="pivot-card" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Sesión del Planner
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <TextField
                  select
                  label="Frecuencia"
                  size="small"
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                >
                  <MenuItem value="W-MON">W-MON (semanal)</MenuItem>
                  <MenuItem value="M">M (mensual)</MenuItem>
                  <MenuItem value="D">D (diaria)</MenuItem>
                </TextField>
                <Button variant="contained" onClick={handleInitPlanner}>
                  Abrir / Cargar sesión
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                DB: {user.dbName} · Usuario: {user.AppUser}
              </Typography>
              <Box mt={1}>
                {session ? (
                  <Chip
                    size="small"
                    color={session.status === "open" ? "success" : "default"}
                    label={`Sesión: ${session.session_id} · Estado: ${session.status}`}
                  />
                ) : (
                  <Chip size="small" label="Sin sesión activa" />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Ventana temporal */}
          <Card className="pivot-card" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Ventana temporal (bootstrap)
              </Typography>

              <Stack spacing={1}>
                {/* Fila 1: fecha a todo el ancho */}
                <TextField
                  type="date"
                  label="Fecha inicial del periodo"
                  size="small"
                  fullWidth
                  value={anchorDate}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ id: "anchorDate-input" }} // id para ubicar el input
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const input =
                              document.getElementById("anchorDate-input");
                            if (!input) return;

                            // Si el navegador soporta showPicker(), úsalo.
                            if (typeof input.showPicker === "function") {
                              input.showPicker();
                            } else {
                              // Fallback: al menos enfocamos el campo
                              input.focus();
                            }
                          }}
                        >
                          <CalendarTodayIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onChange={(e) => setAnchorDate(e.target.value)}
                />

                {/* Fila 2: periodos pasados / futuros */}
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Periodos pasados"
                    type="number"
                    size="small"
                    fullWidth
                    value={pastMonths}
                    onChange={(e) => setPastMonths(e.target.value)}
                  />
                  <TextField
                    label="Periodos futuros"
                    type="number"
                    size="small"
                    fullWidth
                    value={futureMonths}
                    onChange={(e) => setFutureMonths(e.target.value)}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card className="pivot-card" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Estado
              </Typography>

              <Typography variant="body2">
                {!session
                  ? "Sin sesión activa"
                  : loading
                  ? "Cargando datos…"
                  : publishing
                  ? "Publicando cambios en forecast…"
                  : saving
                  ? "Guardando cambios de celdas…"
                  : leaving
                  ? "Cerrando sesión…"
                  : "Datos cargados"}
              </Typography>

              <Typography variant="body2">
                {hasDraftChanges
                  ? "Hay cambios sin publicar"
                  : "Sin cambios pendientes"}
              </Typography>

              {/* Botones en la misma fila */}
              <Stack direction="row" spacing={2} mt={2}>
                <Button
                  variant="contained"
                  color={hasDraftChanges ? "warning" : "success"}
                  disabled={!session || publishing || leaving}
                  onClick={handlePublish}
                  startIcon={
                    publishing ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : null
                  }
                >
                  {publishing ? "Publicando…" : "Publicar cambios"}
                </Button>

                <Button
                  variant="outlined"
                  disabled={!session || leaving || publishing}
                  onClick={handleLeaveSession}
                >
                  {leaving ? "Cerrando sesión…" : "Cerrar sesión"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Solo mostramos filtros + tabla si hay sesión */}
        {session ? (
          <>
            {/* Tabla pivote */}
            <Box
              className="pivot-wrapper"
              sx={{
                width: "100%",
                maxWidth: "100%", // <- aquí sí lo fijamos al ancho disponible
                maxHeight: 600,
                overflowX: "auto", // <- scroll horizontal interno
                overflowY: "auto", // <- scroll vertical interno
              }}
            >
              <div className="pivot-inner">
                <table className="pivot-table">
                  <thead>
                    <tr>
                      <th className="col-producto">Producto</th>
                      <th className="col-canal">Canal</th>
                      <th className="col-ubicacion">Ubicación</th>
                      <th className="col-values">Values</th>
                      {allDates.map((d) => {
                        const [y, m, dd] = d.split("-");
                        const label = `${dd}/${m}/${y}`;
                        return (
                          <th key={d} className="col-fecha">
                            {label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {pivotGroups.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={4 + allDates.length}
                          style={{ padding: "8px", textAlign: "center" }}
                        >
                          No hay datos para la ventana y filtros seleccionados.
                        </td>
                      </tr>
                    )}

                    {pivotGroups.map((pg, idxProd) => {
                      // ---- Clave y estado de colapso del PRODUCTO ----
                      const productKey = pg.producto;
                      const productCollapsed =
                        collapsedProducts.has(productKey);

                      // ---- rowSpan REAL del producto, considerando canales colapsados ----
                      const productRowSpan = productCollapsed
                        ? METRICS.length // si está colapsado solo se ven las METRICS de un bloque
                        : pg.canales.reduce((total, canal) => {
                            const channelKey = `${pg.producto}|${canal.canal}`;
                            const channelCollapsed =
                              collapsedChannels.has(channelKey);
                            // canal colapsado = solo METRICS filas, si no, su rowSpanCanal normal
                            return (
                              total +
                              (channelCollapsed
                                ? METRICS.length
                                : canal.rowSpanCanal)
                            );
                          }, 0);

                      return pg.canales.map((cg, idxCanal) =>
                        cg.ubicaciones.map((ug, idxUbic) =>
                          METRICS.map((metric, idxMetric) => {
                            const isFirstRowProducto =
                              idxCanal === 0 &&
                              idxUbic === 0 &&
                              idxMetric === 0;
                            const isFirstRowCanal =
                              idxUbic === 0 && idxMetric === 0;
                            const isFirstRowUbic = idxMetric === 0;

                            const channelKey = `${pg.producto}|${cg.canal}`;
                            const channelCollapsed =
                              collapsedChannels.has(channelKey);

                            // ================================
                            // Ocultar filas según colapso
                            // ================================
                            if (
                              productCollapsed &&
                              !(idxCanal === 0 && idxUbic === 0)
                            ) {
                              return null; // producto colapsado: solo el primer canal/ubic
                            }

                            if (
                              !productCollapsed &&
                              channelCollapsed &&
                              idxUbic !== 0
                            ) {
                              return null; // canal colapsado: solo la primera ubicación
                            }

                            const isProductAgg = productCollapsed;
                            const isChannelAgg =
                              !productCollapsed && channelCollapsed;
                            const isAggregated = isProductAgg || isChannelAgg;

                            return (
                              <tr
                                key={`${idxProd}-${idxCanal}-${idxUbic}-${metric.key}`}
                              >
                                {/* ============ PRODUCTO ============ */}
                                {isFirstRowProducto && (
                                  <td
                                    rowSpan={productRowSpan}
                                    className="col-producto pivot-row-header"
                                  >
                                    <button
                                      type="button"
                                      className="pivot-toggle-btn"
                                      onClick={() => toggleProduct(pg.producto)}
                                    >
                                      {productCollapsed ? "+" : "–"}
                                    </button>{" "}
                                    {pg.producto}
                                  </td>
                                )}

                                {/* ============ CANAL ============ */}
                                {isFirstRowCanal && (
                                  <>
                                    {productCollapsed ? (
                                      <td
                                        rowSpan={METRICS.length}
                                        className="col-canal pivot-row-header"
                                      >
                                        Total canales
                                      </td>
                                    ) : (
                                      <td
                                        rowSpan={
                                          channelCollapsed
                                            ? METRICS.length
                                            : cg.rowSpanCanal
                                        }
                                        className="col-canal pivot-row-header"
                                      >
                                        <button
                                          type="button"
                                          className="pivot-toggle-btn"
                                          onClick={() =>
                                            toggleChannel(pg.producto, cg.canal)
                                          }
                                        >
                                          {channelCollapsed ? "+" : "–"}
                                        </button>{" "}
                                        {cg.canal}
                                      </td>
                                    )}
                                  </>
                                )}

                                {/* ============ UBICACIÓN ============ */}
                                {isFirstRowUbic && (
                                  <>
                                    {productCollapsed || channelCollapsed ? (
                                      <td
                                        rowSpan={METRICS.length}
                                        className="col-ubicacion pivot-row-header"
                                      >
                                        Total ubicaciones
                                      </td>
                                    ) : (
                                      <td
                                        rowSpan={ug.rowSpanUbic}
                                        className="col-ubicacion pivot-row-header"
                                      >
                                        {ug.ubicacion}
                                      </td>
                                    )}
                                  </>
                                )}

                                {/* ================== COLUMNA VALUES ================== */}
                                <td className="col-values">
                                  {metric.key === "prev_year"
                                    ? prevYearLabel
                                    : metric.label}
                                </td>

                                {/* ================== CELDAS POR FECHA ================== */}
                                {allDates.map((d) => {
                                  const dateKey = d; // "YYYY-MM-DD"
                                  const isPast =
                                    anchorDate && dateKey < anchorDate;

                                  // Fila base (detalle por ubicación) si no estamos agregando
                                  const baseRow = !isAggregated
                                    ? ug.rowsByDate[dateKey] || null
                                    : null;

                                  let rawValue = null;

                                  if (isProductAgg) {
                                    // Totales por PRODUCTO
                                    if (metric.key === "asertividad") {
                                      const totalsByMetric =
                                        productTotals[pg.producto] || {};
                                      const totalPlan =
                                        totalsByMetric["plan_fcst"]?.[
                                          dateKey
                                        ] ?? null;
                                      const totalActual =
                                        totalsByMetric["actual"]?.[dateKey] ??
                                        null;
                                      rawValue = computeGroupAsertividad(
                                        totalActual,
                                        totalPlan
                                      );
                                    } else {
                                      rawValue =
                                        productTotals[pg.producto]?.[
                                          metric.key
                                        ]?.[dateKey] ?? null;
                                    }
                                  } else if (isChannelAgg) {
                                    // Totales por CANAL (Producto|Canal)
                                    const cKey = `${pg.producto}|${cg.canal}`;
                                    if (metric.key === "asertividad") {
                                      const totalsByMetric =
                                        channelTotals[cKey] || {};
                                      const totalPlan =
                                        totalsByMetric["plan_fcst"]?.[
                                          dateKey
                                        ] ?? null;
                                      const totalActual =
                                        totalsByMetric["actual"]?.[dateKey] ??
                                        null;
                                      rawValue = computeGroupAsertividad(
                                        totalActual,
                                        totalPlan
                                      );
                                    } else {
                                      rawValue =
                                        channelTotals[cKey]?.[metric.key]?.[
                                          dateKey
                                        ] ?? null;
                                    }
                                  } else {
                                    // Detalle por ubicación
                                    rawValue = baseRow
                                      ? baseRow[metric.key]
                                      : null;
                                  }

                                  // Clave estable
                                  let cellKey = "";
                                  if (!isAggregated && baseRow) {
                                    cellKey = baseRow._id;
                                  } else {
                                    const aggTag = isProductAgg
                                      ? `P|${pg.producto}`
                                      : isChannelAgg
                                      ? `C|${pg.producto}|${cg.canal}`
                                      : `U|${pg.producto}|${cg.canal}|${ug.ubicacion}`;
                                    cellKey = `${aggTag}|${metric.key}|${dateKey}`;
                                  }

                                  // ===== PLAN_FCST (editable solo en detalle & futuro) =====
                                  if (metric.key === "plan_fcst") {
                                    const numeric =
                                      rawValue != null && rawValue !== ""
                                        ? Number(rawValue)
                                        : null;
                                    const formatted =
                                      numeric != null && !Number.isNaN(numeric)
                                        ? numeric.toFixed(2)
                                        : "";

                                    const locked =
                                      isAggregated || isPast || !baseRow;

                                    if (locked) {
                                      return (
                                        <td
                                          key={cellKey}
                                          className="pivot-cell pivot-cell-readonly pivot-cell-locked"
                                        >
                                          {formatted}
                                        </td>
                                      );
                                    }

                                    const value =
                                      localPlans[baseRow._id] ?? formatted;

                                    return (
                                      <td
                                        key={cellKey}
                                        className="pivot-cell pivot-cell-editable"
                                      >
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="pivot-input"
                                          value={value}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            setLocalPlans((prev) => ({
                                              ...prev,
                                              [baseRow._id]: v,
                                            }));
                                          }}
                                          onBlur={(e) =>
                                            handlePlanBlur(
                                              baseRow,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </td>
                                    );
                                  }

                                  // ===== OTRAS MÉTRICAS =====
                                  const display = (() => {
                                    if (
                                      rawValue === null ||
                                      rawValue === undefined
                                    )
                                      return "";

                                    // === Mostrar asertividad como porcentaje 0–100 ===
                                    if (metric.key === "asertividad") {
                                      const ratio = Number(rawValue); // ratio 0–1
                                      if (!Number.isFinite(ratio)) return "";
                                      const pct = ratio * 100;

                                      return (
                                        pct.toLocaleString("es-MX", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }) + "%"
                                      );
                                    }
                                    // === Otras métricas ===
                                    return Number(rawValue).toLocaleString(
                                      "es-MX",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    );
                                  })();

                                  const lockedClass =
                                    isPast || isAggregated
                                      ? " pivot-cell-locked"
                                      : "";

                                  return (
                                    <td
                                      key={cellKey}
                                      className={
                                        "pivot-cell pivot-cell-readonly" +
                                        lockedClass
                                      }
                                    >
                                      {display}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Box>
          </>
        ) : (
          <Box mt={4}>
            <Typography variant="body1" color="text.secondary" align="center">
              No hay sesión activa. Abre o carga una sesión para empezar a
              planear.
            </Typography>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default PlaneacionDemanda_pivot_custom;
