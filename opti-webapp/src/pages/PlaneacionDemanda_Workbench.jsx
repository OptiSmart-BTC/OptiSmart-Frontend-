/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
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
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import { format } from "date-fns";
import { useAuth } from "../components/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";
import Plot from "react-plotly.js";

import "../styles/pages/PlaneacionDemandaWorkbench.css";
import PivotTable from "../components/PivotTable";
import DfuDetailCard from "../components/DfuDetailCard";

// === Config API (igual que en PlaneacionDemanda_planner) ===
const API_BASE = "http://localhost:3000";
const PLANNER_BASE = `${API_BASE}/planner`;

// Helper para ID único por celda (coincide con índice único del backend)
const buildCellId = (row) => {
  const fechaIso = row.Fecha
    ? new Date(row.Fecha).toISOString().slice(0, 10)
    : "";
  return `${row.session_id || row.sessionId || ""}|${row.Producto}|${row.Canal}|${row.Ubicacion}|${fechaIso}`;
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

// ==========================
// GraphComponent (para DfuDetailCard)
// ==========================
const PlannerDfuGraph = ({ dfu, series, loading }) => {
  if (!dfu) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          Selecciona un DFU en la tabla para ver la gráfica.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Cargando gráfica…</Typography>
      </Box>
    );
  }

  if (!series) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Sin datos para graficar.</Typography>
      </Box>
    );
  }

  const pick = (arr) =>
    (arr || [])
      .filter((p) => p && p.y !== null && p.y !== undefined)
      .map((p) => ({ x: p.date, y: p.y }));

  const sActual = pick(series.actual);
  const sBase = pick(series.base_fcst);
  const sPlan = pick(series.plan_fcst);
  const sPrev = pick(series.prev_year);

  const traces = [
    {
      x: sActual.map((p) => p.x),
      y: sActual.map((p) => p.y),
      type: "scatter",
      mode: "lines+markers",
      name: "Demanda Real",
      hovertemplate: "Fecha: %{x}<br>Real: %{y:,0f}<extra></extra>",
    },
    {
      x: sBase.map((p) => p.x),
      y: sBase.map((p) => p.y),
      type: "scatter",
      mode: "lines+markers",
      name: "Forecast Estadístico",
      hovertemplate: "Fecha: %{x}<br>Base: %{y:,0f}<extra></extra>",
    },
    {
      x: sPlan.map((p) => p.x),
      y: sPlan.map((p) => p.y),
      type: "scatter",
      mode: "lines+markers",
      name: "Forecast Planeado",
      hovertemplate: "Fecha: %{x}<br>Plan: %{y:,0f}<extra></extra>",
    },
    {
      x: sPrev.map((p) => p.x),
      y: sPrev.map((p) => p.y),
      type: "scatter",
      mode: "lines",
      name: "Prev Year",
      hovertemplate: "Fecha: %{x}<br>Prev: %{y:,0f}<extra></extra>",
      line: { dash: "dot" },
    },
  ];

  const layout = {
    height: 420,
    title: {
      text: `DFU: ${dfu.Producto} · ${dfu.Canal} · ${dfu.Ubicacion}`,
      font: { size: 16, family: "Roboto, Arial, sans-serif" },
    },
    xaxis: {
      title: "Fecha",
      gridcolor: "#f0f0f0",
      tickangle: -45,
      showline: true,
      linecolor: "#e0e0e0",
    },
    yaxis: {
      title: "Cantidad",
      gridcolor: "#f0f0f0",
      tickformat: ",0f",
      showline: true,
      linecolor: "#e0e0e0",
    },
    hovermode: "x unified",
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: -0.35,
      xanchor: "center",
      x: 0.5,
    },
    margin: { t: 70, r: 30, b: 90, l: 70 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
      }}
      style={{ width: "100%", height: "420px" }}
    />
  );
};

