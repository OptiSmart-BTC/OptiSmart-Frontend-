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
import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import { useAuth } from "./../components/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";

// Ajusta si luego usas ENV:
// const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
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

const PlaneacionDemandaPlanner = () => {
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [freq, setFreq] = useState("W-MON");

  const [anchorDate, setAnchorDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const anchorYear = anchorDate ? Number(anchorDate.split("-")[0]) : null;
const prevYearLabel = anchorYear ? `Demanda ${anchorYear - 1}` : "Demanda YoY";

  const [pastMonths, setPastMonths] = useState(2);
  const [futureMonths, setFutureMonths] = useState(4);
  const [yoyMode, setYoyMode] = useState("week");

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  const [publishing, setPublishing] = useState(false);
  const [leaving, setLeaving] = useState(false); // opcional, para cerrar sesión

  const [filters, setFilters] = useState({
    Producto: "",
    Canal: "",
    Ubicacion: "",
  });

  // Formateador seguro para números (evita romperse con null/undefined)
  const makeNumberFormatter = (opts = {}) => {
    const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = opts;

    return (params) => {
      const raw = params?.value;

      if (raw === null || raw === undefined) return ""; // celda vacía
      const num = Number(raw);
      if (Number.isNaN(num)) return "";

      return num.toLocaleString("es-MX", {
        minimumFractionDigits,
        maximumFractionDigits,
      });
    };
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  const [socket, setSocket] = useState(null);

  const [filterOptions, setFilterOptions] = useState({
    productos: [],
    canales: [],
    ubicaciones: [],
  });

  // Cliente axios para planner
  const plannerApi = useMemo(() => {
    if (!user) {
      return axios.create({ baseURL: PLANNER_BASE });
    }

    return axios.create({
      baseURL: PLANNER_BASE,
      headers: {
        "x-app-user": user.AppUser,
        "x-db-name": user.dbName, // 👈 aquí pasamos el DBName al middleware
      },
    });
  }, [user]);

  const handleChangeFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  // 1) Abrir sesión (o recuperar la existente)
  const openSession = useCallback(async () => {
    if (!user) return null;
    const body = {
      dbName: user.dbName, // tu multi-tenant actual
      freq,
    };
    const { data } = await plannerApi.post("/session/open", body);
    setSession(data);
    return data;
  }, [plannerApi, user, freq]);

  // 2) Bootstrap de la sesión (generar planner_cells para la ventana)
  const bootstrapSession = useCallback(
    async (sessionId) => {
      const body = {
        anchorDate,
        pastMonths: Number(pastMonths),
        futureMonths: Number(futureMonths),
        yoyMode,
      };
      const { data } = await plannerApi.post(`/${sessionId}/bootstrap`, body);
      console.log("bootstrap result", data);
      return data; // ⬅️ importante
    },
    [plannerApi, anchorDate, pastMonths, futureMonths, yoyMode]
  );

  // 3) Cargar matriz (paginada desde el backend) usando page/size
const fetchMatrix = useCallback(
  async (sessionId, pageArg, sizeArg, filtrosArg) => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const effectivePage = pageArg ?? page;       // 0-based (DataGrid)
      const effectiveSize = sizeArg ?? pageSize;   // filas por página

      const params = new URLSearchParams();
      // Backend espera page 1-based
      params.set("page", String(effectivePage + 1));
      params.set("size", String(effectiveSize));

      const f = filtrosArg || filters;
      if (f.Producto) params.set("Producto", f.Producto);
      if (f.Canal) params.set("Canal", f.Canal);
      if (f.Ubicacion) params.set("Ubicacion", f.Ubicacion);

      // 👉 Nuevo: mandamos anchorDate al backend para filtrar por fecha
      if (anchorDate) {
        params.set("anchorDate", anchorDate); // formato YYYY-MM-DD
      }

      const { data } = await plannerApi.get(
        `/${sessionId}/matrix?${params.toString()}`
      );

      const transformed = (data.rows || []).map((row) => {
        // Normalizamos Fecha a YYYY-MM-DD
        let fechaNorm = "";
        const raw = row.Fecha;

        if (raw) {
          if (typeof raw === "string") {
            // "2025-01-01T00:00:00.000Z" o "2025-01-01"
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

        // Periodo en formato DD-MM-YYYY solo para mostrar
        let periodoDisplay = fechaNorm;
        if (fechaNorm) {
          const [y, m, d] = fechaNorm.split("-");
          if (y && m && d) {
            periodoDisplay = `${d}-${m}-${y}`;
          }
        }

        return {
          ...row,
          FechaNorm: fechaNorm,          // por si lo queremos usar después
          Periodo: periodoDisplay,       // lo que ve el usuario
          id: buildCellId({ ...row, session_id: sessionId }),
        };
      });

      console.log("Sample row matrix:", transformed[0]);

      setRows(transformed);
      setRowCount(data.total || transformed.length);
    } catch (err) {
      console.error(
        "Error al cargar matriz del planner:",
        err.response?.data || err
      );
    } finally {
      setLoading(false);
    }
  },
  [plannerApi, page, pageSize, filters, anchorDate]
);

  // 4) Flujo completo: open → join → bootstrap → matrix
  const handleInitPlanner = async () => {
    try {
      const s = await openSession();
      if (!s) return;

      await plannerApi.post(`/${s.session_id}/participants/join`);

      const info = await bootstrapSession(s.session_id);
      console.log("bootstrap (init) ->", info);

      // Cargar filtros globales
      await fetchFilterOptions(s.session_id);

      // Primera carga: offset 0
      await fetchMatrix(s.session_id, 0, pageSize, filters);
      setPage(0);
    } catch (err) {
      console.error("Error inicializando Planner:", err.response?.data || err);
    }
  };

  const handleRebootstrap = async () => {
    if (!session) return;
    try {
      await plannerApi.post(`/${session.session_id}/participants/join`);

      const info = await bootstrapSession(session.session_id);
      console.log("bootstrap (rebootstrap) ->", info);

      // Refrescamos opciones de filtro por si cambiaron combos
      await fetchFilterOptions(session.session_id);

      await fetchMatrix(session.session_id, 0, pageSize, filters);
      setPage(0);
    } catch (err) {
      console.error(
        "Error aplicando ventana (bootstrap):",
        err.response?.data || err
      );
    }
  };

  // Guardado usando la nueva API de edición (processRowUpdate)
  const handleProcessRowUpdate = async (newRow, oldRow) => {
    // Si no hay sesión/usuario, solo deja que el grid actualice la fila en memoria
    if (!session || !user) return newRow;

    const planCambio =
      newRow.plan_fcst !== oldRow.plan_fcst && newRow.plan_fcst !== undefined;

    const comentarioCambio =
      newRow.commentText !== oldRow.commentText &&
      newRow.commentText !== undefined;

    // Si nada relevante cambió, no pegamos al backend
    if (!planCambio && !comentarioCambio) {
      return newRow;
    }

    const payloadBase = {
      // 👇 clave única de la celda en planner_cells
      cellId: newRow._id,
      // aún mandamos la llave lógica por compatibilidad / auditoría
      Producto: newRow.Producto,
      Canal: newRow.Canal,
      Ubicacion: newRow.Ubicacion,
      Fecha: newRow.Periodo || formatFecha(newRow.Fecha),
      user: user.AppUser,
    };

    setSaving(true);

    try {
      // 1) plan_fcst
      if (planCambio) {
        const plan =
          newRow.plan_fcst === null || newRow.plan_fcst === ""
            ? null
            : Number(newRow.plan_fcst);

        if (plan != null && (!Number.isFinite(plan) || plan < 0)) {
          console.warn("plan_fcst inválido, se revierte:", plan);
          // devolvemos la fila vieja para que el grid revierta el cambio
          return oldRow;
        }

        await plannerApi.put(`/${session.session_id}/cell`, {
          ...payloadBase,
          plan_fcst: plan,
        });
      }

      // 2) comentario (si hay texto)
      if (comentarioCambio) {
        const texto = String(newRow.commentText || "").trim();
        if (texto) {
          await plannerApi.put(`/${session.session_id}/cell`, {
            ...payloadBase,
            comment: texto,
          });
        }
      }

      // 3) Actualizamos nuestro estado local de rows
      setRows((prev) =>
        prev.map((row) => (row.id === newRow.id ? { ...row, ...newRow } : row))
      );

      setHasDraftChanges(true);
      return newRow; // el grid mantiene el cambio
    } catch (error) {
      console.error("Error en processRowUpdate:", error);
      // Si hay error, devolvemos la fila anterior y el grid revierte el valor
      return oldRow;
    } finally {
      setSaving(false);
    }
  };

  // 6) Publicar sesión -> demand_forecast_actual
  const handlePublish = async () => {
    if (!session) return;

    setPublishing(true);
    try {
      await plannerApi.post(`/${session.session_id}/close`);

      // 👇 ya “mandaste” los cambios al forecast -> consideramos que no hay pendientes
      setHasDraftChanges(false);

      const offset = page * pageSize;
      await fetchMatrix(session.session_id, offset, pageSize, filters);

      // (opcional) Mensaje en consola
      console.log("Planner: cambios publicados correctamente");
    } catch (err) {
      console.error("Error publicando sesión:", err);
    } finally {
      setPublishing(false);
    }
  };

  // 7) Socket.io para colaboración en tiempo real
  useEffect(() => {
    if (!session || !user) return;

    const s = io(API_BASE, {
      transports: ["websocket"],
      extraHeaders: {
        "x-app-user": user.AppUser,
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
        console.error("Error cerrando socket planner:", e);
      }
    };
  }, [session, user]);

  // 8) Re-cargar matriz cuando cambian paginación o filtros y ya tenemos sesión
  useEffect(() => {
    if (!session) return;
    fetchMatrix(session.session_id, page, pageSize, filters);
  }, [session, page, pageSize, filters, fetchMatrix]);

  // Ajustar automáticamente el YoY-mode según la frecuencia
  useEffect(() => {
    if (freq.startsWith("W-")) {
      setYoyMode("week");
    } else if (freq === "M") {
      setYoyMode("month");
    } else if (freq === "D") {
      setYoyMode("day"); // o 'daily' si así lo espera tu backend
    }
  }, [freq]);

  const handleLeaveSession = async () => {
    if (!session) return;

    setLeaving(true);
    try {
      // Avisar al backend que este usuario salió de la sesión
      await plannerApi.post(`/${session.session_id}/participants/leave`);

      // Limpiar estado local del planner
      setSession(null);
      setRows([]);
      setRowCount(0);
      setHasDraftChanges(false);

      // Opcional: resetear filtros y paginación
      setFilters({ Producto: "", Canal: "", Ubicacion: "" });
      setPage(0);

      // Opcional: limpiar socket explícitamente
      setSocket((prev) => {
        try {
          prev?.disconnect();
        } catch (e) {
          console.error("Error al cerrar socket manualmente:", e);
        }
        return null;
      });
    } catch (err) {
      console.error("Error al cerrar sesión del planner:", err);
    } finally {
      setLeaving(false);
    }
  };

  // Opciones de filtros derivadas de las filas visibles (no exhaustivo pero práctico)
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
          "Error cargando opciones de filtro:",
          err.response?.data || err
        );
      }
    },
    [plannerApi]
  );

  const columns = [
    { field: "Producto", headerName: "Producto", flex: 1, minWidth: 160 },
    { field: "Canal", headerName: "Canal", flex: 1, minWidth: 140 },
    { field: "Ubicacion", headerName: "Ubicación", flex: 1, minWidth: 140 },
{
  field: "Periodo",
  headerName: "Periodo",
  minWidth: 140,
},
{
  field: "prev_year",
  headerName: prevYearLabel,
  type: "number",
  align: "right",
  headerAlign: "right",
  minWidth: 130,
},
    {
      field: "base_fcst",
      headerName: "Pronóstico Estadístico",
      type: "number",
      align: "right",
      headerAlign: "right",
      minWidth: 170,
    },
    {
      field: "plan_fcst",
      headerName: "Pronóstico Planeado",
      type: "number",
      align: "right",
      headerAlign: "right",
      minWidth: 170,
      editable: true,
    },
    {
      field: "commentText",
      headerName: "Comentario",
      flex: 1,
      minWidth: 200,
      editable: true,
    },
  ];

  if (!user) {
    return (
      <Box p={3}>
        <Typography variant="body1">Cargando usuario...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Planner de Demanda (colaborativo)
      </Typography>

      {/* Panel superior: sesión + ventana temporal + estado */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Card sx={{ flex: 1, minHeight: 160 }}>
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

        <Card sx={{ flex: 1, minHeight: 160 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Ventana temporal (bootstrap)
            </Typography>

            <Stack spacing={2}>
              {/* Primera fila */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  type="date"
                  label="Fecha inicial del periodo"
                  size="small"
                  fullWidth
                  value={anchorDate}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setAnchorDate(e.target.value)}
                />

                <TextField
                  label="Periodos pasado"
                  type="number"
                  size="small"
                  fullWidth
                  value={pastMonths}
                  onChange={(e) => setPastMonths(e.target.value)}
                />

                <TextField
                  label="Periodos futuro"
                  type="number"
                  size="small"
                  fullWidth
                  value={futureMonths}
                  onChange={(e) => setFutureMonths(e.target.value)}
                />
              </Stack>

              {/* Segunda fila */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="YoY mode"
                  size="small"
                  fullWidth
                  value={yoyMode}
                  onChange={(e) => setYoyMode(e.target.value)}
                >
                  <MenuItem value="week">Semanal</MenuItem>
                  <MenuItem value="month">Mensual</MenuItem>
                  <MenuItem value="day">Diario</MenuItem>
                </TextField>

                <Box flexGrow={1} />
              </Stack>

              <Box textAlign="right">
                <Button
                  variant="outlined"
                  onClick={handleRebootstrap}
                  disabled={!session}
                >
                  Aplicar ventana (bootstrap)
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minHeight: 160 }}>
  <CardContent>
    <Typography variant="subtitle2" gutterBottom>
      Estado
    </Typography>

    <Typography variant="body2">
      {loading
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
      {hasDraftChanges ? "Hay cambios sin publicar" : "Sin cambios pendientes"}
    </Typography>

    <Box mt={2}>
      <Button
        variant="contained"
        color={hasDraftChanges ? "warning" : "success"}
        disabled={!session || publishing || leaving}
        onClick={handlePublish}
        startIcon={
          publishing ? <CircularProgress size={18} color="inherit" /> : null
        }
      >
        {publishing ? "Publicando…" : "Publicar cambios"}
      </Button>
    </Box>

    <Box mt={1}>
      <Button
        variant="text"
        color="inherit"
        disabled={!session || leaving || publishing}
        onClick={handleLeaveSession}
      >
        {leaving ? "Cerrando sesión…" : "Cerrar sesión"}
      </Button>
    </Box>
  </CardContent>
</Card>
      </Stack>
{session ?(
    <>
      {/* Filtros superiores */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Filtros
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              select
              size="small"
              label="Producto"
              value={filters.Producto}
              onChange={(e) => handleChangeFilter("Producto", e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {filterOptions.productos.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Canal"
              value={filters.Canal}
              onChange={(e) => handleChangeFilter("Canal", e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {filterOptions.canales.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Ubicación"
              value={filters.Ubicacion}
              onChange={(e) => handleChangeFilter("Ubicacion", e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {filterOptions.ubicaciones.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ ml: "auto" }}>
              <Typography variant="caption" color="text.secondary">
                {rowCount.toLocaleString()} celdas
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* DataGrid principal */}
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows || []}
          columns={columns}
          getRowId={(row) =>
            row._id ||
            row.id ||
            `${row.session_id || ""}|${row.Producto}|${row.Canal}|${
              row.Ubicacion
            }|${row.Periodo || row.Fecha || ""}`
          }
          loading={loading}
          pagination
          paginationMode="server"
          // 👇 Usamos el modelo de paginación controlado
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            console.log("Pagina cambió ->", model); // para que veas el cambio en consola
            setPage(model.page); // 0-based para DataGrid
            setPageSize(model.pageSize); // filas por página
          }}
          rowCount={rowCount}
          pageSizeOptions={[50, 100]}
          disableRowSelectionOnClick
          density="compact"
          editMode="cell"
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={(err) =>
            console.error("processRowUpdateError:", err)
          }
        />
      </Box>
      </>
):(
        <Box mt={4}>
    <Typography variant="body1" color="text.secondary" align="center">
      No hay sesión activa. Abre o carga una sesión para empezar a planear.
    </Typography>
  </Box>
)}
    </Box>
  );
};

export default PlaneacionDemandaPlanner;