const PlaneacionDemanda_pivot_custom = () => {
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [freq, setFreq] = useState("W-MON");
  const [anchorDate, setAnchorDate] = useState(
    new Date().toISOString().slice(0, 10),
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

  // DFU seleccionado (para la 3a tarjeta)
  const [selectedDFU, setSelectedDFU] = useState(null);

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

  // === Cliente axios para planner ===
  const plannerApi = useMemo(() => {
    if (!user) return axios.create({ baseURL: PLANNER_BASE });
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
    const body = { dbName: user.dbName, freq };
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
    [plannerApi, anchorDate, pastMonths, futureMonths, yoyMode],
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

        const { data } = await plannerApi.get(
          `/${sessionId}/matrix?${params.toString()}`,
        );

        const transformed = (data.rows || []).map((row) => {
          // Normalizamos Fecha a YYYY-MM-DD
          let fechaNorm = "";
          const raw = row.Fecha;

          if (raw) {
            if (typeof raw === "string") {
              fechaNorm = raw.includes("T") ? raw.split("T")[0] : raw;
            } else if (raw instanceof Date) {
              if (!Number.isNaN(raw.getTime()))
                fechaNorm = raw.toISOString().slice(0, 10);
            } else {
              const d = new Date(raw);
              if (!Number.isNaN(d.getTime()))
                fechaNorm = d.toISOString().slice(0, 10);
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

        // Si el DFU seleccionado deja de existir con filtros nuevos, lo limpiamos
        setSelectedDFU((prev) => {
          if (!prev) return prev;
          const exists = transformed.some(
            (r) =>
              r.Producto === prev.Producto &&
              r.Canal === prev.Canal &&
              r.Ubicacion === prev.Ubicacion,
          );
          return exists ? prev : null;
        });
      } catch (err) {
        console.error(
          "Error al cargar matriz (pivot):",
          err.response?.data || err,
        );
      } finally {
        setLoading(false);
      }
    },
    [plannerApi, filters],
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
          err.response?.data || err,
        );
      }
    },
    [plannerApi],
  );

  // === 5) Flujo completo init ===
  const handleInitPlanner = async () => {
    try {
      setInitializing(true);
      const s = await openSession();
      if (!s) return;

      await plannerApi.post(`/${s.session_id}/participants/join`);
      await bootstrapSession(s.session_id);

      await fetchFilterOptions(s.session_id);
      await fetchMatrix(s.session_id, filters);
      setSessionDialogOpen(false);
    } catch (err) {
      console.error("Error inicializando Planner Pivot:", err);
    } finally {
      setInitializing(false);
    }
  };

  const handleRebootstrap = async () => {
    if (!session) return;
    try {
      setInitializing(true);
      await plannerApi.post(`/${session.session_id}/participants/join`);
      await bootstrapSession(session.session_id);

      await fetchFilterOptions(session.session_id);
      await fetchMatrix(session.session_id, filters);
      setSessionDialogOpen(false);
    } catch (err) {
      console.error("Error en rebootstrap (pivot):", err);
    } finally {
      setInitializing(false);
    }
  };

  // === 6) Guardar cambios de plan_fcst ===
  const handlePlanBlur = async (row, rawValue) => {
    if (!session || !user || !row) return;

    const str = rawValue == null ? "" : String(rawValue).trim();

    // Si no cambió vs row.plan_fcst, no pegamos
    if (str === "" && (row.plan_fcst === null || row.plan_fcst === undefined))
      return;
    if (str !== "" && Number(str) === Number(row.plan_fcst)) return;

    let plan = null;

    if (str !== "") {
      const num = Number(str.replace(",", ""));
      if (!Number.isFinite(num) || num < 0) {
        console.warn("plan_fcst inválido, se ignora:", str);
        setLocalPlans((prev) => {
          const copy = { ...prev };
          delete copy[row._id];
          return copy;
        });
        return;
      }

      const rounded = Math.round(num * 100) / 100;
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
        prev.map((r) => (r._id === row._id ? { ...r, plan_fcst: plan } : r)),
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

  // === 7) Guardar Sesion
  const handleSave = async () => {
    if (!session || saving) return;

    setSaving(true);
    try {
      await plannerApi.post(`/${session.session_id}/save`, {
        user: user.AppUser,
      });
      setHasDraftChanges(false);
    } catch (error) {
      console.error("Error guardando cambios:", error);
    } finally {
      setSaving(false);
    }
  };

  // === 7.5) Publicar y cerrar sesión
  const handlePublishAndClose = async () => {
    if (!session || publishing) return;

    setPublishing(true);
    try {
      await plannerApi.post(`/${session.session_id}/close`, {
        user: user.AppUser,
      });
      setHasDraftChanges(false);

      setRows([]);
      setLocalPlans({});
      setCollapsedProducts(new Set());
      setCollapsedChannels(new Set());
      setSession(null);
      setSelectedDFU(null);
      setSessionDialogOpen(true);
    } catch (error) {
      console.error("Error publicando y cerrando:", error);
    } finally {
      setPublishing(false);
    }
  };

  // === 8) Cerrar sesión ===
  const handleLeaveSession = async () => {
    if (!session || leaving) return;

    if (hasDraftChanges) {
      const ok = window.confirm(
        "Tienes cambios sin guardar/publicar. ¿Seguro que quieres cerrar la sesión?",
      );
      if (!ok) return;
    }

    setLeaving(true);
    try {
      await plannerApi.post(`/${session.session_id}/participants/leave`);
      setSession(null);
      setRows([]);
      setHasDraftChanges(false);
      setFilters({ Producto: "", Canal: "", Ubicacion: "" });
      setSelectedDFU(null);
      setSessionDialogOpen(true);

      setSocket((prev) => {
        try {
          prev?.disconnect();
        } catch (e) {
          console.error(e);
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
      auth: { appUser: user.AppUser },
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
    if (freq.startsWith("W-")) setYoyMode("week");
    else if (freq === "M") setYoyMode("month");
    else if (freq === "D") setYoyMode("day");
  }, [freq]);

  useEffect(() => {
    if (!session) {
      setSessionDialogOpen(true);
    }
  }, [session]);

  // Si cambian filtros y ya hay sesión, recargamos matriz
  useEffect(() => {
    if (!session) return;
    fetchMatrix(session.session_id, filters);
  }, [session, filters, fetchMatrix]);

  // === 10) Fechas visibles (ventana real cargada) ===
  const allDates = useMemo(() => {
    const setDates = new Set();
    rows.forEach((r) => {
      if (r.FechaNorm) setDates.add(r.FechaNorm);
    });
    return Array.from(setDates).sort(); // YYYY-MM-DD
  }, [rows]);

  // === 11) Estructura pivote + totales ===
  const { pivotGroups, productTotals, channelTotals } = useMemo(() => {
    const productosMap = {};
    const productTotals = {};
    const channelTotals = {};

    const ensureNestedTotal = (container, key1, key2, key3) => {
      if (!container[key1]) container[key1] = {};
      if (!container[key1][key2]) container[key1][key2] = {};
      if (!container[key1][key2][key3]) container[key1][key2][key3] = 0;
    };

    rows.forEach((r) => {
      const { Producto, Canal, Ubicacion, FechaNorm } = r;
      if (!Producto || !Canal || !Ubicacion || !FechaNorm) return;

      // Construcción jerárquica
      if (!productosMap[Producto]) productosMap[Producto] = { canalesMap: {} };
      const prod = productosMap[Producto];

      if (!prod.canalesMap[Canal])
        prod.canalesMap[Canal] = { ubicacionesMap: {} };
      const canalObj = prod.canalesMap[Canal];

      if (!canalObj.ubicacionesMap[Ubicacion]) {
        canalObj.ubicacionesMap[Ubicacion] = { rowsByDate: {} };
      }
      canalObj.ubicacionesMap[Ubicacion].rowsByDate[FechaNorm] = r;

      // Totales por producto / canal
      METRICS.forEach((m) => {
        const v = Number(r[m.key]);
        if (!Number.isFinite(v)) return;

        // producto
        ensureNestedTotal(productTotals, Producto, m.key, FechaNorm);
        productTotals[Producto][m.key][FechaNorm] += v;

        // canal
        const ck = `${Producto}|${Canal}`;
        ensureNestedTotal(channelTotals, ck, m.key, FechaNorm);
        channelTotals[ck][m.key][FechaNorm] += v;
      });
    });

    // Convertimos maps → array
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
          },
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
    <div className="pd-workbench">
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

        <Dialog
          open={sessionDialogOpen}
          onClose={() => setSessionDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ pr: 6, position: "relative" }}>
            {session
              ? "Configurar sesión del planner"
              : "Iniciar sesión del planner"}

            <IconButton
              aria-label="cerrar"
              onClick={() => setSessionDialogOpen(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Sesión
                </Typography>

                <TextField
                  select
                  label="Frecuencia"
                  size="small"
                  fullWidth
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                >
                  <MenuItem value="W-MON">W-MON (semanal)</MenuItem>
                  <MenuItem value="M">M (mensual)</MenuItem>
                  <MenuItem value="D">D (diaria)</MenuItem>
                </TextField>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  DB: {user.dbName} · Usuario: {user.AppUser}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Ventana temporal
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    type="date"
                    label="Fecha inicial del periodo"
                    size="small"
                    fullWidth
                    value={anchorDate}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ id: "anchorDate-input" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const input =
                                document.getElementById("anchorDate-input");
                              if (!input) return;
                              if (typeof input.showPicker === "function")
                                input.showPicker();
                              else input.focus();
                            }}
                          >
                            <CalendarTodayIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    onChange={(e) => setAnchorDate(e.target.value)}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setSessionDialogOpen(false)}>
              {session ? "Cancelar" : "Cerrar"}
            </Button>

            {session ? (
              <Button
                variant="contained"
                onClick={async () => {
                  await handleRebootstrap();
                  setSessionDialogOpen(false);
                }}
                disabled={initializing}
                startIcon={
                  initializing ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
              >
                {initializing ? "Recalculando…" : "Aplicar cambios"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleInitPlanner}
                disabled={initializing}
                startIcon={
                  initializing ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
              >
                {initializing ? "Iniciando…" : "Abrir sesión"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Card
          className="pd-section-top"
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
            background: "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={{ xs: 2, md: 3 }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", lg: "center" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mb: 1 }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: 1.1,
                      lineHeight: 1.2,
                    }}
                  >
                    Estado del planner
                  </Typography>

                  <Chip
                    size="small"
                    color={
                      session && session.status === "open"
                        ? "success"
                        : "default"
                    }
                    label={session ? "Sesión abierta" : "Sin sesión activa"}
                    sx={{ fontWeight: 600 }}
                  />

                  {session && (
                    <Chip
                      size="small"
                      color={hasDraftChanges ? "warning" : "default"}
                      variant={hasDraftChanges ? "filled" : "outlined"}
                      label={
                        hasDraftChanges ? "Cambios pendientes" : "Sin cambios"
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Stack>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    lineHeight: 1.2,
                  }}
                >
                  {session
                    ? session.session_id
                    : "Configura una sesión para comenzar"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.75 }}
                >
                  {!session
                    ? "Define frecuencia y ventana temporal para cargar la hoja de trabajo."
                    : loading
                      ? "Cargando datos del planner…"
                      : publishing
                        ? "Publicando cambios en forecast…"
                        : saving
                          ? "Guardando cambios de celdas…"
                          : leaving
                            ? "Cerrando sesión…"
                            : "Datos cargados y listos para edición."}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  divider={<Divider orientation="vertical" flexItem />}
                  sx={{
                    mt: 1.5,
                    color: "text.secondary",
                    "& .planner-meta-item": {
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      minHeight: 22,
                    },
                  }}
                >
                  <Box className="planner-meta-item">Frecuencia: {freq}</Box>
                  <Box className="planner-meta-item">
                    Ventana: {pastMonths} atrás / {futureMonths} adelante
                  </Box>
                  <Box className="planner-meta-item">
                    Fecha ancla: {anchorDate}
                  </Box>
                  <Box className="planner-meta-item">DB: {user.dbName}</Box>
                  <Box className="planner-meta-item">
                    Usuario: {user.AppUser}
                  </Box>
                </Stack>
              </Box>

              <Box
                sx={{
                  minWidth: { xs: "100%", lg: 320 },
                  maxWidth: { xs: "100%", lg: 340 },
                  alignSelf: "stretch",
                }}
              >
                {!session ? (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: { xs: "stretch", lg: "center" },
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => setSessionDialogOpen(true)}
                      sx={{
                        minWidth: { xs: "100%", sm: 220 },
                        py: 1.15,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        boxShadow: "0 8px 18px rgba(25, 118, 210, 0.22)",
                      }}
                    >
                      Abrir sesión
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "rgba(15, 23, 42, 0.02)",
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.25}
                      >
                        <Button
                          variant="contained"
                          color={hasDraftChanges ? "warning" : "success"}
                          fullWidth
                          disabled={!session || saving || publishing || leaving}
                          onClick={handleSave}
                          startIcon={
                            saving ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : null
                          }
                          sx={{
                            py: 1.05,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                            boxShadow: hasDraftChanges
                              ? "0 8px 18px rgba(237, 108, 2, 0.22)"
                              : "0 8px 18px rgba(46, 125, 50, 0.22)",
                          }}
                        >
                          {saving ? "Guardando…" : "Guardar cambios"}
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          disabled={
                            !session || publishing || leaving || hasDraftChanges
                          }
                          onClick={handlePublishAndClose}
                          startIcon={
                            publishing ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : null
                          }
                          sx={{
                            py: 1.05,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            borderWidth: 1.25,
                          }}
                        >
                          {publishing ? "Publicando…" : "Publicar y cerrar"}
                        </Button>
                      </Stack>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                      >
                        <Button
                          variant="text"
                          onClick={() => setSessionDialogOpen(true)}
                          sx={{
                            justifyContent: { xs: "center", sm: "flex-start" },
                            textTransform: "none",
                            fontWeight: 600,
                            px: 1,
                          }}
                        >
                          Configurar ventana
                        </Button>

                        <Button
                          variant="text"
                          color="inherit"
                          disabled={!session || leaving || publishing || saving}
                          onClick={handleLeaveSession}
                          sx={{
                            justifyContent: { xs: "center", sm: "flex-end" },
                            textTransform: "none",
                            fontWeight: 500,
                            color: "text.secondary",
                          }}
                        >
                          {leaving ? "Cerrando sesión…" : "Cerrar sesión"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Solo mostramos tabla + tarjeta DFU si hay sesión */}
        {session ? (
          <>
            <div className="pd-section-table">
              <PivotTable
                allDates={allDates}
                pivotGroups={pivotGroups}
                METRICS={METRICS}
                prevYearLabel={prevYearLabel}
                anchorDate={anchorDate}
                loading={loading}
                collapsedProducts={collapsedProducts}
                collapsedChannels={collapsedChannels}
                toggleProduct={toggleProduct}
                toggleChannel={toggleChannel}
                productTotals={productTotals}
                channelTotals={channelTotals}
                computeGroupAsertividad={computeGroupAsertividad}
                localPlans={localPlans}
                setLocalPlans={setLocalPlans}
                handlePlanBlur={handlePlanBlur}
                selectedDFU={selectedDFU}
                onSelectDFU={(dfu) => setSelectedDFU(dfu)}
              />
            </div>

            <DfuDetailCard
              sessionId={session.session_id}
              selectedDFU={selectedDFU}
              allDates={allDates}
              plannerApi={plannerApi}
              GraphComponent={PlannerDfuGraph}
            />
          </>
        ) : (
          <Box
            mt={6}
            sx={{
              textAlign: "center",
              py: 6,
              px: 3,
              border: "1px dashed rgba(0,0,0,0.14)",
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.5)",
            }}
          >
            <Typography variant="h6" gutterBottom>
              No hay sesión activa
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 520, mx: "auto", mb: 3 }}
            >
              Puedes abrir una nueva sesión del planner o salir de esta vista
              usando el menú lateral.
            </Typography>

            <Button
              variant="contained"
              onClick={() => setSessionDialogOpen(true)}
            >
              Abrir sesión
            </Button>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default PlaneacionDemanda_pivot_custom;
